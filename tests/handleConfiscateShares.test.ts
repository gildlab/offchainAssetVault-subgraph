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
import { createNewCloneEvent, createMockERC20Functions, createConfiscateSharesEvent, createDeploymentEvent, createMockReceiptFunction } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleConfiscateShares } from "../src/OffchainAssetReceiptVault";
import { getAccount } from "../src/utils";

describe("Confiscate Shares Test", () => {

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

    test("handle confiscate shares", () => {
        const confiscator = Address.fromString("0x1234567890123456789012345678901234567890");
        const depositor = Address.fromString("0x1234567890123456789012345678901234567891");

        // Asset Vault Deployment (handled by StoxUnifiedDeployer)
        const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
        const receipt = Address.fromString("0x0000000000000000000000000000000000cccccc");
        const wrapper = Address.fromString("0x0000000000000000000000000000000000dddddd");
        // Mock the receipt() RPC call
        createMockReceiptFunction(assetVaultClone, receipt);
        let deploymentEvent = createDeploymentEvent(depositor, assetVaultClone, wrapper, Address.fromString(dataSourceAddress));
        handleDeployment(deploymentEvent);

        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(depositor, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        createMockERC20Functions(assetVaultClone);

        const confiscateSharesEvent = createConfiscateSharesEvent(
            confiscator,
            depositor,
            BigInt.fromString("1000000000000000000"),
            BigInt.fromString("1000000000000000000"),
            Bytes.fromHexString("0x1234567890123456789012345678901234567890"),
            assetVaultClone
        );
        handleConfiscateShares(confiscateSharesEvent);

        assert.entityCount("ConfiscateShares", 1);

        const confiscateSharesId = `ConfiscateShares-${confiscateSharesEvent.transaction.hash.toHex()}`;
        const emitter = getAccount(confiscator.toHex(), assetVaultClone.toHex()).id;
        const confiscatee = getAccount(depositor.toHex(), assetVaultClone.toHex()).id;


        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "id",
            confiscateSharesId
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "timestamp",
            confiscateSharesEvent.block.timestamp.toString()
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "emitter",
            emitter
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "confiscatee",
            confiscatee
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "confiscator",
            emitter
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "confiscated",
            confiscateSharesEvent.params.confiscated.toString()
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "offchainAssetReceiptVault",
            assetVaultClone.toHex()
        );

        assert.fieldEquals(
            "ConfiscateShares",
            confiscateSharesId,
            "data",
            confiscateSharesEvent.params.justification.toString()
        );
    })
})