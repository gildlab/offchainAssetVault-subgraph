import {
    Deployment,
  } from "../generated/OffchainAssetReceiptVaultBeaconSetDeployer/OffchainAssetReceiptVaultBeaconSetDeployer";
  import {
    Authorizer,
    Deployer,
    OffchainAssetReceiptVault
  } from "../generated/schema";
  import { OffchainAssetReceiptVaultTemplate, OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
  import { ZERO, ZERO_ADDRESS } from "./utils";
  import { NetworkImplementation } from "./networkImplementation";
  import { dataSource } from "@graphprotocol/graph-ts";


  export function handleDeployment(event: Deployment): void { 

    let child = new OffchainAssetReceiptVault(event.params.offchainAssetReceiptVault.toHex());
    child.address = event.params.offchainAssetReceiptVault;
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

    let authorizer = new Authorizer(event.params.offchainAssetReceiptVault.toHex());
    authorizer.address = event.params.offchainAssetReceiptVault;
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
  
    OffchainAssetReceiptVaultTemplate.create(event.params.offchainAssetReceiptVault);

}