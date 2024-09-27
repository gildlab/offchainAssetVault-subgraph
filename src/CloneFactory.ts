import {
  NewClone,
} from "../generated/CloneFactory/CloneFactory";
import {
  Deployer,
  OffchainAssetReceiptVault,
  OffchainAssetReceiptVaultFactory,
} from "../generated/schema";
import { OffchainAssetReceiptVaultTemplate } from "../generated/templates";
import { ONE, ZERO } from "./utils";


export function handleNewClone(event: NewClone): void {
  let child = new OffchainAssetReceiptVault(event.params.clone.toHex());
  child.address = event.params.clone;
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
  child.shareHoldersCount = ZERO;

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
    child.shareHoldersCount = ZERO;
    deployer.save();
  }

  OffchainAssetReceiptVaultTemplate.create(event.params.clone);
}
