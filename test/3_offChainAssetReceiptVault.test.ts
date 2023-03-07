import { ReadWriteTier, TestErc20 } from "../typechain";
import { ethers } from "hardhat";

import {
  getEventArgs,
  ADDRESS_ZERO,
  fixedPointMul,
  ONE,
  fixedPointDiv,
  fixedPointDivRound,
  waitForSubgraphToBeSynced,
} from "./utils";

import {
  SetERC20TierEvent,
  CertifyEvent,
  SnapshotEvent,
  ConfiscateSharesEvent,
  ConfiscateReceiptEvent,
  SetERC1155TierEvent,
  SnapshotWithDataEvent,
} from "../typechain/contracts/vault/offchainAsset/OffchainAssetReceiptVault";

import { DepositWithReceiptEvent } from "../typechain/contracts/vault/receipt/ReceiptVault";
import { receipt, vault } from "./2_createChild.test";
import { subgraph } from "./1_factory.test";
import { FetchResult } from "apollo-fetch";
import { expect } from "chai";
import { ReceiptVaultInformationEvent } from "../typechain-types/contracts/vault/receipt/ReceiptVault";

const assert = require("assert");

let TierV2TestContract: ReadWriteTier;
let expectedName = "OffchainAssetVaul";
let expectedSymbol = "OAV";

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
  it("Checks ReceiptVaultInformation event is emitted", async function () {
    const signers = await ethers.getSigners();
    const alice = signers[0];
    const { sender, vaultInformation } = (await getEventArgs(
        await vault.connect(alice).receiptVaultInformation([1]),
        "ReceiptVaultInformation",
        vault
    )) as ReceiptVaultInformationEvent["args"];

        await vault.connect(alice).receiptVaultInformation([2])

    // assert(
    //     sender === alice.address,
    //     `Incorrect sender. Expected ${alice.address} got ${sender}`
    // );
    //
    // assert(
    //     vaultInformation === "0x01",
    //     `Incorrect sender. Expected 0x01 got ${vaultInformation}`
    // );
  });
});
