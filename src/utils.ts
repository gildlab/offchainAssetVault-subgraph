import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  OffchainAssetVault,
  RoleHolder,
  Transaction,
} from "../generated/schema";

export const ZERO = BigInt.fromI32(0);
export const ONE = BigInt.fromI32(1);

export function getAccount(
  address: string,
  offchainAssetVault: string
): Account {
  let account = Account.load(offchainAssetVault + "-" + address);
  let vault = OffchainAssetVault.load(offchainAssetVault);
  if (!account && vault) {
    account = new Account(offchainAssetVault + "-" + address);
    account.offchainAssetVault = vault.id;
    account.address = Address.fromHexString(address);
    account.save();
  }
  return account as Account;
}

export function getTransaction(block: ethereum.Block): Transaction {
  let transaction = Transaction.load(block.hash.toHex());
  if (!transaction) {
    transaction = new Transaction(block.hash.toHex());
    transaction.blockNumber = block.number;
    transaction.timestamp = block.timestamp;
    transaction.save();
  }
  return transaction as Transaction;
}

export function getRoleHolder(
  offchainAssetVault: string,
  address: string,
  role: string
): RoleHolder {
  let roleHolder = RoleHolder.load(
    offchainAssetVault + "-" + address + "-" + role
  );
  if (!roleHolder) {
    roleHolder = new RoleHolder(
      offchainAssetVault + "-" + address + "-" + role
    );
    roleHolder.account = getAccount(address, offchainAssetVault).id;
    roleHolder.offchainAssetVault = offchainAssetVault;
    roleHolder.role = offchainAssetVault + "-" + role;
    roleHolder.activeRoles = [];

    roleHolder.save();
  }
  return roleHolder as RoleHolder;
}
