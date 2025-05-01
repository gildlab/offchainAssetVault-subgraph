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
import { handleNewClone } from "../src/CloneFactory";
import { createNewCloneEvent } from "./mock.test";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS, AMOY_VAULT_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";


describe("Clone Factory Test", () => {

  beforeAll(() => {
    let context = new DataSourceContext()
    context.set('contextVal', Value.fromI32(325))
    dataSourceMock.setReturnValues('0xA16081F360e3847006dB660bae1c6d1b2e17eC2A', 'polygon-amoy', context)
  });

  afterEach(() => {
    clearStore();
    clearInBlockStore();
  });

  test("handle new authorizer clone", () => {

    const sender = Address.fromString("0x1234567890123456789012345678901234567890");
    const implementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
    const clone = Address.fromString("0x1234567890123456789012345678901234567892");
    let newCloneEvent = createNewCloneEvent(sender, implementation, clone);

    handleNewClone(newCloneEvent);

    assert.entityCount("OffchainAssetReceiptVault", 0);
    assert.entityCount("Authorizer", 1);

    assert.fieldEquals(
      "Authorizer",
      clone.toHexString(),
      "address",
      clone.toHexString()
    );

    assert.fieldEquals(
      "Authorizer",
      clone.toHexString(),
      "isActive",
      "true"
    );
    
  });

  test("handle new vault clone", () => {
    const sender = Address.fromString("0x1234567890123456789012345678901234567890");
    const implementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
    const clone = Address.fromString("0x1234567890123456789012345678901234567892");
    let newCloneEvent = createNewCloneEvent(sender, implementation, clone);

    handleNewClone(newCloneEvent);

    assert.entityCount("OffchainAssetReceiptVault", 1);
    assert.entityCount("Authorizer", 1);

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "address",
      clone.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "deployer",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "admin",
      sender.toHexString()
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "name",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "symbol",
      ""
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "totalShares",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "certifiedUntil",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "shareHoldersCount",
      "0"
    );

    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      clone.toHexString(),
      "hashCount",
      "0"
    );
      
  });
});
