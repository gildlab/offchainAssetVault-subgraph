import {
  OffchainAssetVault,
  Role,
  RoleGranted,
  RoleHolder,
} from "../generated/schema";
import {
  Approval,
  ApprovalForAll,
  Certify,
  ConfiscateReceipt,
  ConfiscateShares,
  Construction,
  Deposit,
  DepositWithReceipt,
  OffchainAssetVaultConstruction,
  ReceiptInformation,
  RoleAdminChanged,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked,
  SetERC1155Tier,
  SetERC20Tier,
  Snapshot,
  Transfer,
  TransferBatch,
  TransferSingle,
  URI,
  Withdraw,
  WithdrawWithReceipt,
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
import { getAccount, getRoleHolder, getTransaction } from "./utils";

export function handleApproval(event: Approval): void {}
export function handleApprovalForAll(event: ApprovalForAll): void {}
export function handleCertify(event: Certify): void {}
export function handleConfiscateReceipt(event: ConfiscateReceipt): void {}
export function handleConfiscateShares(event: ConfiscateShares): void {}
export function handleConstruction(event: Construction): void {}
export function handleDeposit(event: Deposit): void {}
export function handleDepositWithReceipt(event: DepositWithReceipt): void {}

export function handleOffchainAssetVaultConstruction(
  event: OffchainAssetVaultConstruction
): void {
  let offchainAssetVault = OffchainAssetVault.load(event.address.toHex());
  if (offchainAssetVault) {
    // offchainAssetVault.deployer = event.params.caller;
    offchainAssetVault.admin = event.params.config.admin;
    offchainAssetVault.name = event.params.config.receiptVaultConfig.name;
    offchainAssetVault.symbol = event.params.config.receiptVaultConfig.symbol;
    offchainAssetVault.uri = event.params.config.receiptVaultConfig.uri;

    offchainAssetVault.save();
  }
}

export function handleReceiptInformation(event: ReceiptInformation): void {}

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
    roleGranted.transaction = getTransaction(event.block).id;
    roleGranted.timestamp = event.block.timestamp;
    roleGranted.offchainAssetVault = offchainAssetVault.id;
    roleGranted.role = role.id;
    if (event.params.role.toHex() == DEPOSITOR_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == WITHDRAWER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == CERTIFIER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == HANDLER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC20TIERER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC1155TIERER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC20SNAPSHOTTER_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == CONFISCATOR_ADMIN) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == WITHDRAWER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == CERTIFIER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == HANDLER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC20TIERER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC1155TIERER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == ERC20SNAPSHOTTER) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    } else if (event.params.role.toHex() == CONFISCATOR) {
      let roleHolder = getRoleHolder(
        event.address.toHex(),
        event.params.account.toHex(),
        event.params.role.toHex()
      );
      if (roleHolder) {
        roleGranted.roleHolder = roleHolder.id;
        roleHolder.hasRole = true;
        roleHolder.save();
      }
    }
    roleGranted.save();

    role.offchainAssetVault = offchainAssetVault.id;
    role.roleHash = event.params.role;
    role.save();
  }
}
export function handleRoleRevoked(event: RoleRevoked): void {}
export function handleSetERC1155Tier(event: SetERC1155Tier): void {}
export function handleSetERC20Tier(event: SetERC20Tier): void {}
export function handleSnapshot(event: Snapshot): void {}
export function handleTransfer(event: Transfer): void {}
export function handleTransferBatch(event: TransferBatch): void {}
export function handleTransferSingle(event: TransferSingle): void {}
export function handleURI(event: URI): void {}
export function handleWithdraw(event: Withdraw): void {}
export function handleWithdrawWithReceipt(event: WithdrawWithReceipt): void {}
