import {
  OffchainAssetReceiptVault,
  WrappedTokenTransfer,
} from "../generated/schema";
import { Transfer as WrappedTransferEvent } from "../generated/templates/WrappedTokenTemplate/ERC4626";
import { ERC4626 } from "../generated/templates/WrappedTokenTemplate/ERC4626";
import { getTransaction, ONE_18 } from "./utils";
import { BigInt, dataSource } from "@graphprotocol/graph-ts";

function updateVaultExchangeRates(
  vault: OffchainAssetReceiptVault,
  wrappedToken: ERC4626,
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  let assetsPerShareResult = wrappedToken.try_convertToAssets(ONE_18);
  if (!assetsPerShareResult.reverted) {
    vault.assetsPerShare = assetsPerShareResult.value;
  }

  let sharesPerAssetResult = wrappedToken.try_convertToShares(ONE_18);
  if (!sharesPerAssetResult.reverted) {
    vault.sharesPerAsset = sharesPerAssetResult.value;
  }

  if (!assetsPerShareResult.reverted || !sharesPerAssetResult.reverted) {
    vault.exchangeRateBlock = blockNumber;
    vault.exchangeRateTimestamp = timestamp;
    vault.save();
  }
}

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
  transfer.transaction = getTransaction(
    event.block,
    event.transaction.hash.toHex(),
  ).id;
  transfer.save();

  let wrappedToken = ERC4626.bind(event.address);
  updateVaultExchangeRates(
    vault,
    wrappedToken,
    event.block.number,
    event.block.timestamp,
  );
}
