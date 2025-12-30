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
import { createDepositEvent, createNewCloneEvent, createMockERC20Functions, createDeploymentEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { handleDeployment } from "../src/OffchainAssetReceiptVaultBeaconSetDeployer";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleDeposit } from "../src/OffchainAssetReceiptVault";
import { getAccount, getReceipt } from "../src/utils";

describe("Deposit Test", () => {

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

    test("handle deposit", () => {
        const depositor = Address.fromString("0x1234567890123456789012345678901234567890");

        // Asset Vault Deployment (handled by OffchainAssetReceiptVaultBeaconSetDeployer)
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        const receipt = Address.fromString("0x0000000000000000000000000000000000cccccc");
        let deploymentEvent = createDeploymentEvent(depositor, assetVaultClone, receipt, Address.fromString(dataSourceAddress));
        handleDeployment(deploymentEvent);

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(depositor, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        createMockERC20Functions(assetVaultClone);

        const depositEvent = createDepositEvent(
            depositor,
            depositor,
            BigInt.fromString("1000000000000000000"),
            BigInt.fromString("1000000000000000000"),
            BigInt.fromString("1"),
            Bytes.fromHexString("0x"),
            assetVaultClone
        );
        handleDeposit(depositEvent);

        assert.entityCount("DepositWithReceipt", 1);
        assert.entityCount("OffchainAssetReceiptVault", 1);
        assert.entityCount("Authorizer", 2); // 1 from vault deployment + 1 from authorizer clone

        const depositWithReceiptId = `DepositWithReceipt-${depositEvent.transaction.hash.toHex()}-${depositEvent.params.id.toString()}`;
        const emitter = getAccount(depositor.toHex(), assetVaultClone.toHex()).id;
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "id",
            depositWithReceiptId
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "timestamp",
            depositEvent.block.timestamp.toString()
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "transaction",
            depositEvent.transaction.hash.toHex()
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "emitter",
            emitter
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "receiver",
            emitter
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "caller",
            emitter
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "offchainAssetReceiptVault",
            assetVaultClone.toHex()
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "amount",
            depositEvent.params.shares.toString()
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "data",
            depositEvent.params.receiptInformation.toString()
        );
        assert.fieldEquals(
            "DepositWithReceipt",
            depositWithReceiptId,
            "erc1155TokenId",
            depositEvent.params.id.toString()
        );

        const currentReceipt = getReceipt(assetVaultClone.toHex(), depositEvent.params.id);
        assert.fieldEquals(
            "Receipt",
            currentReceipt.id,
            "receiptId",
            depositEvent.params.id.toString()
        );
        assert.fieldEquals(
            "Receipt",
            currentReceipt.id,
            "shares",
            depositEvent.params.shares.toString()
        );
        assert.fieldEquals(
            "Receipt",
            currentReceipt.id,
            "offchainAssetReceiptVault",
            assetVaultClone.toHex()
        );  
    })

})