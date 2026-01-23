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
    Bytes,
    DataSourceContext,
    Value,
    BigInt
} from "@graphprotocol/graph-ts";
import { createDepositEvent, createNewCloneEvent, createMockERC20Functions, createWithdrawEvent, createDeploymentEvent, createMockReceiptFunction } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleDeposit, handleWithdraw } from "../src/OffchainAssetReceiptVault";
import { getAccount, getReceiptBalance } from "../src/utils";


describe("Withdraw Test", () => {

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

    test("handle withdraw", () => {
        const depositorWithdrawer = Address.fromString("0x1234567890123456789012345678901234567890");

        // Asset Vault Deployment (handled by StoxUnifiedDeployer)
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        const receipt = Address.fromString("0x0000000000000000000000000000000000cccccc");
        const wrapper = Address.fromString("0x0000000000000000000000000000000000dddddd");
        // Mock the receipt() RPC call
        createMockReceiptFunction(assetVaultClone, receipt);
        let deploymentEvent = createDeploymentEvent(depositorWithdrawer, assetVaultClone, wrapper, Address.fromString(dataSourceAddress));
        handleDeployment(deploymentEvent);

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(depositorWithdrawer, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        createMockERC20Functions(assetVaultClone);

        const depositEvent = createDepositEvent(
            depositorWithdrawer,
            depositorWithdrawer,
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

        const withdrawEvent = createWithdrawEvent(
            depositorWithdrawer,
            depositorWithdrawer,
            depositorWithdrawer,
            BigInt.fromString("500000000000000000"),
            BigInt.fromString("500000000000000000"),
            BigInt.fromString("1"),
            Bytes.fromHexString("0x"),
            assetVaultClone
        );
        handleWithdraw(withdrawEvent);
        assert.entityCount("WithdrawWithReceipt", 1);

        const withdrawWithReceiptId = `WithdrawWithReceipt-${withdrawEvent.transaction.hash.toHex()}-${withdrawEvent.params.id.toString()}`;
        const emitter = getAccount(depositorWithdrawer.toHex(), assetVaultClone.toHex()).id;

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "id",
            withdrawWithReceiptId
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "amount",
            withdrawEvent.params.shares.toString()
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "caller",
            emitter
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "emitter",
            emitter
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "owner",
            emitter
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "offchainAssetReceiptVault",
            assetVaultClone.toHex()
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "data",
            withdrawEvent.params.receiptInformation.toString()
        );

        assert.fieldEquals(
            "WithdrawWithReceipt",
            withdrawWithReceiptId,
            "erc1155TokenId",
            withdrawEvent.params.id.toString()
        );
        const receiptBalance = getReceiptBalance(assetVaultClone.toHex(), withdrawEvent.params.id);
        assert.fieldEquals(
            "ReceiptBalance",
            receiptBalance.id,
            "value",
            "0.5"
        );
        assert.fieldEquals(
            "ReceiptBalance",
            receiptBalance.id,
            "valueExact",
            "500000000000000000"
        );
        const withdrawEvent2 = createWithdrawEvent(
            depositorWithdrawer,
            depositorWithdrawer,
            depositorWithdrawer,
            BigInt.fromString("500000000000000000"),
            BigInt.fromString("500000000000000000"),
            BigInt.fromString("1"),
            Bytes.fromHexString("0x"),
            assetVaultClone
        );
        handleWithdraw(withdrawEvent2);

        assert.entityCount("WithdrawWithReceipt", 1);

        assert.fieldEquals(
            "ReceiptBalance",
            receiptBalance.id,
            "value",
            "0"
        );

        assert.fieldEquals(
            "ReceiptBalance",
            receiptBalance.id,
            "valueExact",
            "0"
        );
    })

})