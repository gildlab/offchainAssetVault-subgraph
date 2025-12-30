import {
  test,
  assert,
  clearStore,
  describe,
  afterEach,
  beforeAll,
  clearInBlockStore,
  dataSourceMock
} from "matchstick-as";
import {
  Address,
  DataSourceContext,
  Value
} from "@graphprotocol/graph-ts";
import { handleDeployment } from "../src/OffchainAssetReceiptVaultBeaconSetDeployer";
import { createDeploymentEvent } from "./mock.test";

describe("Handle Deployment Test", () => {

  const dataSourceAddress = '0xA16081F360e3847006dB660bae1c6d1b2e17eC2A'

  beforeAll(() => {
    let context = new DataSourceContext()
    context.set('contextVal', Value.fromI32(325))
    dataSourceMock.setReturnValues(dataSourceAddress, 'polygon-amoy', context)
  });

  afterEach(() => {
    clearStore();
    clearInBlockStore();
  });

  test("handle deployment creates OffchainAssetReceiptVault and Authorizer", () => {
    const sender = Address.fromString("0x1234567890123456789012345678901234567890");
    const offchainAssetReceiptVault = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt = Address.fromString("0x1234567890123456789012345678901234567892");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    let deploymentEvent = createDeploymentEvent(
      sender,
      offchainAssetReceiptVault,
      receipt,
      contractAddress
    );

    handleDeployment(deploymentEvent);

    // Verify OffchainAssetReceiptVault entity was created
    assert.entityCount("OffchainAssetReceiptVault", 1);
    assert.entityCount("Authorizer", 1);
    assert.entityCount("Deployer", 1);

    // Verify OffchainAssetReceiptVault fields
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "address",
      offchainAssetReceiptVault.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "deployer",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "admin",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "name",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "symbol",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "totalShares",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "certifiedUntil",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "hashCount",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "shareHoldersCount",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "deployBlock",
      deploymentEvent.block.number.toString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "deployTimestamp",
      deploymentEvent.block.timestamp.toString()
    );

    // Verify Authorizer entity was created
    assert.fieldEquals(
      "Authorizer",
      offchainAssetReceiptVault.toHexString(),
      "address",
      offchainAssetReceiptVault.toHexString()
    );

    assert.fieldEquals(
      "Authorizer",
      offchainAssetReceiptVault.toHexString(),
      "isActive",
      "true"
    );

    // Verify activeAuthorizer is set correctly
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault.toHexString(),
      "activeAuthorizer",
      offchainAssetReceiptVault.toHexString()
    );

    // Verify Deployer entity was created
    assert.fieldEquals(
      "Deployer",
      sender.toHexString(),
      "hashCount",
      "0"
    );
  });

  test("handle deployment with existing deployer does not create duplicate", () => {
    const sender = Address.fromString("0x1234567890123456789012345678901234567890");
    const offchainAssetReceiptVault1 = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt1 = Address.fromString("0x1234567890123456789012345678901234567892");
    const offchainAssetReceiptVault2 = Address.fromString("0x1234567890123456789012345678901234567893");
    const receipt2 = Address.fromString("0x1234567890123456789012345678901234567894");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    // First deployment
    let deploymentEvent1 = createDeploymentEvent(
      sender,
      offchainAssetReceiptVault1,
      receipt1,
      contractAddress
    );
    handleDeployment(deploymentEvent1);

    // Second deployment by same sender
    let deploymentEvent2 = createDeploymentEvent(
      sender,
      offchainAssetReceiptVault2,
      receipt2,
      contractAddress
    );
    handleDeployment(deploymentEvent2);

    // Verify only one Deployer entity exists
    assert.entityCount("Deployer", 1);
    assert.entityCount("OffchainAssetReceiptVault", 2);
    assert.entityCount("Authorizer", 2);

    // Verify both vaults reference the same deployer
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault1.toHexString(),
      "deployer",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault2.toHexString(),
      "deployer",
      sender.toHexString()
    );
  });

  test("handle deployment with different senders creates separate deployers", () => {
    const sender1 = Address.fromString("0x1234567890123456789012345678901234567890");
    const sender2 = Address.fromString("0x1234567890123456789012345678901234567899");
    const offchainAssetReceiptVault1 = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt1 = Address.fromString("0x1234567890123456789012345678901234567892");
    const offchainAssetReceiptVault2 = Address.fromString("0x1234567890123456789012345678901234567893");
    const receipt2 = Address.fromString("0x1234567890123456789012345678901234567894");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    // First deployment by sender1
    let deploymentEvent1 = createDeploymentEvent(
      sender1,
      offchainAssetReceiptVault1,
      receipt1,
      contractAddress
    );
    handleDeployment(deploymentEvent1);

    // Second deployment by sender2
    let deploymentEvent2 = createDeploymentEvent(
      sender2,
      offchainAssetReceiptVault2,
      receipt2,
      contractAddress
    );
    handleDeployment(deploymentEvent2);

    // Verify two Deployer entities exist
    assert.entityCount("Deployer", 2);
    assert.entityCount("OffchainAssetReceiptVault", 2);
    assert.entityCount("Authorizer", 2);

    // Verify each vault references its own deployer
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault1.toHexString(),
      "deployer",
      sender1.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      offchainAssetReceiptVault2.toHexString(),
      "deployer",
      sender2.toHexString()
    );
  });
});
