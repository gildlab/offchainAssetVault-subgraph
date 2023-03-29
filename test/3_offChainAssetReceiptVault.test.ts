import { ReadWriteTier, TestErc20 } from "../typechain";
import { ethers } from "hardhat";

import {
  fixedPointMul,
  ONE,
  fixedPointDiv,
  waitForSubgraphToBeSynced,
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

  it("Mints with data", async function () {
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
      ["mint(uint256,address,uint256,bytes)"](shares, alice.address, ONE, [1]);

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

    let meta ="0xff0a89c674ee7874a40058bb789c7d8fcb0ac2301045ff65d67e41b7e2c2850f50702112a6c9a8236913932956a4ff6e520b5a11b3bcf79ccccc030c476ff1bec48aa080b28409447da60aa17880dc7d4e5d79212da909746d389081620f9e49690ac247d628945a1f9c6952a46e682d655e9ca05551bb90fb0a5be5bcb0ab231c7adc679f621ef52dbfa747095c9ff26f2c3607eb01ddbdc86e3ce78fb8cdd8a6a7baf13a7fa405b6ab814ad2f7d53f44322c2ea4a4f1d6a1f95c7c3e9b7eb85d7a4f7ac287c4011bffa8e8a9b9cf4a3102706170706c69636174696f6e2f6a736f6e03676465666c617465a200583181782e516d567458476771704154426a70324e67433376725048554a534554747153733570686e454c54696f5678453138011bff9fae3cc645f463"

    await vault.connect(alice).receiptVaultInformation(arrayify(meta));
    // await vault.connect(alice).receiptVaultInformation([3]);

    const query = `{
        offchainAssetReceiptVault(id:"${vault.address.toLowerCase()}"){
          id
          receiptVaultInformations {
            information
            payload
            schema
            magicNumber
            information
            contentEncoding
            contentLanguage
            contentType
          }
        }
      }`;
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    //
    // const response = (await subgraph({ query })) as FetchResult;
    // const vaultData = response.data.offchainAssetReceiptVault;
    //
    // assert.equal(vaultData.id, vault.address.toLowerCase());
    // assert.equal(vaultData.receiptVaultInformations[0].information, '0x03');
  });
});
