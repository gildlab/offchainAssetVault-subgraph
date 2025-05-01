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
import { createNewCloneEvent, createRoleAdminChangedEvent, createRoleGrantedEvent, createRoleRevokedEvent, createSetAuthorizerEvent } from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS, AMOY_VAULT_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import { handleRoleAdminChanged, handleRoleGranted, handleRoleRevoked } from "../src/OffchainAssetReceiptVaultAuthorizerV1";
import { CERTIFY, CERTIFY_ADMIN, CONFISCATE_RECEIPT, CONFISCATE_RECEIPT_ADMIN, CONFISCATE_SHARES, CONFISCATE_SHARES_ADMIN, DEPOSIT, DEPOSIT_ADMIN, NULL_ROLE, WITHDRAW, WITHDRAW_ADMIN } from "../src/roles";
import { handleAuthorizerSet } from "../src/OffchainAssetReceiptVault";
import { getAccount } from "../src/utils";

function testRoleRevoked(roleName: string, role: string, roleAdmin: string, account: Address, sender: Address, authorizerClone: Address, assetVaultClone: Address): void {

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

    // after here
    const roleRevokedEvent = createRoleRevokedEvent(
        Bytes.fromHexString(role),
        account,
        sender,
        authorizerClone
    );
    handleRoleRevoked(roleRevokedEvent);
    assert.entityCount("RoleRevoked", 1);

    const roleRevokedId = `${roleRevokedEvent.transaction.hash.toHex()}-${roleName}`;   
    const roleId = `${authorizerClone.toHex()}-${role}`;
    const roleHolderId = `${authorizerClone.toHex()}-${account.toHex()}-${role}`;

    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "id",
        roleRevokedId
    );
    const accountEntity = getAccount(account.toHex(), assetVaultClone.toHex());
    const emitterEntity = getAccount(sender.toHex(), assetVaultClone.toHex());
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "account",
        accountEntity.id
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "emitter",
        emitterEntity.id
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "sender",
        emitterEntity.id
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "authorizer",
        authorizerClone.toHex()
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "role",
        roleId
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "transaction",
        roleRevokedEvent.transaction.hash.toHex()
    );
    assert.fieldEquals(
        "RoleRevoked",
        roleRevokedId,
        "timestamp",
        roleRevokedEvent.block.timestamp.toString()
    );
    assert.notInStore("RoleHolder", roleHolderId);

}
describe("handleRoleRevoked", () => {

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

    test("handle role revoked CERTIFY", () => {
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

         testRoleRevoked("CERTIFY",CERTIFY, CERTIFY_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked CERTIFY_ADMIN", () => {
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

         testRoleRevoked("CERTIFY_ADMIN",CERTIFY_ADMIN, CERTIFY_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked DEPOSIT", () => {
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

         testRoleRevoked("DEPOSIT",DEPOSIT, DEPOSIT_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked DEPOSIT_ADMIN", () => {
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

         testRoleRevoked("DEPOSIT_ADMIN",DEPOSIT_ADMIN, DEPOSIT_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked WITHDRAW", () => {
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

         testRoleRevoked("WITHDRAW",WITHDRAW, WITHDRAW_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked WITHDRAW_ADMIN", () => {
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

         testRoleRevoked("WITHDRAW_ADMIN",WITHDRAW_ADMIN, WITHDRAW_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked CONFISCATE_RECEIPT", () => {
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

         testRoleRevoked("CONFISCATE_RECEIPT",CONFISCATE_RECEIPT, CONFISCATE_RECEIPT_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked CONFISCATE_RECEIPT_ADMIN", () => {
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

         testRoleRevoked("CONFISCATE_RECEIPT_ADMIN",CONFISCATE_RECEIPT_ADMIN, CONFISCATE_RECEIPT_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked CONFISCATE_SHARES", () => {
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

         testRoleRevoked("CONFISCATE_SHARES",CONFISCATE_SHARES, CONFISCATE_SHARES_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked CONFISCATE_SHARES_ADMIN", () => {
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

         testRoleRevoked("CONFISCATE_SHARES_ADMIN",CONFISCATE_SHARES_ADMIN, CONFISCATE_SHARES_ADMIN, account, sender, authorizerClone, assetVaultClone);
        
    })

    test("handle role revoked UNKNOWN", () => {
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

         testRoleRevoked("UNKNOWN",NO_ROLE, NO_ROLE, account, sender, authorizerClone, assetVaultClone);
         testRoleRevoked("UNKNOWN",NULL_ROLE, NULL_ROLE, account, sender, authorizerClone, assetVaultClone);
        
    })

})