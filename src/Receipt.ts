import { dataSource, json, JSONValueKind } from "@graphprotocol/graph-ts";
import {
  Hash,
  OffchainAssetReceiptVault,
  ReceiptInformation,
} from "../generated/schema";
import { ReceiptInformation as ReceiptInformationEvent } from "../generated/templates/ReceiptTemplate/Receipt";
import {
  BigintToHexString,
  getAccount,
  getReceipt,
  getTransaction,
  ONE,
  RAIN_META_DOCUMENT,
  stringToArrayBuffer,
} from "./utils";
import { CBORDecoder } from "@rainprotocol/assemblyscript-cbor";

export function handleReceiptInformation(event: ReceiptInformationEvent): void {
  let context = dataSource.context();
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    context.getString("vault"),
  );
  if (offchainAssetReceiptVault) {
    let meta = event.params.information.toHex();

    if (meta.includes(BigintToHexString(RAIN_META_DOCUMENT))) {
      let metaData = event.params.information.toHex().slice(18);
      let data = new CBORDecoder(stringToArrayBuffer(metaData));
      let jsonData = json.try_fromString(data.parse().stringify());
      if (jsonData.isOk && jsonData.value.kind == JSONValueKind.ARRAY) {
        let jsonDataArray = jsonData.value.toArray();
        if (
          jsonDataArray.length >= 2 &&
          jsonDataArray[0].kind == JSONValueKind.OBJECT &&
          jsonDataArray[1].kind == JSONValueKind.OBJECT
        ) {
          let primaryInformation = jsonDataArray[0].toObject();
          let hashEntry = jsonDataArray[1].toObject();
          let receiptInformation = new ReceiptInformation(
            `ReceiptInformation-${
              offchainAssetReceiptVault.id
            }-${event.params.id.toString()}-${event.transaction.hash.toHex()}`,
          );
          receiptInformation.transaction = getTransaction(
            event.block,
            event.transaction.hash.toHex(),
          ).id;
          receiptInformation.timestamp = event.block.timestamp;
          receiptInformation.offchainAssetReceiptVault =
            offchainAssetReceiptVault.id;
          receiptInformation.information = event.params.information;
          receiptInformation.caller = getAccount(
            event.params.sender.toHex(),
            offchainAssetReceiptVault.id,
          ).id;
          receiptInformation.emitter = getAccount(
            event.params.sender.toHex(),
            offchainAssetReceiptVault.id,
          ).id;
          receiptInformation.receipt = getReceipt(
            offchainAssetReceiptVault.id,
            event.params.id,
          ).id;
          let payload = primaryInformation.get("0");
          if (payload) receiptInformation.payload = payload.toString();
          let magicNumber = primaryInformation.get("1");
          if (magicNumber)
            receiptInformation.magicNumber = magicNumber.toBigInt();
          let contentType = primaryInformation.get("2");
          if (contentType)
            receiptInformation.contentType = contentType.toString();
          let contentEncoding = primaryInformation.get("3");
          if (contentEncoding)
            receiptInformation.contentEncoding = contentEncoding.toString();
          // Access the value and set it to receiptInformation.schema
          let schema = primaryInformation.get("18422230091423500849");
          if (schema) receiptInformation.schema = schema.toString();

          receiptInformation.save();

          //HashList
          let hashListValue = hashEntry.get("0");
          if (hashListValue) {
            let hashListArray = hashListValue.toString().split(",");
            if (hashListArray.length) {
              for (let i = 0; i < hashListArray.length; i++) {
                if (offchainAssetReceiptVault) {
                  let hash = new Hash(
                    event.transaction.hash.toHex().toString() +
                      "-" +
                      i.toString(),
                  );
                  hash.owner = receiptInformation.caller;
                  hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
                  hash.offchainAssetReceiptVaultDeployer =
                    offchainAssetReceiptVault.deployer.toHex();
                  hash.hash = hashListArray[i];
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
}
