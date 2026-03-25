import { Address, ByteArray, Bytes } from "@graphprotocol/graph-ts";

import {
  TimelockController,
  TimelockMinDelayChange,
  TimelockOperation,
  TimelockOperationCall,
} from "../generated/schema";

// Event types generated from the TimelockControllerA dataSource.
// TimelockControllerB uses the same ABI so its events are structurally identical.
import {
  CallExecuted,
  CallSalt,
  CallScheduled,
  Cancelled,
  MinDelayChange,
} from "../generated/TimelockControllerA/TimelockController";

import {
  CERTIFY,
  CERTIFY_ADMIN,
  CONFISCATE_RECEIPT,
  CONFISCATE_RECEIPT_ADMIN,
  CONFISCATE_SHARES,
  CONFISCATE_SHARES_ADMIN,
  DEPOSIT,
  DEPOSIT_ADMIN,
  TRANSFER_RECEIPT,
  TRANSFER_SHARES,
  WITHDRAW,
  WITHDRAW_ADMIN,
} from "./roles";

import { getTransaction } from "./utils";

// keccak256("grantRole(bytes32,address)")[0:4] = 0x2f2ff15d
const GRANT_ROLE_SELECTOR: u32 = 0x2f2ff15d;
// keccak256("revokeRole(bytes32,address)")[0:4] = 0xd547741f
const REVOKE_ROLE_SELECTOR: u32 = 0xd547741f;

function getOrCreateTimelockController(address: Address): TimelockController {
  let id = address.toHex();
  let timelock = TimelockController.load(id);
  if (!timelock) {
    timelock = new TimelockController(id);
    timelock.address = address;
    timelock.network = "base";
    timelock.save();
  }
  return timelock as TimelockController;
}

function roleNameFromHash(roleHex: string): string {
  if (roleHex == CERTIFY_ADMIN) return "CERTIFY_ADMIN";
  if (roleHex == CONFISCATE_SHARES_ADMIN) return "CONFISCATE_SHARES_ADMIN";
  if (roleHex == CONFISCATE_RECEIPT_ADMIN) return "CONFISCATE_RECEIPT_ADMIN";
  if (roleHex == DEPOSIT_ADMIN) return "DEPOSIT_ADMIN";
  if (roleHex == WITHDRAW_ADMIN) return "WITHDRAW_ADMIN";
  if (roleHex == CERTIFY) return "CERTIFY";
  if (roleHex == CONFISCATE_SHARES) return "CONFISCATE_SHARES";
  if (roleHex == CONFISCATE_RECEIPT) return "CONFISCATE_RECEIPT";
  if (roleHex == DEPOSIT) return "DEPOSIT";
  if (roleHex == WITHDRAW) return "WITHDRAW";
  if (roleHex == TRANSFER_SHARES) return "TRANSFER_SHARES";
  if (roleHex == TRANSFER_RECEIPT) return "TRANSFER_RECEIPT";
  return "";
}

/**
 * Lightweight calldata decoder for the two known authorizer selectors:
 *   grantRole(bytes32 role, address account)  — 0x2f2ff15d
 *   revokeRole(bytes32 role, address account) — 0xd547741f
 *
 * ABI encoding layout (68 bytes minimum):
 *   [0:4]   4-byte selector
 *   [4:36]  bytes32 role (big-endian)
 *   [36:68] address padded to 32 bytes (real address in last 20 bytes, [48:68])
 *
 * Note: generic ABI decoding is not available in AssemblyScript without an external codec
 * library, so we only handle these two well-known selectors here. Anything else is left as
 * raw bytes only.
 */
function tryDecodeRoleCall(call: TimelockOperationCall): void {
  let data = call.data;
  if (data.length < 68) return;

  // Read first 4 bytes as big-endian u32 to get the selector
  let sel: u32 =
    ((data[0] as u32) << 24) |
    ((data[1] as u32) << 16) |
    ((data[2] as u32) << 8) |
    (data[3] as u32);

  if (sel == GRANT_ROLE_SELECTOR) {
    call.decodedFunctionName = "grantRole";
  } else if (sel == REVOKE_ROLE_SELECTOR) {
    call.decodedFunctionName = "revokeRole";
  } else {
    return;
  }

  // bytes 4–35: bytes32 role
  let roleArr = new ByteArray(32);
  for (let i = 0; i < 32; i++) roleArr[i] = data[4 + i];
  let roleBytes = changetype<Bytes>(roleArr);
  call.decodedRoleHash = roleBytes;

  let roleName = roleNameFromHash(roleBytes.toHexString());
  if (roleName.length > 0) call.decodedRoleName = roleName;

  // bytes 36–67: address ABI-padded to 32 bytes; actual address is the last 20 bytes [48:68]
  let addrArr = new ByteArray(20);
  for (let i = 0; i < 20; i++) addrArr[i] = data[48 + i];
  call.decodedAccount = changetype<Bytes>(addrArr);
}

// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────

export function handleCallScheduled(event: CallScheduled): void {
  let timelockAddress = event.address;
  let opId = event.params.id.toHex();
  let index = event.params.index.toI32();

  getOrCreateTimelockController(timelockAddress);

  // The first CallScheduled for a given opId creates the operation entity.
  // Batch schedules emit one CallScheduled per call (same opId, incrementing index).
  let operation = TimelockOperation.load(opId);
  if (!operation) {
    operation = new TimelockOperation(opId);
    operation.timelock = timelockAddress.toHex();
    operation.predecessor = event.params.predecessor;
    operation.delay = event.params.delay;
    operation.scheduledAt = event.block.timestamp;
    operation.scheduledBlockNumber = event.block.number;
    operation.scheduledTxHash = event.transaction.hash;
    operation.timestamp = event.block.timestamp.plus(event.params.delay);
    operation.state = "PENDING";
    operation.callCount = 0;
    operation.executedCallCount = 0;
    operation.save();
  }

  // Create the call entity if it doesn't already exist (idempotent on replay)
  let callId = opId + "-" + index.toString();
  if (!TimelockOperationCall.load(callId)) {
    let call = new TimelockOperationCall(callId);
    call.operation = opId;
    call.index = index;
    call.target = event.params.target;
    call.value = event.params.value;
    call.data = event.params.data;
    call.executed = false;

    tryDecodeRoleCall(call);

    call.save();

    // Only increment callCount when a new call entity is created
    operation.callCount = operation.callCount + 1;
    operation.save();
  }
}

export function handleCallSalt(event: CallSalt): void {
  let opId = event.params.id.toHex();
  let operation = TimelockOperation.load(opId);
  if (operation) {
    operation.salt = event.params.salt;
    operation.save();
  }
}

export function handleCallExecuted(event: CallExecuted): void {
  let opId = event.params.id.toHex();
  let index = event.params.index.toI32();

  let callId = opId + "-" + index.toString();
  let call = TimelockOperationCall.load(callId);
  if (call) {
    call.executed = true;
    call.executedAt = event.block.timestamp;
    call.executedBlockNumber = event.block.number;
    call.executedTxHash = event.transaction.hash;
    call.save();
  }

  let operation = TimelockOperation.load(opId);
  if (operation) {
    operation.executedCallCount = operation.executedCallCount + 1;
    // Transition to DONE only when all scheduled calls have been executed
    if (operation.executedCallCount == operation.callCount) {
      operation.state = "DONE";
      operation.executedAt = event.block.timestamp;
    }
    operation.save();
  }
}

export function handleCancelled(event: Cancelled): void {
  let opId = event.params.id.toHex();
  let operation = TimelockOperation.load(opId);
  if (operation) {
    operation.state = "CANCELLED";
    operation.cancelledAt = event.block.timestamp;
    operation.save();
  }
}

export function handleMinDelayChange(event: MinDelayChange): void {
  let timelockAddress = event.address;
  getOrCreateTimelockController(timelockAddress);

  // Use tx hash + suffix for uniqueness; a single tx can only change the delay once
  let changeId = event.transaction.hash.toHex() + "-mindelay";
  let change = new TimelockMinDelayChange(changeId);
  change.timelock = timelockAddress.toHex();
  change.oldDuration = event.params.oldDuration;
  change.newDuration = event.params.newDuration;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.transaction = getTransaction(event.block, event.transaction.hash.toHex()).id;
  change.save();
}
