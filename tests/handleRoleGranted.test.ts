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
} from "@graphprotocol/graph-ts";
import { createNewCloneEvent, createRoleAdminChangedEvent, createRoleGrantedEvent, createSetAuthorizerEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS, AMOY_VAULT_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleRoleAdminChanged, handleRoleGranted } from "../src/OffchainAssetReceiptVaultAuthorizerV1";
import { CERTIFY, CERTIFY_ADMIN, CONFISCATE_RECEIPT, CONFISCATE_RECEIPT_ADMIN, CONFISCATE_SHARES, CONFISCATE_SHARES_ADMIN, DEPOSIT, DEPOSIT_ADMIN, NULL_ROLE, WITHDRAW, WITHDRAW_ADMIN } from "../src/roles";
import { handleAuthorizerSet } from "../src/OffchainAssetReceiptVault";
import { getAccount, getRoleHolder } from "../src/utils";

function testRoleGranted(roleName: string, role: string, roleAdmin: string, account: Address, sender: Address, authorizerClone: Address, assetVaultClone: Address): void {

    const roleAdminChangedEvent = createRoleAdminChangedEvent(
        Bytes.fromHexString(role),
        Bytes.fromHexString(NULL_ROLE),
        Bytes.fromHexString(roleAdmin),
        authorizerClone
    );
    handleRoleAdminChanged(roleAdminChangedEvent);

    const roleGrantedEvent = createRoleGrantedEvent(
        Bytes.fromHexString(role),
        account,
        sender,
        authorizerClone
    );
    handleRoleGranted(roleGrantedEvent); 
    assert.entityCount("RoleGranted", 1);

    const roleGrantedId = `${roleGrantedEvent.transaction.hash.toHex()}-${roleName}-granted`;
    const roleId = `${authorizerClone.toHex()}-${role}`;

    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "id",
        roleGrantedId
    );
    const accountEntity = getAccount(account.toHex(), assetVaultClone.toHex());
    const emitterEntity = getAccount(sender.toHex(), assetVaultClone.toHex());
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "account",
        accountEntity.id
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "emitter",
        emitterEntity.id
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "sender",
        emitterEntity.id
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "transaction",
        roleGrantedEvent.transaction.hash.toHex()
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "timestamp",
        roleGrantedEvent.block.timestamp.toString()
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "authorizer",
        authorizerClone.toHex()
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "role",
        roleId
    );
    
    let roleHolder = getRoleHolder(
        authorizerClone.toHex(),
        account.toHex(),
        role
    );
    assert.fieldEquals(
        "RoleGranted",
        roleGrantedId,
        "roleHolder",
        roleHolder.id
    );
    assert.fieldEquals(
        "RoleHolder",
        roleHolder.id,
        "activeRoles",
        `[${roleId}]`
    );
}

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

    test("handle role granted CERTIFY", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CERTIFY),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CERTIFY_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);

        const roleGrantedEvent = createRoleGrantedEvent(
            Bytes.fromHexString(CERTIFY),
            account,
            sender,
            authorizerClone
        );
        handleRoleGranted(roleGrantedEvent); 
        assert.entityCount("RoleGranted", 1);

        const roleGrantedId = `${roleGrantedEvent.transaction.hash.toHex()}-CERTIFY`;
        const roleId = `${authorizerClone.toHex()}-${CERTIFY}`;

        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "id",
            roleGrantedId
        );
        const accountEntity = getAccount(account.toHex(), assetVaultClone.toHex());
        const emitterEntity = getAccount(sender.toHex(), assetVaultClone.toHex());
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "account",
            accountEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "emitter",
            emitterEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "sender",
            emitterEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "transaction",
            roleGrantedEvent.transaction.hash.toHex()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "timestamp",
            roleGrantedEvent.block.timestamp.toString()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "authorizer",
            authorizerClone.toHex()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "role",
            roleId
        );

        let roleHolder = getRoleHolder(
            authorizerClone.toHex(),
            account.toHex(),
            CERTIFY
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "roleHolder",
            roleHolder.id
        );
        assert.fieldEquals(
            "RoleHolder",
            roleHolder.id,
            "activeRoles",
            `[${roleId}]`
        );
        
    })

    test("handle role granted CERTIFY_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
        const roleAdminChangedEvent = createRoleAdminChangedEvent(
            Bytes.fromHexString(CERTIFY_ADMIN),
            Bytes.fromHexString(NULL_ROLE),
            Bytes.fromHexString(CERTIFY_ADMIN),
            authorizerClone
        );
        handleRoleAdminChanged(roleAdminChangedEvent);

        const roleGrantedEvent = createRoleGrantedEvent(
            Bytes.fromHexString(CERTIFY_ADMIN),
            account,
            sender,
            authorizerClone
        );
        handleRoleGranted(roleGrantedEvent); 
        assert.entityCount("RoleGranted", 1);

        const roleGrantedId = `${roleGrantedEvent.transaction.hash.toHex()}-CERTIFY_ADMIN`;
        const roleId = `${authorizerClone.toHex()}-${CERTIFY_ADMIN}`;

        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "id",
            roleGrantedId
        );
        const accountEntity = getAccount(account.toHex(), assetVaultClone.toHex());
        const emitterEntity = getAccount(sender.toHex(), assetVaultClone.toHex());
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "account",
            accountEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "emitter",
            emitterEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "sender",
            emitterEntity.id
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "transaction",
            roleGrantedEvent.transaction.hash.toHex()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "timestamp",
            roleGrantedEvent.block.timestamp.toString()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "authorizer",
            authorizerClone.toHex()
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "role",
            roleId
        );
        
        let roleHolder = getRoleHolder(
            authorizerClone.toHex(),
            account.toHex(),
            CERTIFY_ADMIN
        );
        assert.fieldEquals(
            "RoleGranted",
            roleGrantedId,
            "roleHolder",
            roleHolder.id
        );
        assert.fieldEquals(
            "RoleHolder",
            roleHolder.id,
            "activeRoles",
            `[${roleId}]`
        );
        
    })
    
    test("handle role granted DEPOSIT", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("DEPOSIT",DEPOSIT, DEPOSIT_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted DEPOSIT_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("DEPOSIT_ADMIN",DEPOSIT_ADMIN, DEPOSIT_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted WITHDRAW", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("WITHDRAW",WITHDRAW, WITHDRAW_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted WITHDRAW_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("WITHDRAW_ADMIN",WITHDRAW_ADMIN, WITHDRAW_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted CONFISCATE_RECEIPT", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("CONFISCATE_RECEIPT",CONFISCATE_RECEIPT, CONFISCATE_RECEIPT_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted CONFISCATE_RECEIPT_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("CONFISCATE_RECEIPT_ADMIN",CONFISCATE_RECEIPT_ADMIN, CONFISCATE_RECEIPT_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted CONFISCATE_SHARES", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("CONFISCATE_SHARES",CONFISCATE_SHARES, CONFISCATE_SHARES_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted CONFISCATE_SHARES_ADMIN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         
         testRoleGranted("CONFISCATE_SHARES_ADMIN",CONFISCATE_SHARES_ADMIN, CONFISCATE_SHARES_ADMIN, account, sender, authorizerClone, assetVaultClone);

    })

    test("handle role granted UNKNOWN", () => {
        const sender = Address.fromString("0x1234567890123456789012345678901234567890");
        const account = Address.fromString("0x1234567890123456789012345678901234567891");
        
         // Asset Vault Clone
         const assetVaultImplementation = Address.fromString(AMOY_VAULT_IMPLEMENTATION_ADDRESS);
         const assetVaultClone = Address.fromString("0x0000000000000000000000000000000000aaaaaa");
         let assetVaultCloneEvent = createNewCloneEvent(sender, assetVaultImplementation, assetVaultClone);
         handleNewClone(assetVaultCloneEvent);
 
         // Authorizer Clone
         const authorizerImplementation = Address.fromString(AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS);
         const authorizerClone = Address.fromString("0x0000000000000000000000000000000000bbbbbb");
         let authorizerCloneEvent = createNewCloneEvent(sender, authorizerImplementation, authorizerClone);
         handleNewClone(authorizerCloneEvent);
 
         // Set Authorizer
         const authorizerSetEvent1 = createSetAuthorizerEvent(sender, authorizerClone, assetVaultClone);
         handleAuthorizerSet(authorizerSetEvent1);
         const NO_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000001";

         testRoleGranted("UNKNOWN",NO_ROLE, NO_ROLE, account, sender, authorizerClone, assetVaultClone);
         testRoleGranted("UNKNOWN",NULL_ROLE, NULL_ROLE, account, sender, authorizerClone, assetVaultClone);

    })
})