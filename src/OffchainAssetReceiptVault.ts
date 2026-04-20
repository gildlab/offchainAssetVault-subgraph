import {
  DataSourceContext,
  json,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
import {
  Certify,
  DepositWithReceipt,
  OffchainAssetReceiptVault,
  ConfiscateShares,
  ConfiscateReceipt,
  WithdrawWithReceipt,
  Hash,
  User,
  Deployer,
  ReceiptVaultInformation,
  TokenHolder,
  SharesTransfer,
  SharesBalance,
  Account,
  Authorizer,
} from "../generated/schema";
import { ReceiptTemplate } from "../generated/templates";
import {
  Certify as CertifyEvent,
  ConfiscateShares as ConfiscateSharesEvent,
  ConfiscateReceipt as ConfiscateReceiptEvent,
  Deposit,
  ReceiptVaultInformation as ReceiptVaultInformationEvent,
  Transfer,
  Withdraw,
  OffchainAssetReceiptVault as OffchainAssetVaultContract,
  OffchainAssetReceiptVaultInitializedV2,
  AuthorizerSet,
} from "../generated/templates/OffchainAssetReceiptVaultTemplate/OffchainAssetReceiptVault";
import {
  getAccount,
  getReceipt,
  getReceiptBalance,
  getTransaction,
  ONE,
  toDecimals,
  ZERO,
  stringToArrayBuffer,
  RAIN_META_DOCUMENT,
  BigintToHexString,
  ZERO_ADDRESS,
} from "./utils";
import { store, Entity, Value } from "@graphprotocol/graph-ts";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { CBORDecoder } from "@rainprotocol/assemblyscript-cbor";

export function handleAuthorizerSet(event: AuthorizerSet): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    if (offchainAssetReceiptVault.activeAuthorizer != null) {
      let previousAuthorizer = Authorizer.load(
        offchainAssetReceiptVault.activeAuthorizer as string,
      );
      if (
        previousAuthorizer &&
        previousAuthorizer.id != event.params.authorizer.toHex()
      ) {
        previousAuthorizer.isActive = false;
        previousAuthorizer.save();
      }
    }

    let authorizer = Authorizer.load(event.params.authorizer.toHex());
    if (authorizer) {
      authorizer.isActive = true;
      authorizer.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
      authorizer.save();

      // Set Active Authorizer
      offchainAssetReceiptVault.activeAuthorizer = authorizer.id;
      offchainAssetReceiptVault.save();
    }
  }
}

export function handleCertify(event: CertifyEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    let certify = new Certify(`Certify-${event.transaction.hash.toHex()}`);
    certify.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex(),
    ).id;
    certify.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    certify.timestamp = event.block.timestamp;
    certify.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    certify.certifier = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    certify.certifiedUntil = event.params.certifyUntil;
    certify.totalShares = offchainAssetReceiptVault.totalShares;
    certify.data = event.params.data.toString();
    certify.information = event.params.data;

    let meta = event.params.data.toHex();
    if (meta.includes(BigintToHexString(RAIN_META_DOCUMENT))) {
      let metaData = event.params.data.toHex().slice(18);
      let data = new CBORDecoder(stringToArrayBuffer(metaData));
      let jsonData = json.try_fromString(data.parse().stringify());
      if (jsonData.isOk && jsonData.value.kind == JSONValueKind.ARRAY) {
        let jsonDataArray = jsonData.value.toArray();
        if (
          jsonDataArray.length >= 2 &&
          jsonDataArray[0].kind == JSONValueKind.OBJECT &&
          jsonDataArray[1].kind == JSONValueKind.OBJECT
        ) {
          let hashEntry = jsonDataArray[1].toObject();

          certify.save();
          // HashList
          let hashListValue = hashEntry.get("0");
          if (hashListValue) {
            let hashListArray = hashListValue.toString().split(",");
            if (hashListArray.length) {
              for (let i = 0; i < hashListArray.length; i++) {
                if (offchainAssetReceiptVault) {
                  let hash = new Hash(
                    event.transaction.hash.toHex().toString() +
                      "-" +
                      i.toString(),
                  );
                  hash.owner = event.params.sender.toString();
                  hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
                  hash.offchainAssetReceiptVaultDeployer =
                    offchainAssetReceiptVault.deployer.toHex();
                  hash.hash = hashListArray[i];
                  hash.timestamp = event.block.timestamp;
                  hash.save();
                  offchainAssetReceiptVault.hashCount =
                    offchainAssetReceiptVault.hashCount.plus(ONE);
                  offchainAssetReceiptVault.save();
                }
              }
            }
          }
        }
      }
    }

    certify.save();
    if (
      event.params.forceUntil ||
      event.params.certifyUntil > offchainAssetReceiptVault.certifiedUntil
    ) {
      offchainAssetReceiptVault.certifiedUntil = event.params.certifyUntil;
    }
    offchainAssetReceiptVault.save();
  }
}

export function handleConfiscateReceipt(event: ConfiscateReceiptEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    let confiscateReceipts = new ConfiscateReceipt(
      `ConfiscateReceipt-${event.transaction.hash.toHex()}`,
    );
    confiscateReceipts.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex(),
    ).id;
    confiscateReceipts.timestamp = event.block.timestamp;
    confiscateReceipts.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    confiscateReceipts.confiscatee = getAccount(
      event.params.confiscatee.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    confiscateReceipts.confiscator = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;

    let receipt = getReceipt(
      offchainAssetReceiptVault.id.toString(),
      event.params.id,
    );

    if (receipt) {
      confiscateReceipts.receipt = receipt.id;
    }

    confiscateReceipts.confiscated = event.params.confiscated;
    confiscateReceipts.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    confiscateReceipts.data = event.params.justification.toString();
    confiscateReceipts.save();
  }
}

export function handleConfiscateShares(event: ConfiscateSharesEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    let confiscateShares = new ConfiscateShares(
      `ConfiscateShares-${event.transaction.hash.toHex()}`,
    );
    confiscateShares.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex(),
    ).id;
    confiscateShares.timestamp = event.block.timestamp;
    confiscateShares.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    confiscateShares.confiscatee = getAccount(
      event.params.confiscatee.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    confiscateShares.confiscator = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    confiscateShares.confiscated = event.params.confiscated;
    confiscateShares.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    confiscateShares.data = event.params.justification.toString();
    confiscateShares.save();
  }
}

export function handleDeposit(event: Deposit): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    let depositWithReceipt = new DepositWithReceipt(
      `DepositWithReceipt-${event.transaction.hash.toHex()}-${event.params.id.toString()}`,
    );
    depositWithReceipt.timestamp = event.block.timestamp;
    depositWithReceipt.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex(),
    ).id;
    depositWithReceipt.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    depositWithReceipt.receiver = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    depositWithReceipt.caller = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    depositWithReceipt.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    depositWithReceipt.amount = event.params.shares;
    depositWithReceipt.data = event.params.receiptInformation.toString();
    depositWithReceipt.erc1155TokenId = event.params.id.toString();

    let receipt = getReceipt(
      offchainAssetReceiptVault.id.toString(),
      event.params.id,
    );
    let receiptBalance = getReceiptBalance(
      event.address.toHex(),
      event.params.id,
    );
    let contract = OffchainAssetVaultContract.bind(event.address);
    receiptBalance.valueExact = receiptBalance.valueExact.plus(
      event.params.shares,
    );
    receiptBalance.value = toDecimals(
      receiptBalance.valueExact,
      contract.decimals(),
    );
    receiptBalance.account = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    receiptBalance.confiscated = ZERO;

    if (receipt) {
      receipt.shares = receipt.shares.plus(event.params.shares);
      receipt.save();

      receiptBalance.receipt = receipt.id;
      depositWithReceipt.receipt = receipt.id;
    }
    receiptBalance.save();
    depositWithReceipt.save();

    let account = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id,
    );
    if (account) {
      account.hashCount = account.hashCount.plus(ONE);
      account.save();
    }
    let user = User.load(event.params.owner.toHex());
    if (user) {
      user.hashCount = user.hashCount.plus(ONE);
      user.save();
    }
    let deployer = Deployer.load(offchainAssetReceiptVault.deployer.toHex());
    if (deployer) {
      deployer.hashCount = deployer.hashCount.plus(ONE);
      deployer.save();
    }
  }
}

export function handleOffchainAssetVaultInitializedV2(
  event: OffchainAssetReceiptVaultInitializedV2,
): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    offchainAssetReceiptVault.admin = event.params.config.initialAdmin;
    let receiptVaultConfig = event.params.config.receiptVaultConfig;
    // String fields from nested tuples may need explicit conversion
    // The generated types should expose these as strings, but if they're ethereum.Value,
    // we need to ensure proper conversion
    offchainAssetReceiptVault.name = receiptVaultConfig.name as string;
    offchainAssetReceiptVault.symbol = receiptVaultConfig.symbol as string;
    offchainAssetReceiptVault.receiptContractAddress =
      receiptVaultConfig.receipt;
    offchainAssetReceiptVault.asAccount = getAccount(
      event.address.toHex(),
      event.address.toHex(),
    ).id;
    offchainAssetReceiptVault.save();
  }
  let context = new DataSourceContext();
  context.setString("vault", event.address.toHex());
  ReceiptTemplate.createWithContext(
    event.params.config.receiptVaultConfig.receipt,
    context,
  );
}

export function handleReceiptVaultInformation(
  event: ReceiptVaultInformationEvent,
): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );

  let meta = event.params.vaultInformation.toHex();
  if (meta.includes(BigintToHexString(RAIN_META_DOCUMENT))) {
    let metaData = event.params.vaultInformation.toHex().slice(18);
    let data = new CBORDecoder(stringToArrayBuffer(metaData));
    let jsonData = json.try_fromString(data.parse().stringify());
    if (jsonData.isOk && jsonData.value.kind == JSONValueKind.ARRAY) {
      let jsonDataArray = jsonData.value.toArray();
      if (
        jsonDataArray.length >= 2 &&
        jsonDataArray[0].kind == JSONValueKind.OBJECT &&
        jsonDataArray[1].kind == JSONValueKind.OBJECT
      ) {
        let primaryInformation = jsonDataArray[0].toObject();
        let hashEntry = jsonDataArray[1].toObject();
        let receiptVaultInformation = new ReceiptVaultInformation(
          event.transaction.hash.toHex(),
        );

        receiptVaultInformation.transaction = getTransaction(
          event.block,
          event.transaction.hash.toHex(),
        ).id;
        receiptVaultInformation.timestamp = event.block.timestamp;
        receiptVaultInformation.offchainAssetReceiptVault =
          event.address.toHex();
        receiptVaultInformation.information = event.params.vaultInformation;
        receiptVaultInformation.caller = getAccount(
          event.params.sender.toHex(),
          event.address.toHex(),
        ).id;
        receiptVaultInformation.emitter = getAccount(
          event.params.sender.toHex(),
          event.address.toHex(),
        ).id;
        let payload = primaryInformation.get("0");
        if (payload) receiptVaultInformation.payload = payload.toString();
        let magicNumber = primaryInformation.get("1");
        if (magicNumber)
          receiptVaultInformation.magicNumber = magicNumber.toBigInt();
        let contentType = primaryInformation.get("2");
        if (contentType)
          receiptVaultInformation.contentType = contentType.toString();
        let contentEncoding = primaryInformation.get("3");
        if (contentEncoding)
          receiptVaultInformation.contentEncoding = contentEncoding.toString();
        receiptVaultInformation.save();

        //HashList
        let hashListValue = hashEntry.get("0");
        if (hashListValue) {
          let hashListArray = hashListValue.toString().split(",");
          if (hashListArray.length) {
            for (let i = 0; i < hashListArray.length; i++) {
              if (offchainAssetReceiptVault) {
                let hash = new Hash(
                  event.transaction.hash.toHex().toString() +
                    "-" +
                    i.toString(),
                );
                hash.owner = receiptVaultInformation.caller;
                hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
                hash.offchainAssetReceiptVaultDeployer =
                  offchainAssetReceiptVault.deployer.toHex();
                hash.hash = hashListArray[i];
                hash.timestamp = event.block.timestamp;
                hash.save();
                offchainAssetReceiptVault.hashCount =
                  offchainAssetReceiptVault.hashCount.plus(ONE);
                offchainAssetReceiptVault.save();
              }
            }
          }
        }
      }
    }
  }
}

function holderId(vaultAddr: Address, user: Address): string {
  return vaultAddr.toHex() + " - " + user.toHex();
}

function sharesBalanceId(vaultId: string, accountId: string): string {
  return vaultId + "-" + accountId;
}

function upsertTokenHolder(
  vault: OffchainAssetReceiptVault,
  vaultAddr: Address,
  vaultContract: OffchainAssetVaultContract,
  user: Address,
): BigInt {
  const id = holderId(vaultAddr, user);
  let th = TokenHolder.load(id);
  if (th == null) {
    th = new TokenHolder(id);
    th.offchainAssetReceiptVault = vault.id;
    th.address = user;
    th.balance = ZERO;
  }
  const bal = vaultContract.balanceOf(user);
  th.balance = bal;
  th.save();
  return bal;
}

function upsertSharesBalance(
  vault: OffchainAssetReceiptVault,
  accountId: string,
  exact: BigInt,
): string {
  const id = sharesBalanceId(vault.id, accountId);
  let sb = SharesBalance.load(id);
  if (sb == null) {
    sb = new SharesBalance(id);
    sb.offchainAssetReceiptVault = vault.id;
    sb.account = accountId;
    sb.confiscated = ZERO;
    sb.valueExact = ZERO;
    sb.value = toDecimals(ZERO, 18); // change if share decimals differ
  }
  sb.valueExact = exact;
  sb.value = toDecimals(exact, 18);
  sb.save();
  return sb.id;
}

function getZeroAccountId(vaultId: string): string {
  return getAccount(ZERO_ADDRESS, vaultId).id;
}

export function handleTransfer(event: Transfer): void {
  const vault = OffchainAssetReceiptVault.load(event.address.toHex());
  if (vault == null) return;

  const vaultContract = OffchainAssetVaultContract.bind(event.address);

  vault.totalShares = vaultContract.totalSupply();

  const from = event.params.from;
  const to = event.params.to;

  const isMint = from.toHex() == ZERO_ADDRESS;
  const isBurn = to.toHex() == ZERO_ADDRESS;

  const zeroAccountId = getZeroAccountId(vault.id);

  const fromAccountId = isMint
    ? zeroAccountId
    : getAccount(from.toHex(), vault.id).id;

  const toAccountId = isBurn
    ? zeroAccountId
    : getAccount(to.toHex(), vault.id).id;

  // Update balances for real addresses only
  let fromBalExact = ZERO;
  let toBalExact = ZERO;

  if (!isMint) {
    fromBalExact = upsertTokenHolder(vault, event.address, vaultContract, from);
    upsertSharesBalance(vault, fromAccountId, fromBalExact);
  }

  if (!isBurn) {
    toBalExact = upsertTokenHolder(vault, event.address, vaultContract, to);
    upsertSharesBalance(vault, toAccountId, toBalExact);
  }

  const st = new SharesTransfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
  );

  st.offchainAssetReceiptVault = vault.id;
  st.transaction = getTransaction(
    event.block,
    event.transaction.hash.toHex(),
  ).id;
  st.timestamp = event.block.timestamp;

  // ALWAYS set from/to (zero account when mint/burn)
  st.from = fromAccountId;
  st.to = toAccountId;

  // emitter: mint => to, else from
  st.emitter = isMint ? toAccountId : fromAccountId;

  // Balances: only attach when non-zero side exists
  if (!isMint) st.fromBalance = sharesBalanceId(vault.id, fromAccountId);
  if (!isBurn) st.toBalance = sharesBalanceId(vault.id, toAccountId);

  st.valueExact = event.params.value;
  st.value = toDecimals(event.params.value, 18);

  st.save();
  vault.save();
}

export function handleWithdraw(event: Withdraw): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex(),
  );
  if (offchainAssetReceiptVault) {
    let withdrawWithReceipt = new WithdrawWithReceipt(
      `WithdrawWithReceipt-${event.transaction.hash.toHex()}-${event.params.id.toString()}`,
    );
    withdrawWithReceipt.amount = event.params.shares;
    withdrawWithReceipt.caller = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    withdrawWithReceipt.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    withdrawWithReceipt.owner = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    withdrawWithReceipt.offchainAssetReceiptVault =
      offchainAssetReceiptVault.id;
    withdrawWithReceipt.timestamp = event.block.timestamp;
    withdrawWithReceipt.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex(),
    ).id;
    withdrawWithReceipt.data = event.params.receiptInformation.toString();
    withdrawWithReceipt.erc1155TokenId = event.params.id.toString();

    let receiptBalance = getReceiptBalance(
      event.address.toHex(),
      event.params.id,
    );
    let contract = OffchainAssetVaultContract.bind(event.address);
    receiptBalance.valueExact = receiptBalance.valueExact.minus(
      event.params.shares,
    );
    receiptBalance.value = toDecimals(
      receiptBalance.valueExact,
      contract.decimals(),
    );
    receiptBalance.account = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id,
    ).id;
    receiptBalance.confiscated = ZERO;
    receiptBalance.save();

    let receipt = getReceipt(offchainAssetReceiptVault.id, event.params.id);
    if (receipt) {
      receipt.shares = receipt.shares.minus(event.params.shares);
      receipt.save();
      withdrawWithReceipt.receipt = receipt.id;
    }

    withdrawWithReceipt.save();
  }
}
