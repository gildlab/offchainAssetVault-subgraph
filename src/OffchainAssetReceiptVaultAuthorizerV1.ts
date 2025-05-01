import {
  Authorizer,
  Role,
  RoleGranted,
  RoleRevoked,
} from "../generated/schema";

import {
  RoleAdminChanged,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/templates/OffchainAssetReceiptVaultAuthorizerV1Template/OffchainAssetReceiptVaultAuthorizerV1";

import {
  CERTIFY,
  CERTIFY_ADMIN,
  CONFISCATE_RECEIPT,
  CONFISCATE_RECEIPT_ADMIN,
  CONFISCATE_SHARES,
  CONFISCATE_SHARES_ADMIN,
  DEPOSIT,
  DEPOSIT_ADMIN,
  TRANSFER_RECEIPT,
  TRANSFER_SHARES,
  WITHDRAW,
  WITHDRAW_ADMIN
} from "./roles";

import {
  getAccount,
  getRoleHolder,
  getTransaction
} from "./utils";

import { store } from "@graphprotocol/graph-ts";

export function handleRoleAdminChanged(event: RoleAdminChanged): void {
  
  let roleId = event.address.toHex() + "-" + event.params.role.toHex();
  let role = new Role(roleId);
  let authorizer = Authorizer.load(event.address.toHex());

  if(authorizer){
    if (event.params.role.toHex() == DEPOSIT_ADMIN) {
      role.roleName = "DEPOSIT_ADMIN";
    } else if (event.params.role.toHex() == WITHDRAW_ADMIN) {
      role.roleName = "WITHDRAW_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY_ADMIN) {
      role.roleName = "CERTIFY_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES_ADMIN) {
      role.roleName = "CONFISCATE_SHARES_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT_ADMIN) {
      role.roleName = "CONFISCATE_RECEIPT_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY) {
      role.roleName = "CERTIFY";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES) {
      role.roleName = "CONFISCATE_SHARES";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT) {
      role.roleName = "CONFISCATE_RECEIPT";
    } else if (event.params.role.toHex() == TRANSFER_SHARES) {
      role.roleName = "TRANSFER_SHARES";
    } else if (event.params.role.toHex() == WITHDRAW) {
      role.roleName = "WITHDRAW";
    } else if (event.params.role.toHex() == DEPOSIT) {
      role.roleName = "DEPOSIT";
    } else if (event.params.role.toHex() == TRANSFER_RECEIPT) {
      role.roleName = "TRANSFER_RECEIPT";
    } else {
      role.roleName = "UNKNOWN";
    }
    role.authorizer = authorizer.id;
    role.roleHash = event.params.role;
    role.save();
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let authorizer = Authorizer.load(event.address.toHex());

  // Create the authorizer entity if it doesn't exist yet
  // This handles cases where RoleGranted events occur during authorizer creation
  if (!authorizer) {
    authorizer = new Authorizer(event.address.toHex());
    authorizer.address = event.address;
    authorizer.isActive = true; // Set a default value
    authorizer.save();
  }

  let roleId = event.address.toHex() + "-" + event.params.role.toHex();
  let role = Role.load(roleId);

  // If the role doesn't exist yet, create it
  if (!role) {
    role = new Role(roleId);
    
    // Determine role name from the role hash
    if (event.params.role.toHex() == DEPOSIT_ADMIN) {
      role.roleName = "DEPOSIT_ADMIN";
    } else if (event.params.role.toHex() == WITHDRAW_ADMIN) {
      role.roleName = "WITHDRAW_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY_ADMIN) {
      role.roleName = "CERTIFY_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES_ADMIN) {
      role.roleName = "CONFISCATE_SHARES_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT_ADMIN) {
      role.roleName = "CONFISCATE_RECEIPT_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY) {
      role.roleName = "CERTIFY";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES) {
      role.roleName = "CONFISCATE_SHARES";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT) {
      role.roleName = "CONFISCATE_RECEIPT";
    } else if (event.params.role.toHex() == TRANSFER_SHARES) {
      role.roleName = "TRANSFER_SHARES";
    } else if (event.params.role.toHex() == WITHDRAW) {
      role.roleName = "WITHDRAW";
    } else if (event.params.role.toHex() == DEPOSIT) {
      role.roleName = "DEPOSIT";
    } else if (event.params.role.toHex() == TRANSFER_RECEIPT) {
      role.roleName = "TRANSFER_RECEIPT";
    } else {
      role.roleName = "UNKNOWN";
    }
    
    role.authorizer = authorizer.id;
    role.roleHash = event.params.role;
    role.save();
  }

  // Process the role granted event now that we have both authorizer and role
  let roleGrantedId = event.transaction.hash.toHex() + "-" + role.roleName;
  let roleGranted = new RoleGranted(roleGrantedId);

  // Use the authorizer address as the vault ID if no vault is linked yet
  let vaultId = event.address.toHex();
  if (authorizer.offchainAssetReceiptVault != null) {
    vaultId = authorizer.offchainAssetReceiptVault as string;
  }

  let account = getAccount(event.params.account.toHex(), vaultId);
  let sender = getAccount(event.params.sender.toHex(), vaultId);
    
  roleGranted.account = account.id;
  roleGranted.emitter = sender.id;
  roleGranted.sender = sender.id;
  roleGranted.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
  roleGranted.timestamp = event.block.timestamp;
  roleGranted.authorizer = authorizer.id;
  roleGranted.role = role.id;

  // Handle role holder
  let roleHolder = getRoleHolder(
    authorizer.id,
    event.params.account.toHex(),
    event.params.role.toHex()
  );
  if (roleHolder) {
    roleGranted.roleHolder = roleHolder.id;
      
    let activeRoles = roleHolder.activeRoles;
    if (activeRoles) {
      activeRoles.push(role.id);
    } 
    roleHolder.activeRoles = activeRoles;
    roleHolder.save();
  }

  roleGranted.save();
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let authorizer = Authorizer.load(event.address.toHex());

  // Create the authorizer entity if it doesn't exist yet
  if (!authorizer) {
    authorizer = new Authorizer(event.address.toHex());
    authorizer.address = event.address;
    authorizer.isActive = true; // Set a default value
    authorizer.save();
  }

  let roleId = event.address.toHex() + "-" + event.params.role.toHex();
  let role = Role.load(roleId);

  // If the role doesn't exist yet, create it
  if (!role) {
    role = new Role(roleId);
    
    // Determine role name from the role hash
    if (event.params.role.toHex() == DEPOSIT_ADMIN) {
      role.roleName = "DEPOSIT_ADMIN";
    } else if (event.params.role.toHex() == WITHDRAW_ADMIN) {
      role.roleName = "WITHDRAW_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY_ADMIN) {
      role.roleName = "CERTIFY_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES_ADMIN) {
      role.roleName = "CONFISCATE_SHARES_ADMIN";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT_ADMIN) {
      role.roleName = "CONFISCATE_RECEIPT_ADMIN";
    } else if (event.params.role.toHex() == CERTIFY) {
      role.roleName = "CERTIFY";
    } else if (event.params.role.toHex() == CONFISCATE_SHARES) {
      role.roleName = "CONFISCATE_SHARES";
    } else if (event.params.role.toHex() == CONFISCATE_RECEIPT) {
      role.roleName = "CONFISCATE_RECEIPT";
    } else if (event.params.role.toHex() == TRANSFER_SHARES) {
      role.roleName = "TRANSFER_SHARES";
    } else if (event.params.role.toHex() == WITHDRAW) {
      role.roleName = "WITHDRAW";
    } else if (event.params.role.toHex() == DEPOSIT) {
      role.roleName = "DEPOSIT";
    } else if (event.params.role.toHex() == TRANSFER_RECEIPT) {
      role.roleName = "TRANSFER_RECEIPT";
    } else {
      role.roleName = "UNKNOWN";
    }
    
    role.authorizer = authorizer.id;
    role.roleHash = event.params.role;
    role.save();
  }

  // Process the role revoked event now that we have both authorizer and role
  let roleRevokedId = event.transaction.hash.toHex() + "-" + role.roleName;
  let roleRevoked = new RoleRevoked(roleRevokedId);

  // Use the authorizer address as the vault ID if no vault is linked yet
  let vaultId = event.address.toHex();
  if (authorizer.offchainAssetReceiptVault != null) {
    vaultId = authorizer.offchainAssetReceiptVault as string;
  }
  
  let account = getAccount(event.params.account.toHex(), vaultId);
  let sender = getAccount(event.params.sender.toHex(), vaultId);
  roleRevoked.account = account.id;
  roleRevoked.emitter = sender.id;
  roleRevoked.sender = sender.id;
  roleRevoked.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
  roleRevoked.timestamp = event.block.timestamp;
  roleRevoked.authorizer = authorizer.id;
  roleRevoked.role = role.id;
  
  let roleHolder = getRoleHolder(
    authorizer.id,
    event.params.account.toHex(),
    event.params.role.toHex()
  );
  if (roleHolder) {
    roleRevoked.roleHolder = roleHolder.id;
    store.remove("RoleHolder", roleHolder.id);
  }
  
  roleRevoked.save();
}