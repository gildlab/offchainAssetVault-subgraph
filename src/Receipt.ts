import { dataSource, log } from "@graphprotocol/graph-ts"
import { OffchainAssetReceiptVault, ReceiptInformation } from "../generated/schema";
import { ReceiptInformation as ReceiptInformationEvent } from "../generated/templates/ReceiptTemplate/Receipt"
import { getAccount, getReceipt, getTransaction } from "./utils";

export function handleReceiptInformation(event: ReceiptInformationEvent): void {
    let context = dataSource.context();
    let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(context.getString("vault"));
    if (offchainAssetReceiptVault) {
      let receiptInformation = new ReceiptInformation(
        `ReceiptInformation-${
          offchainAssetReceiptVault.id
        }-${event.params.id.toString()}`
      );
      receiptInformation.transaction = getTransaction(
        event.block,
        event.transaction.hash.toHex()
      ).id;
      receiptInformation.timestamp = event.block.timestamp;
      receiptInformation.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
      receiptInformation.information = event.params.information;
      receiptInformation.caller = getAccount(
        event.params.sender.toHex(),
        offchainAssetReceiptVault.id
      ).id;
      receiptInformation.emitter = getAccount(
        event.params.sender.toHex(),
        offchainAssetReceiptVault.id
      ).id;
      receiptInformation.receipt = getReceipt(
        offchainAssetReceiptVault.id,
        event.params.id
      ).id;
      receiptInformation.save();
    }
}