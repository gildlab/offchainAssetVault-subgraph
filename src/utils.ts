import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  OffchainAssetReceiptVault,
  Receipt,
  ReceiptBalance,
  RoleHolder,
  Transaction,
  User,
} from "../generated/schema";

export const ZERO = BigInt.fromI32(0);
export const ONE = BigInt.fromI32(1);
export const ZERO_BD = BigDecimal.fromString("0");

export function getAccount(
  address: string,
  offchainAssetReceiptVault: string
): Account {
  let account = Account.load(offchainAssetReceiptVault + "-" + address);
  let vault = OffchainAssetReceiptVault.load(offchainAssetReceiptVault);
  if (!account && vault) {
    account = new Account(offchainAssetReceiptVault + "-" + address);
    account.offchainAssetReceiptVault = vault.id;
    account.address = Address.fromHexString(address);
    account.hashCount = ZERO;
    account.save();
  }

  let user = User.load(address);
  if(!user){
    user = new User(address);
    user.hashCount = ZERO;
    user.save();
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
  offchainAssetReceiptVault: string,
  address: string,
  role: string
): RoleHolder {
  let roleHolder = RoleHolder.load(
    offchainAssetReceiptVault + "-" + address + "-" + role
  );
  if (!roleHolder) {
    roleHolder = new RoleHolder(
      offchainAssetReceiptVault + "-" + address + "-" + role
    );
    roleHolder.account = getAccount(address, offchainAssetReceiptVault).id;
    roleHolder.offchainAssetReceiptVault = offchainAssetReceiptVault;
    roleHolder.role = offchainAssetReceiptVault + "-" + role;
    roleHolder.activeRoles = [];

    roleHolder.save();
  }
  return roleHolder as RoleHolder;
}

export function getReceipt(offchainAssetReceiptVault: string, receiptId: BigInt): Receipt{
  let receipt = Receipt.load(offchainAssetReceiptVault + "-" + receiptId.toString());
  if(!receipt){
    receipt = new Receipt(offchainAssetReceiptVault + "-" + receiptId.toString());
    receipt.offchainAssetReceiptVault = offchainAssetReceiptVault;
    receipt.receiptId = receiptId;
    receipt.shares = ZERO;
    receipt.save(); 
  }
  return receipt as Receipt;
}

export function getReceiptBalance(contract: string, receiptId: BigInt): ReceiptBalance{
  let receiptBalance = ReceiptBalance.load(contract + "-" + receiptId.toString());
  if(!receiptBalance) {
    receiptBalance = new ReceiptBalance(contract + "-" + receiptId.toString());
    receiptBalance.offchainAssetReceiptVault = contract;
    receiptBalance.valueExact = ZERO;
    receiptBalance.value = ZERO_BD;
  }
  return receiptBalance;
}

export function toDecimals(value: BigInt, decimals: number = 18): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(decimals as u8)
    .toBigDecimal();
  return value.divDecimal(precision);
}