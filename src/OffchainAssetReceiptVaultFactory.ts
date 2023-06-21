import { log } from "@graphprotocol/graph-ts";
import {
  NewChild,
  Implementation,
} from "../generated/OffchainAssetReceiptVaultFactory/OffchainAssetReceiptVaultFactory";
import {
  Deployer,
  OffchainAssetReceiptVault,
  OffchainAssetReceiptVaultFactory,
} from "../generated/schema";
import { OffchainAssetReceiptVaultTemplate } from "../generated/templates";
import { ONE, ZERO } from "./utils";

export function handleImplementation(event: Implementation): void {
  let factory = new OffchainAssetReceiptVaultFactory(event.address.toHex());
  factory.address = event.address;
  factory.implementation = event.params.implementation;
  factory.childrenCount = ZERO;
  factory.save();
}

export function handleNewChild(event: NewChild): void {
  let child = new OffchainAssetReceiptVault(event.params.child.toHex());
  child.address = event.params.child;
  child.deployBlock = event.block.number;
  child.deployTimestamp = event.block.timestamp;
  child.deployer = event.params.sender;
  child.factory = event.address.toHex();
  child.admin = event.params.sender;

  child.name = "";
  child.symbol = "";
  child.totalShares = ZERO;
  child.certifiedUntil = ZERO;
  child.hashCount = ZERO;

  child.save();

  let factory = OffchainAssetReceiptVaultFactory.load(event.address.toHex());
  if (factory) {
    factory.childrenCount = factory.childrenCount.plus(ONE);
    factory.save();
  }

  let deployer = Deployer.load(event.params.sender.toHex());
  if(!deployer){
    deployer = new Deployer(event.params.sender.toHex());
    deployer.hashCount = ZERO;
    deployer.save();
  }

  OffchainAssetReceiptVaultTemplate.create(event.params.child);
}
