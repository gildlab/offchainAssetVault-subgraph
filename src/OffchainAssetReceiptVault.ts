import { Address, DataSourceContext, json } from "@graphprotocol/graph-ts";
import {
  Certify,
  DepositWithReceipt,
  OffchainAssetReceiptVault,
  Role,
  RoleGranted,
  RoleRevoked,
  ConfiscateShares,
  WithdrawWithReceipt,
  Hash,
  User,
  Deployer,
  ReceiptVaultInformation,
  TokenHolder
} from "../generated/schema";
import { ReceiptTemplate } from "../generated/templates";
import {
  Approval,
  Certify as CertifyEvent,
  ConfiscateReceipt,
  ConfiscateShares as ConfiscateSharesEvent,
  Deposit,
  DepositWithReceipt as DepositWithReceiptEvent,
  ReceiptVaultInformation as ReceiptVaultInformationEvent,
  RoleAdminChanged,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  SetERC1155Tier,
  SetERC20Tier,
  Snapshot,
  Transfer,
  Withdraw,
  WithdrawWithReceipt as WithdrawWithReceiptEvent,
  OffchainAssetReceiptVault as OffchainAssetVaultContract,
  OffchainAssetReceiptVaultInitialized
} from "../generated/templates/OffchainAssetReceiptVaultTemplate/OffchainAssetReceiptVault";
import {
  CERTIFIER,
  CERTIFIER_ADMIN,
  CONFISCATOR,
  CONFISCATOR_ADMIN,
  DEPOSITOR,
  DEPOSITOR_ADMIN,
  ERC1155TIERER,
  ERC1155TIERER_ADMIN,
  ERC20SNAPSHOTTER,
  ERC20SNAPSHOTTER_ADMIN,
  ERC20TIERER,
  ERC20TIERER_ADMIN,
  HANDLER,
  HANDLER_ADMIN,
  WITHDRAWER,
  WITHDRAWER_ADMIN
} from "./roles";
import {
  getAccount,
  getReceipt,
  getReceiptBalance,
  getRoleHolder,
  getTransaction,
  ONE,
  toDecimals,
  ZERO,
  stringToArrayBuffer,
  RAIN_META_DOCUMENT,
  BigintToHexString, getTokenHolder
} from "./utils";

import { CBORDecoder } from "@rainprotocol/assemblyscript-cbor";


export function handleApproval(event: Approval): void {
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
    certify.save();

    offchainAssetReceiptVault.certifiedUntil = event.params.certifyUntil;
    offchainAssetReceiptVault.save();
  }
}

export function handleConfiscateReceipt(event: ConfiscateReceipt): void {
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
}

export function handleDepositWithReceipt(event: DepositWithReceiptEvent): void {
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

export function handleOffchainAssetVaultInitialized(
  event: OffchainAssetReceiptVaultInitialized
): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
    offchainAssetReceiptVault.admin = event.params.config.admin;
    offchainAssetReceiptVault.name =
      event.params.config.receiptVaultConfig.vaultConfig.name;
    offchainAssetReceiptVault.symbol =
      event.params.config.receiptVaultConfig.vaultConfig.symbol;
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

export function handleRoleAdminChanged(event: RoleAdminChanged): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  let role = new Role(event.address.toHex() + "-" + event.params.role.toHex());
  if ( offchainAssetReceiptVault ) {
    if ( event.params.role.toHex() == DEPOSITOR ) {
      role.roleName = "DEPOSITOR";
    } else if ( event.params.role.toHex() == DEPOSITOR_ADMIN ) {
      role.roleName = "DEPOSITOR_ADMIN";
    } else if ( event.params.role.toHex() == WITHDRAWER_ADMIN ) {
      role.roleName = "WITHDRAWER_ADMIN";
    } else if ( event.params.role.toHex() == CERTIFIER_ADMIN ) {
      role.roleName = "CERTIFIER_ADMIN";
    } else if ( event.params.role.toHex() == HANDLER_ADMIN ) {
      role.roleName = "HANDLER_ADMIN";
    } else if ( event.params.role.toHex() == ERC20TIERER_ADMIN ) {
      role.roleName = "ERC20TIERER_ADMIN";
    } else if ( event.params.role.toHex() == ERC1155TIERER_ADMIN ) {
      role.roleName = "ERC1155TIERER_ADMIN";
    } else if ( event.params.role.toHex() == ERC20SNAPSHOTTER_ADMIN ) {
      role.roleName = "ERC20SNAPSHOTTER_ADMIN";
    } else if ( event.params.role.toHex() == CONFISCATOR_ADMIN ) {
      role.roleName = "CONFISCATOR_ADMIN";
    } else if ( event.params.role.toHex() == WITHDRAWER ) {
      role.roleName = "WITHDRAWER";
    } else if ( event.params.role.toHex() == CERTIFIER ) {
      role.roleName = "CERTIFIER";
    } else if ( event.params.role.toHex() == HANDLER ) {
      role.roleName = "HANDLER";
    } else if ( event.params.role.toHex() == ERC20TIERER ) {
      role.roleName = "ERC20TIERER";
    } else if ( event.params.role.toHex() == ERC1155TIERER ) {
      role.roleName = "ERC1155TIERER";
    } else if ( event.params.role.toHex() == ERC20SNAPSHOTTER ) {
      role.roleName = "ERC20SNAPSHOTTER";
    } else if ( event.params.role.toHex() == CONFISCATOR ) {
      role.roleName = "CONFISCATOR";
    } else {
      role.roleName = "UNKNOWN";
    }
    role.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    role.roleHash = event.params.role;
    role.save();
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

  if ( offchainAssetReceiptVault && role ) {
    let roleGranted = new RoleGranted(event.transaction.hash.toHex());
    roleGranted.account = getAccount(
      event.params.account.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleGranted.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleGranted.sender = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleGranted.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    roleGranted.timestamp = event.block.timestamp;
    roleGranted.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    roleGranted.role = role.id;
    let roleHolder = getRoleHolder(
      event.address.toHex(),
      event.params.account.toHex(),
      event.params.role.toHex()
    );
    if ( roleHolder ) {
      roleGranted.roleHolder = roleHolder.id;

      let activeRoles = roleHolder.activeRoles;
      if ( activeRoles ) activeRoles.push(role.id);
      roleHolder.activeRoles = activeRoles;
      roleHolder.save();
    }
    roleGranted.save();

    role.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    role.roleHash = event.params.role;
    role.save();
  }
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  let role = Role.load(event.address.toHex() + "-" + event.params.role.toHex());

  if ( offchainAssetReceiptVault && role ) {
    let roleRevoked = new RoleRevoked(event.transaction.hash.toHex());
    roleRevoked.account = getAccount(
      event.params.account.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleRevoked.emitter = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleRevoked.sender = getAccount(
      event.params.sender.toHex(),
      offchainAssetReceiptVault.id
    ).id;
    roleRevoked.transaction = getTransaction(
      event.block,
      event.transaction.hash.toHex()
    ).id;
    roleRevoked.timestamp = event.block.timestamp;
    roleRevoked.offchainAssetReceiptVault = offchainAssetReceiptVault.id;
    roleRevoked.role = role.id;
    let roleHolder = getRoleHolder(
      event.address.toHex(),
      event.params.account.toHex(),
      event.params.role.toHex()
    );
    if ( roleHolder ) {
      roleRevoked.roleHolder = roleHolder.id;

      let old_activeRoles = roleHolder.activeRoles;
      let activeRoles: string[] = [];
      if ( old_activeRoles ) {
        for ( let i = 0; i < old_activeRoles.length; i++ ) {
          if ( old_activeRoles[ i ] != role.id )
            activeRoles.push(old_activeRoles[ i ]);
        }
      }
      roleHolder.activeRoles = activeRoles;
      roleHolder.save();
    }
    roleRevoked.save();
  }
}

export function handleSetERC1155Tier(event: SetERC1155Tier): void {
}

export function handleSetERC20Tier(event: SetERC20Tier): void {
}

export function handleSnapshot(event: Snapshot): void {
}

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


    if (from.equals(Address.zero()) || to.equals(Address.zero())) {
      // Skip adding the zero address to the token holder list
      return
    }

    // Update sender's token holder record
    let fromHolder = getTokenHolder(
      offchainAssetReceiptVault.address.toHex(),
      event.params.from.toHex());

    if ( fromHolder == null ) {
      fromHolder = new TokenHolder(from.toHex());
      fromHolder.account = from.toString();
    }

    fromHolder.save();

    // Update receiver's token holder record

    let toHolder = getTokenHolder(
      offchainAssetReceiptVault.address.toHex(),
      event.params.to.toHex());

    if ( toHolder == null ) {
      toHolder = new TokenHolder(to.toHex());
      toHolder.account = to.toString();
    }
    toHolder.save();

    offchainAssetReceiptVault.save();
  }
}

export function handleWithdraw(event: Withdraw): void {
  let offchainAssetReceiptVault = OffchainAssetReceiptVault.load(
    event.address.toHex()
  );
  if ( offchainAssetReceiptVault ) {
  }
}

export function handleWithdrawWithReceipt(
  event: WithdrawWithReceiptEvent
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
