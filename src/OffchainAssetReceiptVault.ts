import { DataSourceContext, json } from "@graphprotocol/graph-ts";
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
  TokenHolder, SharesTransfer,
  Authorizer
} from "../generated/schema";
import { ReceiptTemplate, OffchainAssetReceiptVaultAuthorizerV1Template } from "../generated/templates";
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
  AuthorizerSet
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
  ZERO_ADDRESS
} from "./utils";
import { store, Entity, Value } from '@graphprotocol/graph-ts'
import { CBORDecoder } from "@rainprotocol/assemblyscript-cbor";

export function handleAuthorizerSet(event: AuthorizerSet): void {
  
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if (offchainAssetReceiptVault) {
    // First, deactivate the previous authorizer if one exists
    if (offchainAssetReceiptVault.activeAuthorizer != null) {
      let previousAuthorizerId = offchainAssetReceiptVault.activeAuthorizer as string;
      let previousAuthorizer = Authorizer.load(previousAuthorizerId);
      if (previousAuthorizer && previousAuthorizer.id != event.params.authorizer.toHex()) {
        previousAuthorizer.isActive = false;
        previousAuthorizer.save();
      }
    }
    
    // Create or update the new authorizer
    let authorizer = Authorizer.load(event.params.authorizer.toHex());
    if (!authorizer) {
      authorizer = new Authorizer(event.params.authorizer.toHex());
      authorizer.address = event.params.authorizer;
      OffchainAssetReceiptVaultAuthorizerV1Template.create(event.params.authorizer);
    }
    
    // Always set the new authorizer as active
    authorizer.isActive = true;
    
    // Update the authorizer with the vault reference
    authorizer.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    authorizer.save();
    
    // Set the active authorizer directly on the vault using store.set to bypass type checking
    let entity = new Entity();
    entity.set('id', Value.fromString(offchainAssetReceiptVault.id));
    entity.set('activeAuthorizer', Value.fromString(authorizer.id));
    store.set('OffchainAssetReceiptVault', offchainAssetReceiptVault.id, entity);
  }
}

export function handleCertify(event: CertifyEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    let certify = new Certify(`Certify-${ event.transaction.hash.toHex() }`);
    certify.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    certify.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    certify.timestamp = event.block.timestamp;
    certify.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    certify.certifier = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    certify.certifiedUntil = event.params.certifyUntil;
    certify.totalShares = offchainAssetReceiptVault.totalShares;
    certify.data = event.params.data.toString();
    certify.information = event.params.data;

    let meta = event.params.data.toHex();
    if ( meta.includes(BigintToHexString(RAIN_META_DOCUMENT)) ) {

      let metaData = event.params.data.toHex().slice(18);
      let data = new CBORDecoder(stringToArrayBuffer(metaData));
      let jsonData = json.try_fromString(data.parse().stringify());
      if ( jsonData.isOk ) {
        let jsonDataArray = jsonData.value.toArray();
        if ( jsonDataArray.length ) {


          certify.save();
          // HashList
          let hashList = jsonDataArray[ 1 ].toObject().mustGet("0").toString();
          let hashListArray = hashList.split(",");
          if ( hashListArray.length ) {
            for ( let i = 0; i < hashListArray.length; i++ ) {
              if ( offchainAssetReceiptVault ) {
                let hash = new Hash(event.transaction.hash.toHex().toString() + "-" + i.toString());
                hash.owner = event.params.sender.toString();
                hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
                hash.offchainAssetReceiptVaultDeployer = offchainAssetReceiptVault.deployer.toHex();
                hash.hash = hashListArray[ i ];
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

    certify.save();
    if ( event.params.forceUntil || event.params.certifyUntil > offchainAssetReceiptVault.certifiedUntil ) {
      offchainAssetReceiptVault.certifiedUntil = event.params.certifyUntil;
    }
    offchainAssetReceiptVault.save();
  }
}

export function handleConfiscateReceipt(event: ConfiscateReceiptEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    let confiscateReceipts = new ConfiscateReceipt(
      `ConfiscateReceipt-${ event.transaction.hash.toHex() }`
    );
    confiscateReceipts.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    confiscateReceipts.timestamp = event.block.timestamp;
    confiscateReceipts.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    confiscateReceipts.confiscatee = getAccount(
      event.params.confiscatee.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    confiscateReceipts.confiscator = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;

    let receipt = getReceipt(
      offchainAssetReceiptVault.id.toString(),
      event.params.id
    );

    if ( receipt ) {
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
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    let confiscateShares = new ConfiscateShares(
      `ConfiscateShares-${ event.transaction.hash.toHex() }`
    );
    confiscateShares.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    confiscateShares.timestamp = event.block.timestamp;
    confiscateShares.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    confiscateShares.confiscatee = getAccount(
      event.params.confiscatee.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    confiscateShares.confiscator = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    confiscateShares.confiscated = event.params.confiscated;
    confiscateShares.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    confiscateShares.data = event.params.justification.toString();
    confiscateShares.save();
  }
}

export function handleDeposit(event: Deposit): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    let depositWithReceipt = new DepositWithReceipt(
      `DepositWithReceipt-${ event.transaction.hash.toHex() }-${ event.params.id.toString() }`
    );
    depositWithReceipt.timestamp = event.block.timestamp;
    depositWithReceipt.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    depositWithReceipt.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    depositWithReceipt.receiver = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    depositWithReceipt.caller = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    depositWithReceipt.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    depositWithReceipt.amount = event.params.shares;
    depositWithReceipt.data = event.params.receiptInformation.toString();
    depositWithReceipt.erc1155TokenId = event.params.id.toString();

    let receipt = getReceipt(
      offchainAssetReceiptVault.id.toString(),
      event.params.id
    );
    let receiptBalance = getReceiptBalance(
      event.address.toHex(),
      event.params.id
    );
    let contract = OffchainAssetVaultContract.bind(event.address);
    receiptBalance.valueExact = receiptBalance.valueExact.plus(
      event.params.shares
    );
    receiptBalance.value = toDecimals(
      receiptBalance.valueExact,
      contract.decimals()
    );
    receiptBalance.account = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    receiptBalance.confiscated = ZERO;

    if ( receipt ) {
      receipt.shares = receipt.shares.plus(event.params.shares);
      receipt.save();

      receiptBalance.receipt = receipt.id;
      depositWithReceipt.receipt = receipt.id;
    }
    receiptBalance.save();
    depositWithReceipt.save();

    let account = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id
    );
    if ( account ) {
      account.hashCount = account.hashCount.plus(ONE);
      account.save();
    }
    let user = User.load(event.params.owner.toHex());
    if ( user ) {
      user.hashCount = user.hashCount.plus(ONE);
      user.save();
    }
    let deployer = Deployer.load(offchainAssetReceiptVault.deployer.toHex());
    if ( deployer ) {
      deployer.hashCount = deployer.hashCount.plus(ONE);
      deployer.save();
    }
  }
}

export function handleOffchainAssetVaultInitializedV2(
  event: OffchainAssetReceiptVaultInitializedV2
): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    offchainAssetReceiptVault.admin = event.params.config.initialAdmin;
    offchainAssetReceiptVault.name =
      event.params.config.receiptVaultConfig.vaultConfig.name;
    offchainAssetReceiptVault.symbol =
      event.params.config.receiptVaultConfig.vaultConfig.symbol;
    offchainAssetReceiptVault.receiptContractAddress =
      event.params.config.receiptVaultConfig.receipt;
    offchainAssetReceiptVault.asAccount = getAccount(
      event.address.toHex(),
      event.address.toHex()
    ).id;
    offchainAssetReceiptVault.save();
  }
  let context = new DataSourceContext();
  context.setString("vault", event.address.toHex());
  ReceiptTemplate.createWithContext(
    event.params.config.receiptVaultConfig.receipt,
    context
  );
}

export function handleReceiptVaultInformation(
  event: ReceiptVaultInformationEvent
): void {

  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );


  let meta = event.params.vaultInformation.toHex();
  if ( meta.includes(BigintToHexString(RAIN_META_DOCUMENT)) ) {

    let metaData = event.params.vaultInformation.toHex().slice(18);
    let data = new CBORDecoder(stringToArrayBuffer(metaData));
    let jsonData = json.try_fromString(data.parse().stringify());
    if ( jsonData.isOk ) {
      let jsonDataArray = jsonData.value.toArray();
      if ( jsonDataArray.length ) {
        let receiptVaultInformation = new ReceiptVaultInformation(event.transaction.hash.toHex());

        receiptVaultInformation.transaction = getTransaction(
          event.block,
          event.transaction.hash.toHex()
        ).id;
        receiptVaultInformation.timestamp = event.block.timestamp;
        receiptVaultInformation.offchainAssetReceiptVault = event.address.toHex();
        receiptVaultInformation.information = event.params.vaultInformation;
        receiptVaultInformation.caller = getAccount(
          event.params.sender.toHex(),
          event.address.toHex()
        ).id;
        receiptVaultInformation.emitter = getAccount(
          event.params.sender.toHex(),
          event.address.toHex()
        ).id;
        receiptVaultInformation.payload = jsonDataArray[ 0 ].toObject().mustGet("0").toString();
        receiptVaultInformation.magicNumber = jsonDataArray[ 0 ].toObject().mustGet("1").toBigInt();
        receiptVaultInformation.contentType = jsonDataArray[ 0 ].toObject().mustGet("2").toString();
        receiptVaultInformation.contentEncoding = jsonDataArray[ 0 ].toObject().mustGet("3").toString();
        receiptVaultInformation.save();

        //HashList
        let hashList = jsonDataArray[ 1 ].toObject().mustGet("0").toString();
        let hashListArray = hashList.split(",");
        if ( hashListArray.length ) {
          for ( let i = 0; i < hashListArray.length; i++ ) {
            if ( offchainAssetReceiptVault ) {
              let hash = new Hash(event.transaction.hash.toHex().toString() + "-" + i.toString());
              hash.owner = receiptVaultInformation.caller;
              hash.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
              hash.offchainAssetReceiptVaultDeployer = offchainAssetReceiptVault.deployer.toHex();
              hash.hash = hashListArray[ i ];
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

// export function handleRoleAdminChanged(event: RoleAdminChanged): void {
//   let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
//     event.address.toHex()
//   );
//   let role = new Role(event.address.toHex() + "-" + event.params.role.toHex());
//   if ( offchainAssetReceiptVault ) {
//     if ( event.params.role.toHex() == DEPOSIT_ADMIN ) {
//       role.roleName = "DEPOSIT_ADMIN";
//     } else if ( event.params.role.toHex() == WITHDRAW_ADMIN ) {
//       role.roleName = "WITHDRAW_ADMIN";
//     } else if ( event.params.role.toHex() == CERTIFY_ADMIN ) {
//       role.roleName = "CERTIFY_ADMIN";
//     } else if ( event.params.role.toHex() == CONFISCATE_SHARES_ADMIN ) {
//       role.roleName = "CONFISCATE_SHARES_ADMIN";
//     } else if ( event.params.role.toHex() == CONFISCATE_RECEIPT_ADMIN ) {
//       role.roleName = "CONFISCATE_RECEIPT_ADMIN";
//     } else {
//       role.roleName = "UNKNOWN";
//     }
//     role.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
//     role.roleHash = event.params.role;
//     role.save();
//   }
// }

// export function handleRoleGranted(event: RoleGrantedEvent): void {
//   let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
//     event.address.toHex()
//   );
//   let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

//   if ( offchainAssetReceiptVault && role ) {
//     let roleGranted = new RoleGranted(event.transaction.hash.toHex()+ "-" + role.roleName );
//     roleGranted.account = getAccount(
//       event.params.account.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleGranted.emitter = getAccount(
//       event.params.sender.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleGranted.sender = getAccount(
//       event.params.sender.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleGranted.transaction = getTransaction(
//       event.block,
//       event.transaction.hash.toHex()
//     ).id;
//     roleGranted.timestamp = event.block.timestamp;
//     roleGranted.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
//     roleGranted.role = role.id;
//     let roleHolder = getRoleHolder(
//       event.address.toHex(),
//       event.params.account.toHex(),
//       event.params.role.toHex()
//     );
//     if ( roleHolder ) {
//       roleGranted.roleHolder = roleHolder.id;

//       let activeRoles = roleHolder.activeRoles;
//       if ( activeRoles ) activeRoles.push(role.id);
//       roleHolder.activeRoles = activeRoles;
//       roleHolder.save();
//     }
//     roleGranted.save();

//     role.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
//     role.roleHash = event.params.role;
//     role.save();
//   }
// }

// export function handleRoleRevoked(event: RoleRevokedEvent): void {
//   let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
//     event.address.toHex()
//   );
//   let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

//   if ( offchainAssetReceiptVault && role ) {
//     let roleRevoked = new RoleRevoked(event.transaction.hash.toHex());
//     roleRevoked.account = getAccount(
//       event.params.account.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleRevoked.emitter = getAccount(
//       event.params.sender.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleRevoked.sender = getAccount(
//       event.params.sender.toHex(),
//       offchainAssetReceiptVault.id
//     ).id;
//     roleRevoked.transaction = getTransaction(
//       event.block,
//       event.transaction.hash.toHex()
//     ).id;
//     roleRevoked.timestamp = event.block.timestamp;
//     roleRevoked.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
//     roleRevoked.role = role.id;
//     let roleHolder = getRoleHolder(
//       event.address.toHex(),
//       event.params.account.toHex(),
//       event.params.role.toHex()
//     );
//     if ( roleHolder ) {
//       roleRevoked.roleHolder = roleHolder.id;
//       store.remove("RoleHolder", roleHolder.id);
//     }
//     roleRevoked.save();
//   }
// }

// export function handleSetERC1155Tier(event: SetERC1155Tier): void {
// }

// export function handleSetERC20Tier(event: SetERC20Tier): void {
// }

// export function handleSnapshot(event: Snapshot): void {
// }

export function handleTransfer(event: Transfer): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  let offchainAssetVaultContract = OffchainAssetVaultContract.bind(
    event.address
  );


  if ( offchainAssetReceiptVault ) {
    offchainAssetReceiptVault.totalShares =
      offchainAssetVaultContract.totalSupply();

    let from = event.params.from;
    let to = event.params.to;
    let holders = offchainAssetReceiptVault.tokenHolders;

    // Check if Sender is Zero address. Does not take as holder when contract mint
    if ( from.toHex() != ZERO_ADDRESS ) {
      // Load the Sender's Holder entity
      let sender = TokenHolder.load(
        event.address.toHex() + " - " + from.toHex()
      );

      // Create a new Holders entity if Sender doesnot exists
      if ( !sender ) {
        sender = new TokenHolder(
          event.address.toHex() + " - " + from.toHex()
        );
        // Set the Sender's balance
        sender.offchainAssetReceiptVault = offchainAssetReceiptVault.id;

        sender.balance = ZERO;
      }

      // Update the sender's balance
      // Set the sender's balance
      sender.balance = offchainAssetVaultContract.balanceOf(from);
      sender.address = from;
      sender.save();

      // Add the sender in Holders if not already exists
      if ( holders ) {
        let specificHolder = TokenHolder.load(sender.id);
        if ( !specificHolder ) {
          let newHolder = new TokenHolder(sender.id);
          newHolder.address = sender.address
          newHolder.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
          newHolder.balance = ZERO
          newHolder.save();

        }

      }
      if ( to.toHex() != ZERO_ADDRESS ) {
        //add sharestransfer
        let sharesTransfer = new SharesTransfer(event.transaction.hash.toHex());

        sharesTransfer.emitter = getAccount(
          event.params.from.toHex(),
          offchainAssetReceiptVault.id
        ).id;

        sharesTransfer.from = getAccount(
          event.params.from.toHex(),
          offchainAssetReceiptVault.id
        ).id;
        sharesTransfer.fromBalance = offchainAssetVaultContract.balanceOf(from).toString();

        sharesTransfer.to = getAccount(
          event.params.to.toHex(),
          offchainAssetReceiptVault.id
        ).id;

        sharesTransfer.toBalance = offchainAssetVaultContract.balanceOf(to).toString();

        sharesTransfer.valueExact = event.params.value;
        sharesTransfer.value = toDecimals(
          event.params.value,
          18
        );

        sharesTransfer.transaction = getTransaction(
          event.block,
          event.transaction.hash.toHex()
        ).id;
        sharesTransfer.timestamp = event.block.timestamp;
        sharesTransfer.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
        sharesTransfer.save();
      }

    }
    if ( to.toHex() != ZERO_ADDRESS ) {
      // Load the Receiver's Holder entity
      let receiver = TokenHolder.load(
        event.address.toHex() + " - " + to.toHex()
      );

      // Create a new Holders entity if Receiver doesnot exists
      if ( !receiver ) {
        receiver = new TokenHolder(
          event.address.toHex() + " - " + to.toHex()
        );
        // Set the Reciver's balance
        receiver.balance = ZERO;
      }

      // Update the Receiver balance
      // Set the Receiver's balance
      receiver.balance = offchainAssetVaultContract.balanceOf(to);
      receiver.address = to;
      receiver.offchainAssetReceiptVault = offchainAssetReceiptVault.id;

      receiver.save();

      // Add the Receiver in Holders if not already exists

      if ( holders ) {
        let specificHolder = TokenHolder.load(receiver.id);
        if ( !specificHolder ) {
          let newHolder = new TokenHolder(receiver.id);
          newHolder.address = receiver.address
          newHolder.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
          newHolder.balance = ZERO
          newHolder.save();
        }

      }
    }


    offchainAssetReceiptVault.save();
  }
}

export function handleWithdraw(
  event: Withdraw
): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    let withdrawWithReceipt = new WithdrawWithReceipt(
      `WithdrawWithReceipt-${ event.transaction.hash.toHex() }-${ event.params.id.toString() }`
    );
    withdrawWithReceipt.amount = event.params.shares;
    withdrawWithReceipt.caller = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    withdrawWithReceipt.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    withdrawWithReceipt.owner = getAccount(
      event.params.owner.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    withdrawWithReceipt.offchainAssetReceiptVault =
      offchainAssetReceiptVault.id;
    withdrawWithReceipt.timestamp = event.block.timestamp;
    withdrawWithReceipt.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    withdrawWithReceipt.data = event.params.receiptInformation.toString();
    withdrawWithReceipt.erc1155TokenId = event.params.id.toString();


    let receiptBalance = getReceiptBalance(
      event.address.toHex(),
      event.params.id
    );
    let contract = OffchainAssetVaultContract.bind(event.address);
    receiptBalance.valueExact = receiptBalance.valueExact.minus(
      event.params.shares
    );
    receiptBalance.value = toDecimals(
      receiptBalance.valueExact,
      contract.decimals()
    );
    receiptBalance.account = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    receiptBalance.confiscated = ZERO;
    receiptBalance.save();

    let receipt = getReceipt(offchainAssetReceiptVault.id, event.params.id);
    if ( receipt ) {
      receipt.shares = receipt.shares.minus(event.params.shares);
      receipt.save();
      withdrawWithReceipt.receipt = receipt.id;
    }

    withdrawWithReceipt.save();
  }
}
