import {
  test,
  assert,
  clearStore,
  describe,
  afterEach,
  beforeAll,
  clearInBlockStore,
  dataSourceMock,
} from "matchstick-as";
import {
  Address,
  DataSourceContext,
  Value,
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  createDeploymentEvent,
  createMockERC20Functions,
  createMockReceiptFunction,
  createTransferEvent,
  createMockBalanceOfFunction,
  createMockTotalSupplyFunction,
} from "./mock.test";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { handleTransfer } from "../src/OffchainAssetReceiptVault";
import { ZERO, ZERO_ADDRESS } from "../src/utils";

describe("Transfer Test", () => {
  const dataSourceAddress = "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A";

  beforeAll(() => {
    let context = new DataSourceContext();
    context.set("contextVal", Value.fromI32(325));
    dataSourceMock.setReturnValues(dataSourceAddress, "polygon-amoy", context);
  });

  afterEach(() => {
    clearStore();
    clearInBlockStore();
  });

  test("handle transfer updates share transfer count and token holder count", () => {
    const deployer = Address.fromString(
      "0x1234567890123456789012345678901234567890",
    );
    const assetVaultClone = Address.fromString(
      "0x0000000000000000000000000000000000aaaaaa",
    );
    const receipt = Address.fromString(
      "0x0000000000000000000000000000000000cccccc",
    );
    const wrapper = Address.fromString(
      "0x0000000000000000000000000000000000dddddd",
    );
    const sender = Address.fromString(
      "0x0000000000000000000000000000000000eeeeee",
    );
    const recipient = Address.fromString(
      "0x0000000000000000000000000000000000ffffff",
    );
    const zero = Address.fromString(ZERO_ADDRESS);

    createMockReceiptFunction(assetVaultClone, receipt);
    handleDeployment(
      createDeploymentEvent(
        deployer,
        assetVaultClone,
        wrapper,
        Address.fromString(dataSourceAddress),
      ),
    );
    createMockERC20Functions(assetVaultClone);

    const transferAmount = BigInt.fromString("1000000000000000000");
    const senderBalanceAfter = BigInt.fromString("500000000000000000");
    const recipientBalanceAfter = transferAmount;

    createMockTotalSupplyFunction(assetVaultClone, transferAmount);
    createMockBalanceOfFunction(assetVaultClone, sender, senderBalanceAfter);
    createMockBalanceOfFunction(
      assetVaultClone,
      recipient,
      recipientBalanceAfter,
    );

    handleTransfer(
      createTransferEvent(sender, recipient, transferAmount, assetVaultClone),
    );

    assert.entityCount("SharesTransfer", 1);
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "shareTransferCount",
      "1",
    );
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "tokenHolderCount",
      "2",
    );

    createMockBalanceOfFunction(assetVaultClone, sender, ZERO);
    createMockTotalSupplyFunction(assetVaultClone, recipientBalanceAfter);

    handleTransfer(
      createTransferEvent(
        sender,
        recipient,
        senderBalanceAfter,
        assetVaultClone,
      ),
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "shareTransferCount",
      "2",
    );
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "tokenHolderCount",
      "1",
    );

    createMockBalanceOfFunction(assetVaultClone, recipient, ZERO);
    createMockTotalSupplyFunction(assetVaultClone, ZERO);

    handleTransfer(
      createTransferEvent(
        recipient,
        zero,
        recipientBalanceAfter,
        assetVaultClone,
      ),
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "shareTransferCount",
      "3",
    );
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "tokenHolderCount",
      "0",
    );

    createMockBalanceOfFunction(assetVaultClone, recipient, transferAmount);
    createMockTotalSupplyFunction(assetVaultClone, transferAmount);

    handleTransfer(
      createTransferEvent(zero, recipient, transferAmount, assetVaultClone),
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "shareTransferCount",
      "4",
    );
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHex(),
      "tokenHolderCount",
      "1",
    );
  });
});
