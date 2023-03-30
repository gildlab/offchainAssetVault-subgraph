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
  it("Checks ReceiptInformation event data", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta ="0xff0a89c674ee7874a5005854789cab56ca2fca4ccfcc53b252323454d2514acf4c8c2f4a2dc82f2a018a04e64654a696577ab99786161b965704958779e51a973a657a65263a19e7a765a56519e7b947068607ba9847143929d50200f0f31a13011bffc47a6299e8a91102706170706c69636174696f6e2f6a736f6e03676465666c6174651bffa8e8a9b9cf4a31782e516d6575487a625479573753516579576f4d4a6b6e3172384563364134576234384648584c3472707a6d4350594da200785d516d58796577794a477555733177785277564a6d337542694a696142336f666a666a336e475951575144375872422c516d5271734552703651324d5a3263614e724762377461393133717657613256566370653143474879327676616a011bff9fae3cc645f463"

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
});
