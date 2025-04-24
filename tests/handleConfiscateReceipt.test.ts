import {
    test,
    assert,
    clearStore,
    describe,
    afterEach,
    beforeAll,
    clearInBlockStore,
    dataSourceMock,
} from "matchstick-as";
import {
    Address,
    Bytes,
    DataSourceContext,
    Value,
    BigInt
} from "@graphprotocol/graph-ts";
import { createNewCloneEvent, createMockERC20Functions, createConfiscateReceiptEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS, AMOY_VAULT_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleConfiscateReceipt } from "../src/OffchainAssetReceiptVault";
import { getAccount, getReceipt } from "../src/utils";

describe("Confiscate Receipt Test", () => {
    const dataSourceAddress = '0xA16081F360e3847006dB660bae1c6d1b2e17eC2A';

    beforeAll(() => {
        let context = new DataSourceContext()
        context.set('contextVal', Value.fromI32(325))
        dataSourceMock.setReturnValues(dataSourceAddress, 'polygon-amoy', context)
    });

    afterEach(() => {
        clearStore();
        clearInBlockStore();
    });

    test("handle confiscate receipt", () => {
        const confiscator = Address.fromString("0x1234567890123456789012345678901234567890");
        const depositor = Address.fromString("0x1234567890123456789012345678901234567891");

        // Asset Vault Clone
        const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        let assetVaultCloneEvent = createNewCloneEvent(depositor, assetVaultImplementation, assetVaultClone);
        handleNewClone(assetVaultCloneEvent);

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(depositor, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        createMockERC20Functions(assetVaultClone);

        const confiscateReceiptEvent = createConfiscateReceiptEvent(
            confiscator,
            depositor,
            BigInt.fromString("1"),
            BigInt.fromString("1000000000000000000"),
            BigInt.fromString("1000000000000000000"),
            Bytes.fromHexString("0x1234567890123456789012345678901234567890"),
            assetVaultClone
        );

        handleConfiscateReceipt(confiscateReceiptEvent);

        assert.entityCount("ConfiscateReceipt", 1);

        const confiscateReceiptId = `ConfiscateReceipt-${confiscateReceiptEvent.transaction.hash.toHex()}`;
        const confiscatorAccount = getAccount(
            confiscator.toHex(),
            assetVaultClone.toHex()
        ).id;
        const confiscateeAccount = getAccount(
            depositor.toHex(),
            assetVaultClone.toHex()
        ).id;
        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "id",
            confiscateReceiptId
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "timestamp",
            confiscateReceiptEvent.block.timestamp.toString()
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "transaction",
            confiscateReceiptEvent.transaction.hash.toHex()
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "emitter",
            confiscatorAccount
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "confiscatee",
            confiscateeAccount
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "confiscator",
            confiscatorAccount
        );

        const receipt = getReceipt  (
            assetVaultClone.toHex(),
            BigInt.fromString("1")
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "receipt",
            receipt.id
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "confiscated",
            confiscateReceiptEvent.params.confiscated.toString()
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "offchainAssetReceiptVault",
            assetVaultClone.toHex()
        );

        assert.fieldEquals(
            "ConfiscateReceipt",
            confiscateReceiptId,
            "data",
            confiscateReceiptEvent.params.justification.toString()
        );
        
    })

})
                