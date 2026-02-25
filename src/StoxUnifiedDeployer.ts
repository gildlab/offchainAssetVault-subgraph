import {
    Deployment,
  } from "../generated/StoxUnifiedDeployer/StoxUnifiedDeployer";
  import {
    Authorizer,
    Deployer,
    OffchainAssetReceiptVault
  } from "../generated/schema";
  import { OffchainAssetReceiptVaultTemplate, WrappedTokenTemplate } from "../generated/templates";
  import { OffchainAssetReceiptVault as OffchainAssetReceiptVaultContract } from "../generated/templates/OffchainAssetReceiptVaultTemplate/OffchainAssetReceiptVault";
  import { ZERO, ZERO_ADDRESS } from "./utils";
  import { Address, DataSourceContext } from "@graphprotocol/graph-ts";


  export function handleDeployment(event: Deployment): void { 

    let child = new OffchainAssetReceiptVault(event.params.asset.toHex());
    child.address = event.params.asset;
    child.wrappedTokenContractAddress = event.params.wrapper;
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

    // Call receipt() on the asset contract to get the receipt contract address
    let contract = OffchainAssetReceiptVaultContract.bind(event.params.asset);
    let receiptResult = contract.try_receipt();
    if (!receiptResult.reverted) {
      child.receiptContractAddress = receiptResult.value;
    }

    let authorizer = new Authorizer(event.params.asset.toHex());
    authorizer.address = event.params.asset;
    authorizer.isActive = true;
    authorizer.save();
    child.activeAuthorizer = authorizer.id;
    
    child.save();
  
    let deployer = Deployer.load(event.params.sender.toHex());
    if(!deployer){
      deployer = new Deployer(event.params.sender.toHex());
      deployer.hashCount = ZERO;
      deployer.save();
    }
  
    OffchainAssetReceiptVaultTemplate.create(event.params.asset);

    let zeroAddr = Address.fromString(ZERO_ADDRESS);
    if (!event.params.wrapper.equals(zeroAddr)) {
      let context = new DataSourceContext();
      context.setString("vaultId", event.params.asset.toHex());
      WrappedTokenTemplate.createWithContext(event.params.wrapper, context);
    }
}