import { ReadWriteTier, TestErc20 } from "../typechain";
import { ethers } from "hardhat";

import {
  fixedPointMul,
  ONE,
  fixedPointDiv,
  waitForSubgraphToBeSynced,
  OA_SCHEMA, OA_STRUCTURE
} from "./utils";


import { receipt, vault } from "./2_createChild.test";
import { subgraph } from "./1_factory.test";
import { FetchResult } from "apollo-fetch";
import { arrayify } from "ethers/lib/utils";

const assert = require("assert");

let TierV2TestContract: ReadWriteTier;

describe("OffChainAssetReceiptVault", async function () {
  beforeEach(async () => {
    const TierV2Test = await ethers.getContractFactory("ReadWriteTier");
    TierV2TestContract = (await TierV2Test.deploy()) as ReadWriteTier;
    await TierV2TestContract.deployed();
  });

  it("Mints", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    const testErc20 = await ethers.getContractFactory("TestErc20");
    const asset = (await testErc20.deploy()) as TestErc20;
    await asset.deployed();

    await vault
      .connect(alice)
      .grantRole(await vault.connect(alice).DEPOSITOR(), alice.address);

    const assets = ethers.BigNumber.from(5000);
    await asset.transfer(alice.address, assets);
    await asset.connect(alice).increaseAllowance(vault.address, assets);

    const shares = fixedPointMul(assets, ONE).add(1);

    await vault
      .connect(alice)
      ["mint(uint256,address,uint256,bytes)"](shares, alice.address, ONE, []);

    const expectedAssets = fixedPointDiv(shares, ONE);
    const aliceBalanceAfter = await receipt
      .connect(alice)
      ["balanceOf(address,uint256)"](alice.address, 1);

    assert(
      aliceBalanceAfter.eq(expectedAssets),
      `wrong assets. expected ${expectedAssets} got ${aliceBalanceAfter}`
    );
  });
  it("Checks ReceiptVaultInformation event data", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta ="0xff0a89c674ee7874a400589e789c6d8d310bc2301085ff4ab9b9936356717011c1c141a4a4c9a927a989c90529a5ffdd4b152cea6df7def7de1bc0520a4ef71bdd2128d8990b76ba614cbc801ad2f4821a80fb507cdf5ed1b03811ef99225a500708848dc1c87422a319c50dd1db2c52f3d0ce21c3719242613095ba6fe0b39038d2ed2c1d4cec8ab07da3d5fe858ef5cfe09f345a621f45c9c1796de77deb55b59c8547b927ee865cb6011bffa8e8a9b9cf4a3102706170706c69636174696f6e2f6a736f6e03676465666c617465a200782e516d5670733853694258484147594662454a636763475644476647544e574d7764766368717a6e436d506f6a5874011bff9fae3cc645f463"

    await vault.connect(alice).receiptVaultInformation(arrayify(meta));

    const query = `{
        offchainAssetReceiptVault(id:"${vault.address.toLowerCase()}"){
          id
          receiptVaultInformations {
            information
            payload
            magicNumber
            contentEncoding
            contentType
          }
        }
      }`;
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const response = (await subgraph({ query })) as FetchResult;
    const vaultData = response.data.offchainAssetReceiptVault.receiptVaultInformations[0];

    assert.equal(BigInt(vaultData.magicNumber), OA_SCHEMA);
    assert.equal(vaultData.contentEncoding, "deflate");
    assert.equal(vaultData.contentType, "application/json");
    assert.equal(vaultData.information, meta);
  });
  it("Checks ReceiptVaultInformation does not update receiptVaultInformation if data not start with rain mn", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta = [5]

    const query = `{
          receiptVaultInformations {
            information
            payload
            magicNumber
            contentEncoding
            contentType
        }
      }`;

    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const responseBef = (await subgraph({ query })) as FetchResult;
    const receiptVaultInformationsLengthBef = responseBef.data.receiptVaultInformations.length;

    await vault.connect(alice).receiptVaultInformation(arrayify(meta));

    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const response = (await subgraph({ query })) as FetchResult;
    const receiptVaultInformationsLengthAft = response.data.receiptVaultInformations.length;

    assert.equal(receiptVaultInformationsLengthBef, receiptVaultInformationsLengthAft);
  });
  it("Checks ReceiptInformation event data", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta ="0xff0a89c674ee7874a5005823789cab56ca4bcc4d55b2523254d2512a4fccc9492d81724a324b722012b500cb540a76011bffc47a6299e8a91102706170706c69636174696f6e2f6a736f6e03676465666c6174651bffa8e8a9b9cf4a31782e516d4e6d79547033596f467335676d3476726d386d3751566e6f5631414b766b7565444a7155364835416834757aa200782e516d63707241626d3831667a366a625975336f516361574639757671724e4e596e3174595a464d465a363264745a011bff9fae3cc645f463"

    const testErc20 = await ethers.getContractFactory("TestErc20");
    const asset = (await testErc20.deploy()) as TestErc20;
    await asset.deployed();

    await vault
      .connect(alice)
      .grantRole(await vault.connect(alice).DEPOSITOR(), alice.address);

    const assets = ethers.BigNumber.from(5000);
    await asset.transfer(alice.address, assets);
    await asset.connect(alice).increaseAllowance(vault.address, assets);


    const shares = fixedPointMul(assets, ONE).add(1);

    await vault
      .connect(alice)
      ["mint(uint256,address,uint256,bytes)"](shares, alice.address, ONE, arrayify(meta));

    const query = `{
        receiptInformations(orderDirection: asc) {
          information
          contentType
          magicNumber
          contentEncoding
        }
      }`;
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const response = (await subgraph({ query })) as FetchResult;
    const data = response.data.receiptInformations[0];

    assert.equal(BigInt(data.magicNumber), OA_STRUCTURE);
    assert.equal(data.contentEncoding, "deflate");
    assert.equal(data.contentType, "application/json");
    assert.equal(data.information, meta);
  });
  it("Checks ReceiptInformation does not update receiptInformation if data not start with rain m", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta = [5]

    const testErc20 = await ethers.getContractFactory("TestErc20");
    const asset = (await testErc20.deploy()) as TestErc20;
    await asset.deployed();

    await vault
      .connect(alice)
      .grantRole(await vault.connect(alice).DEPOSITOR(), alice.address);

    const assets = ethers.BigNumber.from(5000);
    await asset.transfer(alice.address, assets);
    await asset.connect(alice).increaseAllowance(vault.address, assets);

    const query = `{
        receiptInformations(orderDirection: asc) {
          information
          contentType
          magicNumber
          contentEncoding
        }
      }`;

    const shares = fixedPointMul(assets, ONE).add(1);

    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const responseBef = (await subgraph({ query })) as FetchResult;
    const receiptInformationsLengthBef = responseBef.data.receiptInformations.length;

    await vault
      .connect(alice)
      ["mint(uint256,address,uint256,bytes)"](shares, alice.address, ONE, arrayify(meta));


    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const response = (await subgraph({ query })) as FetchResult;
    const receiptInformationsLengthAft = response.data.receiptInformations.length;

    assert.equal(receiptInformationsLengthAft, receiptInformationsLengthBef);
  });
});
