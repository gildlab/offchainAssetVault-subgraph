import { NewClone } from "../generated/CloneFactory/CloneFactory";
import { Deployment } from "../generated/StoxUnifiedDeployer/StoxUnifiedDeployer";
import { newMockEvent, createMockedFunction } from "matchstick-as";
import {
  Authorizer,
  Deployer,
  OffchainAssetReceiptVault,
} from "../generated/schema";
import {
  BigInt,
  ethereum,
  Address,
  Bytes,
  Value,
} from "@graphprotocol/graph-ts";
import {
  OffchainAssetReceiptVaultTemplate,
  OffchainAssetReceiptVaultAuthorizerV1Template,
} from "../generated/templates";
import { ZERO } from "../src/utils";
import {
  AuthorizerSet,
  Certify as CertifyEvent,
  Deposit,
  Withdraw,
  ConfiscateShares as ConfiscateSharesEvent,
  ConfiscateReceipt as ConfiscateReceiptEvent,
  OffchainAssetReceiptVaultInitializedV2,
  Transfer,
} from "../generated/templates/OffchainAssetReceiptVaultTemplate/OffchainAssetReceiptVault";
import {
  RoleAdminChanged,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/templates/OffchainAssetReceiptVaultAuthorizerV1Template/OffchainAssetReceiptVaultAuthorizerV1";

export class VaultConfig {
  address: Address;
  name: String;
  symbol: String;

  constructor(address: Address, name: String, symbol: String) {
    this.address = address;
    this.name = name;
    this.symbol = symbol;
  }
}

export class ReceiptVaultConfig {
  vaultConfig: VaultConfig;
  receipt: Address;

  constructor(vaultConfig: VaultConfig, receipt: Address) {
    this.vaultConfig = vaultConfig;
    this.receipt = receipt;
  }
}

export class OffchainAssetReceiptVaultConfigV2 {
  initialAdmin: Address;
  receiptVaultConfig: ReceiptVaultConfig;

  constructor(initialAdmin: Address, receiptVaultConfig: ReceiptVaultConfig) {
    this.initialAdmin = initialAdmin;
    this.receiptVaultConfig = receiptVaultConfig;
  }
}

// event NewClone(address sender, address implementation, address clone);
export function createNewCloneEvent(
  sender: Address,
  implementation: Address,
  clone: Address,
): NewClone {
  let mockEvent = newMockEvent();
  let newCloneEvent = new NewClone(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  newCloneEvent.parameters = new Array();
  newCloneEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  newCloneEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation),
    ),
  );
  newCloneEvent.parameters.push(
    new ethereum.EventParam("clone", ethereum.Value.fromAddress(clone)),
  );
  return newCloneEvent;
}

// event SetAuthorizer(address sender, address authorizer);
export function createSetAuthorizerEvent(
  sender: Address,
  authorizer: Address,
  contractAddress: Address,
): AuthorizerSet {
  let mockEvent = newMockEvent();
  let setAuthorizerEvent = new AuthorizerSet(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  setAuthorizerEvent.parameters = new Array();
  setAuthorizerEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  setAuthorizerEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer),
    ),
  );
  return setAuthorizerEvent;
}

// event Certify(address sender, uint256 certifyUntil, bool forceUntil, bytes data);
export function createCertifyEvent(
  sender: Address,
  certifyUntil: BigInt,
  force: boolean,
  data: Bytes,
  contractAddress: Address,
): CertifyEvent {
  let mockEvent = newMockEvent();
  let certifyEvent = new CertifyEvent(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  certifyEvent.parameters = new Array();
  certifyEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  certifyEvent.parameters.push(
    new ethereum.EventParam(
      "certifyUntil",
      ethereum.Value.fromUnsignedBigInt(certifyUntil),
    ),
  );
  certifyEvent.parameters.push(
    new ethereum.EventParam("forceUntil", ethereum.Value.fromBoolean(force)),
  );
  certifyEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data)),
  );
  return certifyEvent;
}

//event Deposit(address sender, address owner, uint256 assets, uint256 shares, uint256 id, bytes receiptInformation);
export function createDepositEvent(
  sender: Address,
  owner: Address,
  amount: BigInt,
  shares: BigInt,
  id: BigInt,
  receiptInformation: Bytes,
  contractAddress: Address,
): Deposit {
  let mockEvent = newMockEvent();
  let depositEvent = new Deposit(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  depositEvent.parameters = new Array();
  depositEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  depositEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
  );
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "assets",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "shares",
      ethereum.Value.fromUnsignedBigInt(shares),
    ),
  );
  depositEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id)),
  );
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "receiptInformation",
      ethereum.Value.fromBytes(receiptInformation),
    ),
  );

  return depositEvent;
}

// event Withdraw(address sender, address receiver, address owner, uint256 assets, uint256 shares, uint256 id, bytes receiptInformation);
export function createWithdrawEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  amount: BigInt,
  shares: BigInt,
  id: BigInt,
  receiptInformation: Bytes,
  contractAddress: Address,
): Withdraw {
  let mockEvent = newMockEvent();
  let withdrawEvent = new Withdraw(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  withdrawEvent.parameters = new Array();
  withdrawEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver)),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam(
      "assets",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam(
      "shares",
      ethereum.Value.fromUnsignedBigInt(shares),
    ),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id)),
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam(
      "receiptInformation",
      ethereum.Value.fromBytes(receiptInformation),
    ),
  );
  return withdrawEvent;
}

//event ConfiscateShares(address sender, address confiscatee, uint256 targetAmount, uint256 confiscated, bytes justification);
export function createConfiscateSharesEvent(
  sender: Address,
  confiscatee: Address,
  targetAmount: BigInt,
  confiscated: BigInt,
  justification: Bytes,
  contractAddress: Address,
): ConfiscateSharesEvent {
  let mockEvent = newMockEvent();
  let confiscateSharesEvent = new ConfiscateSharesEvent(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  confiscateSharesEvent.parameters = new Array();
  confiscateSharesEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  confiscateSharesEvent.parameters.push(
    new ethereum.EventParam(
      "confiscatee",
      ethereum.Value.fromAddress(confiscatee),
    ),
  );
  confiscateSharesEvent.parameters.push(
    new ethereum.EventParam(
      "targetAmount",
      ethereum.Value.fromUnsignedBigInt(targetAmount),
    ),
  );
  confiscateSharesEvent.parameters.push(
    new ethereum.EventParam(
      "confiscated",
      ethereum.Value.fromUnsignedBigInt(confiscated),
    ),
  );
  confiscateSharesEvent.parameters.push(
    new ethereum.EventParam(
      "justification",
      ethereum.Value.fromBytes(justification),
    ),
  );
  return confiscateSharesEvent;
}

//event ConfiscateReceipt(address sender, address confiscatee, uint256 id, uint256 targetAmount, uint256 confiscated, bytes justification);
export function createConfiscateReceiptEvent(
  sender: Address,
  confiscatee: Address,
  id: BigInt,
  targetAmount: BigInt,
  confiscated: BigInt,
  justification: Bytes,
  contractAddress: Address,
): ConfiscateReceiptEvent {
  let mockEvent = newMockEvent();
  let confiscateReceiptEvent = new ConfiscateReceiptEvent(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  confiscateReceiptEvent.parameters = new Array();
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam(
      "confiscatee",
      ethereum.Value.fromAddress(confiscatee),
    ),
  );
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id)),
  );
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam(
      "targetAmount",
      ethereum.Value.fromUnsignedBigInt(targetAmount),
    ),
  );
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam(
      "confiscated",
      ethereum.Value.fromUnsignedBigInt(confiscated),
    ),
  );
  confiscateReceiptEvent.parameters.push(
    new ethereum.EventParam(
      "justification",
      ethereum.Value.fromBytes(justification),
    ),
  );
  return confiscateReceiptEvent;
}

// event OffchainAssetReceiptVaultInitializedV2(address sender, OffchainAssetReceiptVaultConfigV2 config);
// struct OffchainAssetReceiptVaultConfigV2 {
//     address initialAdmin;
//     ReceiptVaultConfigV2 receiptVaultConfig;
// }
// struct ReceiptVaultConfigV2 {
//     address asset;
//     string name;
//     string symbol;
//     address receipt;
// }
export function createOffchainAssetReceiptVaultInitializedV2Event(
  sender: Address,
  initialAdmin: Address,
  receiptVaultConfig: ReceiptVaultConfig,
  contractAddress: Address,
): OffchainAssetReceiptVaultInitializedV2 {
  let mockEvent = newMockEvent();
  let offchainAssetReceiptVaultInitializedV2Event =
    new OffchainAssetReceiptVaultInitializedV2(
      contractAddress,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      null,
    );

  // Create the ReceiptVaultConfigV2 tuple: (asset, name, symbol, receipt)
  let receiptVaultConfigValues = new ethereum.Tuple();
  receiptVaultConfigValues.push(
    ethereum.Value.fromAddress(receiptVaultConfig.vaultConfig.address),
  ); // asset
  receiptVaultConfigValues.push(
    ethereum.Value.fromString(receiptVaultConfig.vaultConfig.name.toString()),
  ); // name
  receiptVaultConfigValues.push(
    ethereum.Value.fromString(receiptVaultConfig.vaultConfig.symbol.toString()),
  ); // symbol
  receiptVaultConfigValues.push(
    ethereum.Value.fromAddress(receiptVaultConfig.receipt),
  ); // receipt

  // Create the OffchainAssetReceiptVaultConfigV2 tuple: (initialAdmin, receiptVaultConfig)
  let configTuple = new ethereum.Tuple();
  configTuple.push(ethereum.Value.fromAddress(initialAdmin));
  configTuple.push(ethereum.Value.fromTuple(receiptVaultConfigValues));

  offchainAssetReceiptVaultInitializedV2Event.parameters = new Array();
  offchainAssetReceiptVaultInitializedV2Event.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  offchainAssetReceiptVaultInitializedV2Event.parameters.push(
    new ethereum.EventParam("config", ethereum.Value.fromTuple(configTuple)),
  );

  return offchainAssetReceiptVaultInitializedV2Event;
}
//event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes,
  contractAddress: Address,
): RoleAdminChanged {
  let mockEvent = newMockEvent();
  let roleAdminChangedEvent = new RoleAdminChanged(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  roleAdminChangedEvent.parameters = new Array();
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromBytes(role)),
  );
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromBytes(previousAdminRole),
    ),
  );
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromBytes(newAdminRole),
    ),
  );
  return roleAdminChangedEvent;
}

// event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address,
  contractAddress: Address,
): RoleGrantedEvent {
  let mockEvent = newMockEvent();
  let roleGrantedEvent = new RoleGrantedEvent(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  roleGrantedEvent.parameters = new Array();
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromBytes(role)),
  );
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account)),
  );
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  return roleGrantedEvent;
}

//event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address,
  contractAddress: Address,
): RoleRevokedEvent {
  let mockEvent = newMockEvent();
  let roleRevokedEvent = new RoleRevokedEvent(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  roleRevokedEvent.parameters = new Array();
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromBytes(role)),
  );
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account)),
  );
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  return roleRevokedEvent;
}

// event Deployment(address sender, address asset, address wrapper);
export function createDeploymentEvent(
  sender: Address,
  asset: Address,
  wrapper: Address,
  contractAddress: Address,
): Deployment {
  let mockEvent = newMockEvent();
  let deploymentEvent = new Deployment(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  deploymentEvent.parameters = new Array();
  deploymentEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  deploymentEvent.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset)),
  );
  deploymentEvent.parameters.push(
    new ethereum.EventParam("wrapper", ethereum.Value.fromAddress(wrapper)),
  );
  return deploymentEvent;
}

export function createMockERC20Functions(address: Address): void {
  createMockedFunction(address, "name", "name():(string)")
    .withArgs([])
    .returns([ethereum.Value.fromString("Test")]);
  createMockedFunction(address, "symbol", "symbol():(string)")
    .withArgs([])
    .returns([ethereum.Value.fromString("TST")]);
  createMockedFunction(address, "decimals", "decimals():(uint8)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(18))]);
}

export function createMockReceiptFunction(
  vaultAddress: Address,
  receiptAddress: Address,
): void {
  createMockedFunction(vaultAddress, "receipt", "receipt():(address)")
    .withArgs([])
    .returns([ethereum.Value.fromAddress(receiptAddress)]);
}

// event Transfer(address indexed from, address indexed to, uint256 value);
export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  contractAddress: Address,
): Transfer {
  let mockEvent = newMockEvent();
  let transferEvent = new Transfer(
    contractAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null,
  );
  transferEvent.parameters = new Array();
  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from)),
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to)),
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value)),
  );
  return transferEvent;
}

export function createMockBalanceOfFunction(
  vaultAddress: Address,
  holder: Address,
  balance: BigInt,
): void {
  createMockedFunction(
    vaultAddress,
    "balanceOf",
    "balanceOf(address):(uint256)",
  )
    .withArgs([ethereum.Value.fromAddress(holder)])
    .returns([ethereum.Value.fromUnsignedBigInt(balance)]);
}

export function createMockTotalSupplyFunction(
  vaultAddress: Address,
  totalSupply: BigInt,
): void {
  createMockedFunction(vaultAddress, "totalSupply", "totalSupply():(uint256)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(totalSupply)]);
}
