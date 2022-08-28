import { ethereum, log } from "@graphprotocol/graph-ts";
import {
  Certify,
  DepositWithReceipt,
  OffchainAssetVault,
  ReceiptInformation,
  Role,
  RoleGranted,
  RoleRevoked,
  ConfiscateShares,
} from "../generated/schema";
import {
  Approval,
  ApprovalForAll,
  Certify as CertifyEvent,
  ConfiscateReceipt,
  ConfiscateShares as ConfiscateSharesEvent,
  Construction,
  Deposit,
  DepositWithReceipt as DepositWithReceiptEvent,
  OffchainAssetVaultConstruction,
  ReceiptInformation as ReceiptInformationEvent,
  RoleAdminChanged,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  SetERC1155Tier,
  SetERC20Tier,
  Snapshot,
  Transfer,
  TransferBatch,
  TransferSingle,
  URI,
  Withdraw,
  WithdrawWithReceipt,
  OffchainAssetVault as OffchainAssetVaultContract
} from "../generated/templates/OffchainAssetVaultTemplate/OffchainAssetVault";
import {
  CERTIFIER,
  CERTIFIER_ADMIN,
  CONFISCATOR,
  CONFISCATOR_ADMIN,
  DEPOSITOR,
  DEPOSITOR_ADMIN,
  ERC1155TIERER,
  ERC1155TIERER_ADMIN,
  ERC20SNAPSHOTTER,
  ERC20SNAPSHOTTER_ADMIN,
  ERC20TIERER,
  ERC20TIERER_ADMIN,
  HANDLER,
  HANDLER_ADMIN,
  WITHDRAWER,
  WITHDRAWER_ADMIN,
} from "./roles";
import { getAccount, getReceipt, getRoleHolder, getTransaction } from "./utils";

export function handleApproval(event: Approval): void {}
export function handleApprovalForAll(event: ApprovalForAll): void {}
export function handleCertify(event: CertifyEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if(offchainAssetVault){
    let certify = new Certify(`Certify-${event.transaction.hash.toHex()}`);
    certify.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    certify.emitter = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    certify.timestamp = event.block.timestamp;
    certify.offchainAssetVault = offchainAssetVault.id;
    certify.certifier = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    certify.certifiedUntil = event.params.until;
    certify.data = event.params.data;
    certify.save();

    offchainAssetVault.certifiedUntil = event.params.until;
    offchainAssetVault.save();
  }
}
export function handleConfiscateReceipt(event: ConfiscateReceipt): void {
}
export function handleConfiscateShares(event: ConfiscateSharesEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if(offchainAssetVault){
    let confiscateShares = new ConfiscateShares(`ConfiscateShares-${event.transaction.hash.toHex()}`);
    confiscateShares.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    confiscateShares.timestamp = event.block.timestamp;
    confiscateShares.emitter = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    confiscateShares.confiscatee = getAccount(event.params.confiscatee.toHex(), offchainAssetVault.id).id;
    confiscateShares.confiscator = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    confiscateShares.confiscated = event.params.confiscated;
    confiscateShares.offchainAssetVault = offchainAssetVault.id;
    confiscateShares.save();
  }
}
export function handleConstruction(event: Construction): void {}
export function handleDeposit(event: Deposit): void {}
export function handleDepositWithReceipt(event: DepositWithReceiptEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if(offchainAssetVault){
    let depositWithReceipt = new DepositWithReceipt(event.params.id.toString());
    depositWithReceipt.timestamp = event.block.timestamp;
    depositWithReceipt.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    depositWithReceipt.emitter = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    depositWithReceipt.receiver = getAccount(event.params.receiver .toHex(), offchainAssetVault.id).id;
    depositWithReceipt.caller = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    depositWithReceipt.offchainAssetVault = offchainAssetVault.id;
    depositWithReceipt.amount = event.params.shares;
    
    let receipt = getReceipt(offchainAssetVault.id.toString(), event.params.id);
    if(receipt){
      receipt.shares = receipt.shares.plus(event.params.shares);
      receipt.save();
      
      depositWithReceipt.receipt = receipt.id;
    }
    depositWithReceipt.save()
  }
}

export function handleOffchainAssetVaultConstruction(
  event: OffchainAssetVaultConstruction
): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if (offchainAssetVault) {
    offchainAssetVault.admin = event.params.config.admin;
    offchainAssetVault.name = event.params.config.receiptVaultConfig.name;
    offchainAssetVault.symbol = event.params.config.receiptVaultConfig.symbol;
    offchainAssetVault.uri = event.params.config.receiptVaultConfig.uri;
    offchainAssetVault.save();
  }
}

export function handleReceiptInformation(event: ReceiptInformationEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if(offchainAssetVault){
    let receiptInformation = new ReceiptInformation(offchainAssetVault.id + "-" + event.params.id.toString());
    receiptInformation.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    receiptInformation.timestamp = event.block.timestamp;
    receiptInformation.offchainAssetVault = offchainAssetVault.id;
    receiptInformation.information = event.params.information;
    receiptInformation.caller = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    receiptInformation.emitter = getAccount(event.params.caller.toHex(), offchainAssetVault.id).id;
    receiptInformation.receipt = getReceipt(offchainAssetVault.id, event.params.id).id;
    receiptInformation.save();
  }
}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let role = new Role(event.address.toHex() + "-" + event.params.role.toHex());
  if (offchainAssetVault) {
    if (event.params.role.toHex() == DEPOSITOR) {
      role.roleName = "DEPOSITOR";
    } else if (event.params.role.toHex() == DEPOSITOR_ADMIN) {
      role.roleName = "DEPOSITOR_ADMIN";
    } else if (event.params.role.toHex() == WITHDRAWER_ADMIN) {
      role.roleName = "WITHDRAWER_ADMIN";
    } else if (event.params.role.toHex() == CERTIFIER_ADMIN) {
      role.roleName = "CERTIFIER_ADMIN";
    } else if (event.params.role.toHex() == HANDLER_ADMIN) {
      role.roleName = "HANDLER_ADMIN";
    } else if (event.params.role.toHex() == ERC20TIERER_ADMIN) {
      role.roleName = "ERC20TIERER_ADMIN";
    } else if (event.params.role.toHex() == ERC1155TIERER_ADMIN) {
      role.roleName = "ERC1155TIERER_ADMIN";
    } else if (event.params.role.toHex() == ERC20SNAPSHOTTER_ADMIN) {
      role.roleName = "ERC20SNAPSHOTTER_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATOR_ADMIN) {
      role.roleName = "CONFISCATOR_ADMIN";
    } else if (event.params.role.toHex() == WITHDRAWER) {
      role.roleName = "WITHDRAWER";
    } else if (event.params.role.toHex() == CERTIFIER) {
      role.roleName = "CERTIFIER";
    } else if (event.params.role.toHex() == HANDLER) {
      role.roleName = "HANDLER";
    } else if (event.params.role.toHex() == ERC20TIERER) {
      role.roleName = "ERC20TIERER";
    } else if (event.params.role.toHex() == ERC1155TIERER) {
      role.roleName = "ERC1155TIERER";
    } else if (event.params.role.toHex() == ERC20SNAPSHOTTER) {
      role.roleName = "ERC20SNAPSHOTTER";
    } else if (event.params.role.toHex() == CONFISCATOR) {
      role.roleName = "CONFISCATOR";
    } else {
      role.roleName = "UNKNOWN";
    }
    role.offchainAssetVault = offchainAssetVault.id;
    role.roleHash = event.params.role;
    role.save();
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

  if (offchainAssetVault && role) {
    let roleGranted = new RoleGranted(event.transaction.hash.toHex());
    roleGranted.account = getAccount(
      event.params.account.toHex(),
      offchainAssetVault.id
    ).id;
    roleGranted.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetVault.id
    ).id;
    roleGranted.sender = getAccount(
      event.params.sender.toHex(),
      offchainAssetVault.id
    ).id;
    roleGranted.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    roleGranted.timestamp = event.block.timestamp;
    roleGranted.offchainAssetVault = offchainAssetVault.id;
    roleGranted.role = role.id;
    let roleHolder = getRoleHolder(
      event.address.toHex(),
      event.params.account.toHex(),
      event.params.role.toHex()
    );
    if (roleHolder) {
      roleGranted.roleHolder = roleHolder.id;

      let activeRoles = roleHolder.activeRoles;
      if(activeRoles) activeRoles.push(role.id);
      roleHolder.activeRoles = activeRoles;
      roleHolder.save();
    }
    roleGranted.save();

    role.offchainAssetVault = offchainAssetVault.id;
    role.roleHash = event.params.role;
    role.save();
  }
}
export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

  if (offchainAssetVault && role) {
    let roleRevoked = new RoleRevoked(event.transaction.hash.toHex());
    roleRevoked.account = getAccount(
      event.params.account.toHex(),
      offchainAssetVault.id
    ).id;
    roleRevoked.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetVault.id
    ).id;
    roleRevoked.sender = getAccount(
      event.params.sender.toHex(),
      offchainAssetVault.id
    ).id;
    roleRevoked.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
    roleRevoked.timestamp = event.block.timestamp;
    roleRevoked.offchainAssetVault = offchainAssetVault.id;
    roleRevoked.role = role.id;
    let roleHolder = getRoleHolder(
      event.address.toHex(),
      event.params.account.toHex(),
      event.params.role.toHex()
    );
    if (roleHolder) {
      roleRevoked.roleHolder = roleHolder.id;

      let old_activeRoles = roleHolder.activeRoles;
      let activeRoles: string[] = [];
      if(old_activeRoles){
        for(let i=0; i< old_activeRoles.length; i++){
          if(old_activeRoles[i] != role.id)
            activeRoles.push(old_activeRoles[i])
        }
      }
      roleHolder.activeRoles = activeRoles;
      roleHolder.save();
    }
    roleRevoked.save();
  }
}
export function handleSetERC1155Tier(event: SetERC1155Tier): void {}
export function handleSetERC20Tier(event: SetERC20Tier): void {}
export function handleSnapshot(event: Snapshot): void {}
export function handleTransfer(event: Transfer): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let offchainAssetVaultContract = OffchainAssetVaultContract.bind(event.address);
  if(offchainAssetVault){
    offchainAssetVault.totalShares = offchainAssetVaultContract.totalSupply();
    offchainAssetVault.save();
  }
}
export function handleTransferBatch(event: TransferBatch): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let offchainAssetVaultContract = OffchainAssetVaultContract.bind(event.address);
  if(offchainAssetVault){
    offchainAssetVault.totalShares = offchainAssetVaultContract.totalSupply();
    offchainAssetVault.save();
  }
}
export function handleTransferSingle(event: TransferSingle): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  let offchainAssetVaultContract = OffchainAssetVaultContract.bind(event.address);
  if(offchainAssetVault){
    offchainAssetVault.totalShares = offchainAssetVaultContract.totalSupply();
    offchainAssetVault.save();
  }
}
export function handleURI(event: URI): void {}
export function handleWithdraw(event: Withdraw): void {}
export function handleWithdrawWithReceipt(event: WithdrawWithReceipt): void {}

