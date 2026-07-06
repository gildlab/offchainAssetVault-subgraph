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
} from "@graphprotocol/graph-ts";
import { createNewCloneEvent, createRoleAdminChangedEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleRoleAdminChanged } from "../src/OffchainAssetReceiptVaultAuthorizerV1";
import { CERTIFY, CERTIFY_ADMIN, CONFISCATE_RECEIPT, CONFISCATE_RECEIPT_ADMIN, CONFISCATE_SHARES, CONFISCATE_SHARES_ADMIN, DEPOSIT, DEPOSIT_ADMIN, NULL_ROLE, WITHDRAW, WITHDRAW_ADMIN } from "../src/roles";
describe("handleRoleAdminChanged", () => {
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

    test("handle role admin changed CERTIFY", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CERTIFY),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CERTIFY_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CERTIFY}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CERTIFY");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CERTIFY);

    });

    test("handle role admin changed CERTIFY_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CERTIFY_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CERTIFY_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CERTIFY_ADMIN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CERTIFY_ADMIN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CERTIFY_ADMIN);

    });

    test("handle role admin changed CONFISCATE_RECEIPT", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CONFISCATE_RECEIPT),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CONFISCATE_RECEIPT_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CONFISCATE_RECEIPT}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CONFISCATE_RECEIPT");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CONFISCATE_RECEIPT);

    });

    test("handle role admin changed CONFISCATE_RECEIPT_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CONFISCATE_RECEIPT_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CONFISCATE_RECEIPT_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CONFISCATE_RECEIPT_ADMIN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CONFISCATE_RECEIPT_ADMIN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CONFISCATE_RECEIPT_ADMIN);

    });

    test("handle role admin changed CONFISCATE_SHARES", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CONFISCATE_SHARES),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CONFISCATE_SHARES_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CONFISCATE_SHARES}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CONFISCATE_SHARES");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CONFISCATE_SHARES);

    });

    test("handle role admin changed CONFISCATE_SHARES_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CONFISCATE_SHARES_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CONFISCATE_SHARES_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${CONFISCATE_SHARES_ADMIN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "CONFISCATE_SHARES_ADMIN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", CONFISCATE_SHARES_ADMIN);

    });

    test("handle role admin changed DEPOSIT", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(DEPOSIT),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(DEPOSIT_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${DEPOSIT}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "DEPOSIT");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", DEPOSIT);

    });

    test("handle role admin changed DEPOSIT_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(DEPOSIT_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(DEPOSIT_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${DEPOSIT_ADMIN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "DEPOSIT_ADMIN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", DEPOSIT_ADMIN);

    });

    test("handle role admin changed WITHDRAW", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(WITHDRAW),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(WITHDRAW_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${WITHDRAW}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "WITHDRAW");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", WITHDRAW);

    });

    test("handle role admin changed WITHDRAW_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(WITHDRAW_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(WITHDRAW_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${WITHDRAW_ADMIN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "WITHDRAW_ADMIN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", WITHDRAW_ADMIN);

    });

    test("handle role admin changed UNKNOWN", () => {
        const UNKNOWN = "0x0000000000000000000000000000000000000000000000000000000000000001";
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        // Authorizer Clone
        const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
        const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
        let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
        handleNewClone(authorizerCloneEvent);

        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(UNKNOWN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(UNKNOWN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);
        assert.entityCount("Role", 1);

        const roleId = `${authorizerClone.toHex()}-${UNKNOWN}`;
        assert.fieldEquals("Role", roleId, "id", roleId);
        assert.fieldEquals("Role", roleId, "roleName", "UNKNOWN");
        assert.fieldEquals("Role", roleId, "authorizer", authorizerClone.toHex());
        assert.fieldEquals("Role", roleId, "roleHash", UNKNOWN);

    });


})