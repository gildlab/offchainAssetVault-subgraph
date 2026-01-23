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
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { createDeploymentEvent, createMockReceiptFunction } from "./mock.test";

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
    const asset = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt = Address.fromString("0x1234567890123456789012345678901234567892");
    const wrapper = Address.fromString("0x1234567890123456789012345678901234567893");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    // Mock the receipt() RPC call
    createMockReceiptFunction(asset, receipt);
    let deploymentEvent = createDeploymentEvent(
      sender,
      asset,
      wrapper,
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
      asset.toHexString(),
      "address",
      asset.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "deployer",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "admin",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "name",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "symbol",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "totalShares",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "certifiedUntil",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "hashCount",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "shareHoldersCount",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "deployBlock",
      deploymentEvent.block.number.toString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "deployTimestamp",
      deploymentEvent.block.timestamp.toString()
    );

    // Verify Authorizer entity was created
    assert.fieldEquals(
      "Authorizer",
      asset.toHexString(),
      "address",
      asset.toHexString()
    );

    assert.fieldEquals(
      "Authorizer",
      asset.toHexString(),
      "isActive",
      "true"
    );

    // Verify activeAuthorizer is set correctly
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset.toHexString(),
      "activeAuthorizer",
      asset.toHexString()
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
    const asset1 = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt1 = Address.fromString("0x1234567890123456789012345678901234567892");
    const wrapper1 = Address.fromString("0x1234567890123456789012345678901234567893");
    const asset2 = Address.fromString("0x1234567890123456789012345678901234567894");
    const receipt2 = Address.fromString("0x1234567890123456789012345678901234567895");
    const wrapper2 = Address.fromString("0x1234567890123456789012345678901234567896");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    // First deployment
    createMockReceiptFunction(asset1, receipt1);
    let deploymentEvent1 = createDeploymentEvent(
      sender,
      asset1,
      wrapper1,
      contractAddress
    );
    handleDeployment(deploymentEvent1);

    // Second deployment by same sender
    createMockReceiptFunction(asset2, receipt2);
    let deploymentEvent2 = createDeploymentEvent(
      sender,
      asset2,
      wrapper2,
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
      asset1.toHexString(),
      "deployer",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset2.toHexString(),
      "deployer",
      sender.toHexString()
    );
  });

  test("handle deployment with different senders creates separate deployers", () => {
    const sender1 = Address.fromString("0x1234567890123456789012345678901234567890");
    const sender2 = Address.fromString("0x1234567890123456789012345678901234567899");
    const asset1 = Address.fromString("0x1234567890123456789012345678901234567891");
    const receipt1 = Address.fromString("0x1234567890123456789012345678901234567892");
    const wrapper1 = Address.fromString("0x1234567890123456789012345678901234567893");
    const asset2 = Address.fromString("0x1234567890123456789012345678901234567894");
    const receipt2 = Address.fromString("0x1234567890123456789012345678901234567895");
    const wrapper2 = Address.fromString("0x1234567890123456789012345678901234567896");
    const contractAddress = Address.fromString(dataSourceAddress);
    
    // First deployment by sender1
    createMockReceiptFunction(asset1, receipt1);
    let deploymentEvent1 = createDeploymentEvent(
      sender1,
      asset1,
      wrapper1,
      contractAddress
    );
    handleDeployment(deploymentEvent1);

    // Second deployment by sender2
    createMockReceiptFunction(asset2, receipt2);
    let deploymentEvent2 = createDeploymentEvent(
      sender2,
      asset2,
      wrapper2,
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
      asset1.toHexString(),
      "deployer",
      sender1.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      asset2.toHexString(),
      "deployer",
      sender2.toHexString()
    );
  });
});
