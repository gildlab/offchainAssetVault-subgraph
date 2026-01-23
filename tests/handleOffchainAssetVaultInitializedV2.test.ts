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
    Value,
} from "@graphprotocol/graph-ts";
import { createNewCloneEvent, VaultConfig, ReceiptVaultConfig, createOffchainAssetReceiptVaultInitializedV2Event, createDeploymentEvent, createMockReceiptFunction } from "./mock.test";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { handleOffchainAssetVaultInitializedV2 } from "../src/OffchainAssetReceiptVault";

describe("OffchainAssetVaultInitializedV2 Test", () => {
    const dataSourceAddress = '0xA16081F360e3847006dB660bae1c6d1b2e17eC2A';

    beforeAll(() => {
        let context = new DataSourceContext()
        context.set('contextVal', Value.fromI32(325))
        dataSourceMock.setReturnValues(dataSourceAddress, 'polygon-amoy', context)
    })

    afterEach(() => {
        clearStore();
        clearInBlockStore();
    });
    
    test("handle offchain asset vault initialized v2", () => {

        const initialAdmin = Address.fromString("0x1234567890123456789012345678901234567890");

        // Asset Vault Deployment (handled by StoxUnifiedDeployer)
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        const receipt = Address.fromString("0x0000000000000000000000000000000000cccccc");
        const wrapper = Address.fromString("0x0000000000000000000000000000000000dddddd");
        // Mock the receipt() RPC call
        createMockReceiptFunction(assetVaultClone, receipt);
        let deploymentEvent = createDeploymentEvent(initialAdmin, assetVaultClone, wrapper, Address.fromString(dataSourceAddress));
        handleDeployment(deploymentEvent);

        const vaultConfig = new VaultConfig(Address.fromString("0x1234567890123456789012345678901234567891"), "Test Vault", "TST");
        const receiptVaultConfig = new ReceiptVaultConfig(vaultConfig, Address.fromString("0x1234567890123456789012345678901234567892"));

        const offchainAssetReceiptVaultInitializedV2Event = createOffchainAssetReceiptVaultInitializedV2Event(
            initialAdmin,
            initialAdmin,
            receiptVaultConfig,
            assetVaultClone
        );
        handleOffchainAssetVaultInitializedV2(offchainAssetReceiptVaultInitializedV2Event);

        assert.entityCount("OffchainAssetReceiptVault", 1);
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHex(),
            "admin", 
            initialAdmin.toHex()
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHex(),
            "name",
            vaultConfig.name.toString()
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHex(),
            "symbol",
            vaultConfig.symbol.toString()
        );
        assert.fieldEquals(
            "OffchainAssetReceiptVault",
            assetVaultClone.toHex(),
            "receiptContractAddress",
            receiptVaultConfig.receipt.toHex()
        );
    })
})

