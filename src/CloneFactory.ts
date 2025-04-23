import {
  NewClone,
} from "../generated/CloneFactory/CloneFactory";
import {
  Authorizer,
  Deployer,
  OffchainAssetReceiptVault
} from "../generated/schema";
import { OffchainAssetReceiptVaultTemplate, OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
import { ZERO, ZERO_ADDRESS } from "./utils";
import { NetworkImplementation } from "./networkImplementation";
import { dataSource } from "@graphprotocol/graph-ts";

export function handleNewClone(event: NewClone): void {  
  let implementationAddress = event.params.implementation.toHex();

  let networkImplementation = new NetworkImplementation(dataSource.network());
  
  if (networkImplementation.isAuthorizerImplementation(implementationAddress)) {
    // Handle as an authorizer
    let authorizer = new Authorizer(event.params.clone.toHex());
    authorizer.address = event.params.clone;
    authorizer.isActive = true;
    authorizer.save();
  
    OffchainAssetReceiptVaultAuthorizerV1Template.create(event.params.clone);
  } else {
    // Handle as a vault
    let child = new OffchainAssetReceiptVault(event.params.clone.toHex());
    child.address = event.params.clone;
    child.deployBlock = event.block.number;
    child.deployTimestamp = event.block.timestamp;
    child.deployer = event.params.sender;
    child.admin = event.params.sender;
  
    child.name = "";
    child.symbol = "";
    child.totalShares = ZERO;
    child.certifiedUntil = ZERO;
    child.hashCount = ZERO;
    child.shareHoldersCount = ZERO;
    child.activeAuthorizer = ZERO_ADDRESS;

    let authorizer = new Authorizer(event.params.clone.toHex());
    authorizer.address = event.params.clone;
    authorizer.isActive = true;
    authorizer.save();
    child.activeAuthorizer = authorizer.id;
    
    child.save();
  
    let deployer = Deployer.load(event.params.sender.toHex());
    if(!deployer){
      deployer = new Deployer(event.params.sender.toHex());
      deployer.hashCount = ZERO;
      child.shareHoldersCount = ZERO;
      deployer.save();
    }
  
    OffchainAssetReceiptVaultTemplate.create(event.params.clone);
  }
}
