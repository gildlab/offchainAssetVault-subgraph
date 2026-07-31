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
  Bytes,
  DataSourceContext,
  Value,
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  createDepositEvent,
  createNewCloneEvent,
  createMockERC20Functions,
  createWithdrawEvent,
  createDeploymentEvent,
  createMockReceiptFunction,
  createTransferEvent,
  createMockBalanceOfFunction,
  createMockTotalSupplyFunction,
} from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import {
  handleDeposit,
  handleWithdraw,
  handleTransfer,
} from "../src/OffchainAssetReceiptVault";
import { SECONDS_PER_DAY, ZERO, ZERO_ADDRESS } from "../src/utils";

function dayStart(timestamp: BigInt): BigInt {
  return timestamp.div(SECONDS_PER_DAY).times(SECONDS_PER_DAY);
}

function dayStatId(vaultId: string, timestamp: BigInt): string {
  return vaultId + "-" + dayStart(timestamp).toString();
}

function deployVault(
  deployer: Address,
  assetVaultClone: Address,
  receipt: Address,
  wrapper: Address,
  authorizerClone: Address,
  dataSourceAddress: string,
): void {
  createMockReceiptFunction(assetVaultClone, receipt);
  handleDeployment(
    createDeploymentEvent(
      deployer,
      assetVaultClone,
      wrapper,
      Address.fromString(dataSourceAddress),
    ),
  );
  handleNewClone(
    createNewCloneEvent(
      deployer,
      Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS),
      authorizerClone,
    ),
  );
  createMockERC20Functions(assetVaultClone);
}

describe("VaultDayStat Test", () => {
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

  test("deposit creates VaultDayStat bucket with counts and volume", () => {
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
    const authorizerClone = Address.fromString(
      "0x0000000000000000000000000000000000bbbbbb",
    );

    deployVault(
      deployer,
      assetVaultClone,
      receipt,
      wrapper,
      authorizerClone,
      dataSourceAddress,
    );

    const shares = BigInt.fromString("1000000000000000000");
    const depositEvent = createDepositEvent(
      deployer,
      deployer,
      shares,
      shares,
      BigInt.fromString("1"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    depositEvent.block.timestamp = BigInt.fromI32(86400 * 100 + 3600);
    handleDeposit(depositEvent);

    const id = dayStatId(
      assetVaultClone.toHex(),
      BigInt.fromI32(86400 * 100 + 3600),
    );
    assert.entityCount("VaultDayStat", 1);
    assert.fieldEquals("VaultDayStat", id, "id", id);
    assert.fieldEquals(
      "VaultDayStat",
      id,
      "offchainAssetReceiptVault",
      assetVaultClone.toHex(),
    );
    assert.fieldEquals(
      "VaultDayStat",
      id,
      "day",
      BigInt.fromI32(86400 * 100).toString(),
    );
    assert.fieldEquals("VaultDayStat", id, "depositCount", "1");
    assert.fieldEquals("VaultDayStat", id, "withdrawCount", "0");
    assert.fieldEquals("VaultDayStat", id, "transferCount", "0");
    assert.fieldEquals("VaultDayStat", id, "depositVolume", shares.toString());
    assert.fieldEquals("VaultDayStat", id, "withdrawVolume", "0");
    assert.fieldEquals("VaultDayStat", id, "transferVolume", "0");
  });

  test("same-day deposits accumulate on one VaultDayStat", () => {
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
    const authorizerClone = Address.fromString(
      "0x0000000000000000000000000000000000bbbbbb",
    );

    deployVault(
      deployer,
      assetVaultClone,
      receipt,
      wrapper,
      authorizerClone,
      dataSourceAddress,
    );

    const shares1 = BigInt.fromString("1000000000000000000");
    const shares2 = BigInt.fromString("2000000000000000000");

    const deposit1 = createDepositEvent(
      deployer,
      deployer,
      shares1,
      shares1,
      BigInt.fromString("1"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    deposit1.block.timestamp = BigInt.fromI32(86400 * 100);
    handleDeposit(deposit1);

    const deposit2 = createDepositEvent(
      deployer,
      deployer,
      shares2,
      shares2,
      BigInt.fromString("2"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    deposit2.block.timestamp = BigInt.fromI32(86400 * 100 + 3600);
    handleDeposit(deposit2);

    const id = dayStatId(assetVaultClone.toHex(), BigInt.fromI32(86400 * 100));
    assert.entityCount("VaultDayStat", 1);
    assert.fieldEquals("VaultDayStat", id, "depositCount", "2");
    assert.fieldEquals(
      "VaultDayStat",
      id,
      "depositVolume",
      shares1.plus(shares2).toString(),
    );
  });

  test("deposits on different UTC days create separate VaultDayStat rows", () => {
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
    const authorizerClone = Address.fromString(
      "0x0000000000000000000000000000000000bbbbbb",
    );

    deployVault(
      deployer,
      assetVaultClone,
      receipt,
      wrapper,
      authorizerClone,
      dataSourceAddress,
    );

    const shares = BigInt.fromString("1000000000000000000");

    const depositDay100 = createDepositEvent(
      deployer,
      deployer,
      shares,
      shares,
      BigInt.fromString("1"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    depositDay100.block.timestamp = BigInt.fromI32(86400 * 100);
    handleDeposit(depositDay100);

    const depositDay101 = createDepositEvent(
      deployer,
      deployer,
      shares,
      shares,
      BigInt.fromString("2"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    depositDay101.block.timestamp = BigInt.fromI32(86400 * 101);
    handleDeposit(depositDay101);

    assert.entityCount("VaultDayStat", 2);

    const id100 = dayStatId(
      assetVaultClone.toHex(),
      BigInt.fromI32(86400 * 100),
    );
    const id101 = dayStatId(
      assetVaultClone.toHex(),
      BigInt.fromI32(86400 * 101),
    );
    assert.fieldEquals(
      "VaultDayStat",
      id100,
      "day",
      BigInt.fromI32(86400 * 100).toString(),
    );
    assert.fieldEquals("VaultDayStat", id100, "depositCount", "1");
    assert.fieldEquals(
      "VaultDayStat",
      id101,
      "day",
      BigInt.fromI32(86400 * 101).toString(),
    );
    assert.fieldEquals("VaultDayStat", id101, "depositCount", "1");
  });

  test("withdraw updates withdrawCount and withdrawVolume on VaultDayStat", () => {
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
    const authorizerClone = Address.fromString(
      "0x0000000000000000000000000000000000bbbbbb",
    );

    deployVault(
      deployer,
      assetVaultClone,
      receipt,
      wrapper,
      authorizerClone,
      dataSourceAddress,
    );

    const depositShares = BigInt.fromString("1000000000000000000");
    const withdrawShares = BigInt.fromString("400000000000000000");

    const depositEvent = createDepositEvent(
      deployer,
      deployer,
      depositShares,
      depositShares,
      BigInt.fromString("1"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    depositEvent.block.timestamp = BigInt.fromI32(86400 * 100);
    handleDeposit(depositEvent);

    const withdrawEvent = createWithdrawEvent(
      deployer,
      deployer,
      deployer,
      withdrawShares,
      withdrawShares,
      BigInt.fromString("1"),
      Bytes.fromHexString("0x"),
      assetVaultClone,
    );
    withdrawEvent.block.timestamp = BigInt.fromI32(86400 * 100 + 3600);
    handleWithdraw(withdrawEvent);

    const id = dayStatId(assetVaultClone.toHex(), BigInt.fromI32(86400 * 100));
    assert.entityCount("VaultDayStat", 1);
    assert.fieldEquals("VaultDayStat", id, "depositCount", "1");
    assert.fieldEquals("VaultDayStat", id, "withdrawCount", "1");
    assert.fieldEquals(
      "VaultDayStat",
      id,
      "depositVolume",
      depositShares.toString(),
    );
    assert.fieldEquals(
      "VaultDayStat",
      id,
      "withdrawVolume",
      withdrawShares.toString(),
    );
  });

  test("wallet-to-wallet transfer increments transferCount; mint and burn do not", () => {
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
    const authorizerClone = Address.fromString(
      "0x0000000000000000000000000000000000bbbbbb",
    );
    const sender = Address.fromString(
      "0x0000000000000000000000000000000000eeeeee",
    );
    const recipient = Address.fromString(
      "0x0000000000000000000000000000000000ffffff",
    );
    const zero = Address.fromString(ZERO_ADDRESS);
    const amount = BigInt.fromString("1000000000000000000");
    const half = BigInt.fromString("500000000000000000");

    deployVault(
      deployer,
      assetVaultClone,
      receipt,
      wrapper,
      authorizerClone,
      dataSourceAddress,
    );

    // Mint (from zero) — must not create a VaultDayStat transfer bucket
    createMockTotalSupplyFunction(assetVaultClone, amount);
    createMockBalanceOfFunction(assetVaultClone, sender, amount);
    const mint = createTransferEvent(zero, sender, amount, assetVaultClone);
    mint.block.timestamp = BigInt.fromI32(86400 * 100);
    handleTransfer(mint);
    assert.entityCount("VaultDayStat", 0);

    // Wallet-to-wallet — creates day stat with transferCount=1
    createMockBalanceOfFunction(assetVaultClone, sender, half);
    createMockBalanceOfFunction(assetVaultClone, recipient, half);
    createMockTotalSupplyFunction(assetVaultClone, amount);
    const walletTransfer = createTransferEvent(
      sender,
      recipient,
      half,
      assetVaultClone,
    );
    walletTransfer.block.timestamp = BigInt.fromI32(86400 * 100 + 3600);
    handleTransfer(walletTransfer);

    const id = dayStatId(assetVaultClone.toHex(), BigInt.fromI32(86400 * 100));
    assert.entityCount("VaultDayStat", 1);
    assert.fieldEquals("VaultDayStat", id, "transferCount", "1");
    assert.fieldEquals("VaultDayStat", id, "transferVolume", half.toString());
    assert.fieldEquals("VaultDayStat", id, "depositCount", "0");
    assert.fieldEquals("VaultDayStat", id, "withdrawCount", "0");

    // Burn (to zero) — must not bump transferCount/volume
    createMockBalanceOfFunction(assetVaultClone, recipient, ZERO);
    createMockTotalSupplyFunction(assetVaultClone, half);
    const burn = createTransferEvent(recipient, zero, half, assetVaultClone);
    burn.block.timestamp = BigInt.fromI32(86400 * 100 + 3600);
    handleTransfer(burn);

    assert.entityCount("VaultDayStat", 1);
    assert.fieldEquals("VaultDayStat", id, "transferCount", "1");
    assert.fieldEquals("VaultDayStat", id, "transferVolume", half.toString());
  });
});
