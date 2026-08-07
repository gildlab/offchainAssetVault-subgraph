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
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  createCertifyEvent,
  createNewCloneEvent,
  createSetAuthorizerEvent,
  createDeploymentEvent,
  createMockReceiptFunction,
} from "./mock.test";
import { handleNewClone } from "../src/CloneFactory";
import { handleDeployment } from "../src/StoxUnifiedDeployer";
import { AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS } from "../src/networkImplementation";
import {
  handleAuthorizerSet,
  handleCertify,
} from "../src/OffchainAssetReceiptVault";
import { getAccount } from "../src/utils";

function certifyEntityId(txHash: string, logIndex: BigInt): string {
  return `Certify-${txHash}-${logIndex.toString()}`;
}

function hashEntityId(txHash: string, logIndex: BigInt, index: i32): string {
  return `${txHash}-${logIndex.toString()}-${index.toString()}`;
}

function setupVaultWithAuthorizer(
  certifier: Address,
  dataSourceAddress: string,
): Address {
  const assetVaultClone = Address.fromString(
    "0x0000000000000000000000000000000000aaaaaa",
  );
  const receipt = Address.fromString(
    "0x0000000000000000000000000000000000cccccc",
  );
  const wrapper = Address.fromString(
    "0x0000000000000000000000000000000000dddddd",
  );
  createMockReceiptFunction(assetVaultClone, receipt);
  let deploymentEvent = createDeploymentEvent(
    certifier,
    assetVaultClone,
    wrapper,
    Address.fromString(dataSourceAddress),
  );
  handleDeployment(deploymentEvent);

  const authorizerImplementation = Address.fromString(
    AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS,
  );
  const authorizerClone = Address.fromString(
    "0x0000000000000000000000000000000000bbbbbb",
  );
  let authorizerCloneEvent = createNewCloneEvent(
    certifier,
    authorizerImplementation,
    authorizerClone,
  );
  handleNewClone(authorizerCloneEvent);

  const authorizerSetEvent = createSetAuthorizerEvent(
    certifier,
    authorizerClone,
    assetVaultClone,
  );
  handleAuthorizerSet(authorizerSetEvent);

  return assetVaultClone;
}

describe("Certify Test", () => {
  const dataSourceAddress = "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A";
  beforeAll(() => {
    let context = new DataSourceContext();
    context.set("contextVal", Value.fromI32(325));
    dataSourceMock.setReturnValues(dataSourceAddress, "polygon-amoy", context);
  });

  afterEach(() => {
    clearStore();
    clearInBlockStore();
  });

  test("handle certify", () => {
    const certifier = Address.fromString(
      "0x1234567890123456789012345678901234567890",
    );
    const assetVaultClone = setupVaultWithAuthorizer(
      certifier,
      dataSourceAddress,
    );

    const certifyEvent = createCertifyEvent(
      certifier,
      BigInt.fromI32(1748024999),
      false,
      Bytes.fromHexString("0x1234567890"),
      assetVaultClone,
    );
    handleCertify(certifyEvent);

    const certifyId = certifyEntityId(
      certifyEvent.transaction.hash.toHex(),
      certifyEvent.logIndex,
    );

    assert.entityCount("Certify", 1);
    assert.entityCount("OffchainAssetReceiptVault", 1);
    assert.entityCount("Authorizer", 2);

    assert.fieldEquals("Certify", certifyId, "id", certifyId);
    assert.fieldEquals(
      "Certify",
      certifyId,
      "transaction",
      certifyEvent.transaction.hash.toHex(),
    );

    let emitterAccount = getAccount(
      certifier.toHexString(),
      assetVaultClone.toHexString(),
    ).id;

    assert.fieldEquals("Certify", certifyId, "emitter", emitterAccount);

    assert.fieldEquals(
      "Certify",
      certifyId,
      "timestamp",
      certifyEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      "Certify",
      certifyId,
      "offchainAssetReceiptVault",
      assetVaultClone.toHexString(),
    );

    assert.fieldEquals("Certify", certifyId, "certifier", emitterAccount);

    assert.fieldEquals(
      "Certify",
      certifyId,
      "certifiedUntil",
      certifyEvent.params.certifyUntil.toString(),
    );

    assert.fieldEquals(
      "Certify",
      certifyId,
      "data",
      certifyEvent.params.data.toString(),
    );

    assert.fieldEquals(
      "Certify",
      certifyId,
      "information",
      certifyEvent.params.data.toHex(),
    );
  });

  test("handle multiple certifies in a single transaction", () => {
    const certifier = Address.fromString(
      "0x1234567890123456789012345678901234567890",
    );
    const assetVaultClone = setupVaultWithAuthorizer(
      certifier,
      dataSourceAddress,
    );

    const certifyUntilFirst = BigInt.fromI32(1748024999);
    const certifyUntilSecond = BigInt.fromI32(1748025999);
    const firstCertifyEvent = createCertifyEvent(
      certifier,
      certifyUntilFirst,
      false,
      Bytes.fromHexString("0x1111111111"),
      assetVaultClone,
    );
    const secondCertifyEvent = createCertifyEvent(
      certifier,
      certifyUntilSecond,
      false,
      Bytes.fromHexString("0x2222222222"),
      assetVaultClone,
      BigInt.fromI32(2),
      firstCertifyEvent.transaction,
    );

    handleCertify(firstCertifyEvent);
    handleCertify(secondCertifyEvent);

    const firstCertifyId = certifyEntityId(
      firstCertifyEvent.transaction.hash.toHex(),
      firstCertifyEvent.logIndex,
    );
    const secondCertifyId = certifyEntityId(
      secondCertifyEvent.transaction.hash.toHex(),
      secondCertifyEvent.logIndex,
    );

    assert.entityCount("Certify", 2);

    assert.fieldEquals(
      "Certify",
      firstCertifyId,
      "certifiedUntil",
      certifyUntilFirst.toString(),
    );
    assert.fieldEquals(
      "Certify",
      secondCertifyId,
      "certifiedUntil",
      certifyUntilSecond.toString(),
    );
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHexString(),
      "certifiedUntil",
      certifyUntilSecond.toString(),
    );
  });

  test("handle hash certify", () => {
    const certifier = Address.fromString(
      "0x1234567890123456789012345678901234567890",
    );
    const assetVaultClone = setupVaultWithAuthorizer(
      certifier,
      dataSourceAddress,
    );

    const mockData =
      "ff0a89c674ee7874a5005894789c358c410e82301045af62ba96040a85c49d4b37aebc405ba63281a14d99a268bcbbd4c4ed7befffb788603120cc7cd504e224ce374f070b91d16de228ac4f7181bf634ff30e7bcd70599604fd0e652955513685ac73fe1ba2cd419655554929ebac90f43d9f18edc6086899e714940b2b1ab775089490571ac7aeb5cf693053045fe343c1aa9a573b281c0c89cf17f7193acb011bffc47a6299e8a91102706170706c69636174696f6e2f6a736f6e03676465666c6174651bffa8e8a9b9cf4a31783b6261666b7265696365636e783267766e746d3666626372766e63333336717a6536737435753771713734353769676567616d6433627a6b78377269a200783b6261666b7265696365636e783267766e746d3666626372766e63333336717a6536737435753771713734353769676567616d6433627a6b78377269011bff9fae3cc645f463";
    const certifyEvent = createCertifyEvent(
      certifier,
      BigInt.fromI32(1748024999),
      false,
      Bytes.fromHexString(mockData),
      assetVaultClone,
    );
    handleCertify(certifyEvent);

    const certifyId = certifyEntityId(
      certifyEvent.transaction.hash.toHex(),
      certifyEvent.logIndex,
    );
    const hashId = hashEntityId(
      certifyEvent.transaction.hash.toHex(),
      certifyEvent.logIndex,
      0,
    );

    assert.entityCount("Certify", 1);
    assert.entityCount("OffchainAssetReceiptVault", 1);
    assert.entityCount("Authorizer", 2);
    assert.entityCount("Hash", 1);

    assert.fieldEquals("Certify", certifyId, "id", certifyId);
    assert.fieldEquals(
      "Certify",
      certifyId,
      "data",
      certifyEvent.params.data.toString(),
    );
    assert.fieldEquals(
      "Certify",
      certifyId,
      "information",
      certifyEvent.params.data.toHex(),
    );
    assert.fieldEquals("Hash", hashId, "id", hashId);
    assert.fieldEquals(
      "OffchainAssetReceiptVault",
      assetVaultClone.toHexString(),
      "hashCount",
      "1",
    );
  });
});
