import { NewChild } from "../generated/OffchainAssetVaultFactory/OffchainAssetVaultFactory";
import {
  OffchainAssetVault,
  OffchainAssetVaultFactory,
} from "../generated/schema";
import { OffchainAssetVaultTemplate } from "../generated/templates";
import { ONE, ZERO } from "./utils";

export function handleNewChild(event: NewChild): void {
  let factory = OffchainAssetVaultFactory.load(event.address.toHex());
  if (!factory) {
    factory = new OffchainAssetVaultFactory(event.address.toHex());
    factory.address = event.address;
    factory.childrenCount = ZERO;
    factory.save();
  }

  let child = new OffchainAssetVault(event.params.child.toHex());
  child.address = event.params.child;
  child.deployBlock = event.block.number;
  child.deployTimestamp = event.block.timestamp;
  child.deployer = event.params.sender;
  child.factory = factory.id;
  child.admin = event.params.sender;

  child.name = "";
  child.symbol = "";
  child.uri = "";
  child.totalShares = ZERO;
  child.certifiedUntil = ZERO;
  
  child.save();

  if (factory) {
    factory.childrenCount = factory.childrenCount.plus(ONE);
    factory.save();
  }

  OffchainAssetVaultTemplate.create(event.params.child);
}
