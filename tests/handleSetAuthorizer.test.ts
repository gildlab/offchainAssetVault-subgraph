import {
    test,
    assert,
    clearStore,
    describe,
    afterEach,
    beforeAll,
    clearInBlockStore,
    dataSourceMock,
    logStore
} from "matchstick-as";
import {
    Address,
    DataSourceContext,
    Value
} from "@graphprotocol/graph-ts";
import { createNewCloneEvent, createSetAuthorizerEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS, AMOY_VAULT_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleAuthorizerSet } from "../src/OffchainAssetReceiptVault";
import { Authorizer } from "../generated/schema";

describe("Set Authorizer Test", () => {

    beforeAll(() => {
        let context = new DataSourceContext()
        context.set('contextVal', Value.fromI32(325))
        dataSourceMock.setReturnValues('0xA16081F360e3847006dB660bae1c6d1b2e17eC2A', 'polygon-amoy', context)
    });

    afterEach(() => {
        clearStore();
        clearInBlockStore();
    });

    test("handle set authorizer", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000000aaa");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        // Asset Vault Clone
        const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000000bbb");
        let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
        handleNewClone(assetVaultCloneEvent);

        assert.entityCount("OffchainAssetReceiptVault", 1);
        assert.entityCount("Authorizer", 2);
        assert.fieldEquals(
            "Authorizer",
            assetVaultClone.toHexString(),
            "isActive",
            "true"
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHexString(),
            "activeAuthorizer",
            assetVaultClone.toHexString()
        );

        // Set Authorizer
        const authorizerSetEvent = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
        handleAuthorizerSet(authorizerSetEvent);
        assert.fieldEquals(
            "Authorizer",
            authorizerClone.toHexString(),
            "isActive",
            "true"
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHexString(),
            "activeAuthorizer",
            authorizerClone.toHexString()
        );
        let assetVaultAuthorizer = Authorizer.load(assetVaultClone.toHexString());
        assert.assertNotNull(assetVaultAuthorizer);
        if (assetVaultAuthorizer == null) {
            return;
        }
        assert.booleanEquals(assetVaultAuthorizer.isActive, false);
        
    });

    test("handle set authorizer with multiple authorizers", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");

        // Asset Vault Clone
        const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
        handleNewClone(assetVaultCloneEvent);

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone1 = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent1 = createNewCloneEvent(sender, authorizerImplementation, authorizerClone1);
        handleNewClone(authorizerCloneEvent1);

        // Set Authorizer
        const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone1, assetVaultClone);
        handleAuthorizerSet(authorizerSetEvent1);

        // Assertions
        assert.entityCount("OffchainAssetReceiptVault", 1);
        assert.entityCount("Authorizer", 2);
        assert.fieldEquals(
            "Authorizer",
            authorizerClone1.toHexString(),
            "isActive",
            "true"
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHexString(),
            "activeAuthorizer",
            authorizerClone1.toHexString()
        );
        
        const authorizerClone2 = Address.fromString("0x0000000000000000000000000000000000cccccc");
        let authorizerCloneEvent2 = createNewCloneEvent(sender, authorizerImplementation, authorizerClone2);
        handleNewClone(authorizerCloneEvent2);

        const authorizerSetEvent2 = createSetAuthorizerEvent(sender, authorizerClone2, assetVaultClone);
        handleAuthorizerSet(authorizerSetEvent2);

        // Assertions
        assert.entityCount("OffchainAssetReceiptVault", 1);
        assert.entityCount("Authorizer", 3);

        assert.fieldEquals(
            "Authorizer",
            authorizerClone1.toHexString(),
            "isActive",
            "false"
        );
        assert.fieldEquals(
            "Authorizer",
            authorizerClone2.toHexString(),
            "isActive",
            "true"
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHexString(),
            "activeAuthorizer",
            authorizerClone2.toHexString()
        );
        
    });
    
})