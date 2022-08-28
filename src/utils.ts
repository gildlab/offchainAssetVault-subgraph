import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  OffchainAssetVault,
  Receipt,
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

export function getTransaction(block: ethereum.Block, hash:string): Transaction {
  let transaction = Transaction.load(hash);
  if (!transaction) {
    transaction = new Transaction(hash);
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

export function getReceipt(offchainAssetVault: string, receiptId: BigInt): Receipt{
  let receipt = Receipt.load(offchainAssetVault + "-" + receiptId.toString());
  if(!receipt){
    receipt = new Receipt(offchainAssetVault + "-" + receiptId.toString());
    receipt.offchainAssetVault = offchainAssetVault;
    receipt.receiptId = receiptId;
    receipt.shares = ZERO;
    receipt.save(); 
  }
  return receipt as Receipt;
}