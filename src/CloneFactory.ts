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
  }
}
