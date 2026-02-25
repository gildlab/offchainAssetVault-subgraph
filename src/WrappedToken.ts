import {
  OffchainAssetReceiptVault,
  WrappedTokenTransfer,
} from "../generated/schema";
import { Transfer as WrappedTransferEvent } from "../generated/templates/WrappedTokenTemplate/ERC20";
import { getTransaction } from "./utils";
import { dataSource } from "@graphprotocol/graph-ts";

export function handleWrappedTokenTransfer(event: WrappedTransferEvent): void {
  let vaultId = dataSource.context().getString("vaultId");
  let vault = OffchainAssetReceiptVault.load(vaultId);
  if (vault == null) return;

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let transfer = new WrappedTokenTransfer(id);
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.token = event.address;
  transfer.offchainAssetReceiptVault = vault.id;
  transfer.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
  transfer.save();
}
