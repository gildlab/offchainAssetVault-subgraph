import { NewClone } from "../generated/CloneFactory/CloneFactory";
import { Authorizer } from "../generated/schema";
import { OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
import { NetworkImplementation } from "./networkImplementation";
import { dataSource } from "@graphprotocol/graph-ts";

export function handleNewClone(event: NewClone): void {
  let implementationAddress = event.params.implementation.toHex();

  let networkImplementation = new NetworkImplementation(dataSource.network());

  if (networkImplementation.isAuthorizerImplementation(implementationAddress)) {
    let authorizer = new Authorizer(event.params.clone.toHex());
    authorizer.address = event.params.clone;
    authorizer.isActive = true;
    authorizer.save();

    OffchainAssetReceiptVaultAuthorizerV1Template.create(event.params.clone);
  }
}
