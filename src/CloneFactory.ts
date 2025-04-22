import {
  NewClone,
} from "../generated/CloneFactory/CloneFactory";
import {
  Authorizer,
  Deployer,
  OffchainAssetReceiptVault,
  OffchainAssetReceiptVaultFactory,
} from "../generated/schema";
import { OffchainAssetReceiptVaultTemplate, OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
import { ONE, ZERO } from "./utils";
import { log } from "@graphprotocol/graph-ts";
import { networkImplementation } from "./networkImplementation";


export function handleNewClone(event: NewClone): void {
  log.info("NewClone event detected: {}", [event.params.clone.toHex()]);
  log.info("Implementation: {}", [event.params.implementation.toHex()]);
  log.info("Sender: {}", [event.params.sender.toHex()]);
  
  // Check if this is an authorizer implementation using our network config
  let implementationAddress = event.params.implementation.toHex();
  
  if (networkImplementation.isAuthorizerImplementation(implementationAddress)) {
    log.info("Detected new authorizer clone: {}", [event.params.clone.toHex()]);
    // Handle as an authorizer
    let authorizer = new Authorizer(event.params.clone.toHex());
    authorizer.address = event.params.clone;
    authorizer.isActive = true;
    authorizer.save();
    
    // Create the template for this authorizer to track all role events from creation
    log.info("Creating template for new authorizer: {}", [event.params.clone.toHex()]);
    OffchainAssetReceiptVaultAuthorizerV1Template.create(event.params.clone);
  } else {
    log.info("Detected new vault clone: {}", [event.params.clone.toHex()]);
    // Handle as a vault
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
}
