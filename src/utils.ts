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

export function hexToBigint(hex: string): BigInt {
  let bigint = BigInt.fromI32(0);
  let power = BigInt.fromI32(1);
  for (let i = hex.length - 1; i >= 0; i--) {
    let char = hex.charCodeAt(i);
    let value = 0;
    if (char >= 48 && char <= 57) {
      value = char - 48;
    } else if (char >= 65 && char <= 70) {
      value = char - 55;
    }
    bigint = bigint.plus(BigInt.fromI32(value).times(power));
    power = power.times(BigInt.fromI32(16));
  }
  return bigint;
}

/**
 * Prefixes every rain meta document
 */
export const RAIN_META_DOCUMENT = hexToBigint("0xff0a89c674ee7874");
/**S
 * OA Schema
 */
export const OA_SCHEMA = hexToBigint("0xffa8e8a9b9cf4a31");
/**
 * OA Hash list
 */
export const OA_HASH_LIST = hexToBigint("0xff9fae3cc645f463");
/**
 * OA Structure
 */
export const OA_STRUCTURE = hexToBigint("0xffc47a6299e8a911");

export function stringToArrayBuffer(val: string): ArrayBuffer {
  const buff = new ArrayBuffer(val.length / 2);
  const view = new DataView(buff);
  for (let i = 0, j = 0; i < val.length; i = i + 2, j++) {
    view.setUint8(j, u8(Number.parseInt(`${val.at(i)}${val.at(i + 1)}`, 16)));
  }
  return buff;
}