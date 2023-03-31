import { dataSource, json, log } from "@graphprotocol/graph-ts";
import {
  Hash,
  OffchainAssetReceiptVault,
  ReceiptInformation
} from "../generated/schema";
import { ReceiptInformation as ReceiptInformationEvent } from "../generated/templates/ReceiptTemplate/Receipt";
import { getAccount, getReceipt, getTransaction, ONE, stringToArrayBuffer } from "./utils";
import { CBORDecoder } from "@rainprotocol/assemblyscript-cbor";

export function handleReceiptInformation(event: ReceiptInformationEvent): void {
  let context = dataSource.context();
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    context.getString("vault")
  );
  if ( offchainAssetReceiptVault ) {
    let meta = event.params.information.toHex();

    if ( meta.includes("0xff0a89c674ee7874") ) {

      let metaData = event.params.information.toHex().slice(18);
      let data = new CBORDecoder(stringToArrayBuffer(metaData));
      let jsonData = json.try_fromString(data.parse().stringify());
      if ( jsonData.isOk ) {
        let jsonDataArray = jsonData.value.toArray();
        if ( jsonDataArray.length ) {
          let receiptInformation = new ReceiptInformation(
            `ReceiptInformation-${
              offchainAssetReceiptVault.id
            }-${ event.params.id.toString() }`
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
          receiptInformation.payload = jsonDataArray[ 0 ].toObject().mustGet("0").toString();
          receiptInformation.magicNumber = jsonDataArray[ 0 ].toObject().mustGet("1").toBigInt();
          receiptInformation.contentType = jsonDataArray[ 0 ].toObject().mustGet("2").toString();
          receiptInformation.contentEncoding = jsonDataArray[ 0 ].toObject().mustGet("3").toString();

          receiptInformation.save();

          //HashList
          let hashList = jsonDataArray[ 1 ].toObject().mustGet("0").toString();

          let hashListArray = hashList.split(",");
          if ( hashListArray.length ) {
            for ( let i = 0; i < hashListArray.length; i++ ) {
              if ( offchainAssetReceiptVault ) {

                let hash = new Hash(event.transaction.hash.toHex().toString() + "-" + i.toString());
                hash.owner = receiptInformation.caller;
                hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
                hash.offchainAssetReceiptVaultDeployer = offchainAssetReceiptVault.deployer.toHex();
                hash.hash = hashListArray[ i ];
                hash.timestamp = event.block.timestamp;
                hash.save();

                offchainAssetReceiptVault.hashCount =
                  offchainAssetReceiptVault.hashCount.plus(ONE);
                offchainAssetReceiptVault.save();
              }
            }
          }
        }
      }
    }
  }
}
