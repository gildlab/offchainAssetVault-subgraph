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

    await vault.connect(alice).receiptVaultInformation([3]);

    const query = `{
        offchainAssetReceiptVault(id:"${vault.address.toLowerCase()}"){
          id
          receiptVaultInformations {
            information
          }
        }
      }`;
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");

    const response = (await subgraph({ query })) as FetchResult;
    const vaultData = response.data.offchainAssetReceiptVault;

    assert.equal(vaultData.id, vault.address.toLowerCase());
    assert.equal(vaultData.receiptVaultInformations[0].information, '0x03');
  });
});
