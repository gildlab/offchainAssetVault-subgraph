import {
    NewClone,
} from "../generated/CloneFactory/CloneFactory";
import { newMockEvent } from "matchstick-as";
import {
    Authorizer,
    Deployer,
    OffchainAssetReceiptVault
} from "../generated/schema";
import {
    BigInt,
    ethereum,
    Address,
    Bytes,
    Value,
  } from "@graphprotocol/graph-ts";
import { OffchainAssetReceiptVaultTemplate, OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
import { ZERO } from "../src/utils";
import { AuthorizerSet, Certify as CertifyEvent, } from "../generated/templates/OffchainAssetReceiptVaultTemplate/OffchainAssetReceiptVault";
// event NewClone(address sender, address implementation, address clone);
export function createNewCloneEvent(
    sender: Address,
    implementation: Address,
    clone: Address
  ): NewClone {

    let mockEvent = newMockEvent();
    let newCloneEvent = new NewClone(
        mockEvent.address,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters,
        null
    );
    newCloneEvent.parameters = new Array();
    newCloneEvent.parameters.push(
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
    );
    newCloneEvent.parameters.push(
        new ethereum.EventParam("implementation", ethereum.Value.fromAddress(implementation))
    );
    newCloneEvent.parameters.push(
        new ethereum.EventParam("clone", ethereum.Value.fromAddress(clone))
    );
    return newCloneEvent;
  }

  // event SetAuthorizer(address sender, address authorizer);
  export function createSetAuthorizerEvent(
    sender: Address,
    authorizer: Address,
    contractAddress: Address
  ): AuthorizerSet {
    let mockEvent = newMockEvent();
    let setAuthorizerEvent = new AuthorizerSet(
        contractAddress,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters,
        null
    );
    setAuthorizerEvent.parameters = new Array();
    setAuthorizerEvent.parameters.push(
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
    );
    setAuthorizerEvent.parameters.push(
        new ethereum.EventParam("authorizer", ethereum.Value.fromAddress(authorizer))
    );
    return setAuthorizerEvent;
}

// event Certify(address sender, uint256 certifyUntil, bool forceUntil, bytes data);
export function createCertifyEvent(
    sender: Address,
    certifyUntil: BigInt,
    force: boolean,
    data: Bytes,
    contractAddress: Address
): CertifyEvent {
    let mockEvent = newMockEvent();
    let certifyEvent = new CertifyEvent(
        contractAddress,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,  
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters,
        null
    );
    certifyEvent.parameters = new Array();
    certifyEvent.parameters.push(
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
    );
    certifyEvent.parameters.push(
        new ethereum.EventParam("certifyUntil", ethereum.Value.fromUnsignedBigInt(certifyUntil))
    );
    certifyEvent.parameters.push(
        new ethereum.EventParam("forceUntil", ethereum.Value.fromBoolean(force))
    );
    certifyEvent.parameters.push(
        new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
    );
    return certifyEvent;
}
    