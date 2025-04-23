import {
    test,
    assert,
    clearStore,
    describe,
    afterEach,
    clearInBlockStore,
    createMockedFunction,
  } from "matchstick-as";
  import { BigInt, Address, ethereum, Bytes } from "@graphprotocol/graph-ts";
  
export function createMockERC20Functions(address: Address): void {
    createMockedFunction(address, "name", "name():(string)")
      .withArgs([])
      .returns([ethereum.Value.fromString("Test")]);
    createMockedFunction(address, "symbol", "symbol():(string)")
      .withArgs([])
      .returns([ethereum.Value.fromString("TST")]);
    createMockedFunction(address, "decimals", "decimals():(uint8)")
      .withArgs([])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(18))]);
  }