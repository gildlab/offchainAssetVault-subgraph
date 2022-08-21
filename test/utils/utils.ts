import { ethers } from "hardhat";
import { Result, concat, hexlify, Hexable, zeroPad } from "ethers/lib/utils";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { createApolloFetch, ApolloFetch } from "apollo-fetch";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type {
  Contract,
  Signer,
  BigNumberish,
  BigNumber,
  FixedNumber,
  ContractTransaction,
  BytesLike,
  Overrides,
} from "ethers";

// Typechain rain factories

// A fixed range to Tier Levels
type levelsRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Factory types
import type {
  Factory,
  ImplementationEvent,
  NewChildEvent,
} from "../../typechain/Factory";

// Interfaces
interface SyncedSubgraphType {
  synced: boolean;
}

interface BasicArtifact {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any[];
  bytecode: string;
}

// Helper values
export const sixZeros = "000000";
export const sixteenZeros = "0000000000000000";
export const eighteenZeros = "000000000000000000";
export const max_uint256 = ethers.BigNumber.from(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
);

export const zeroAddress = ethers.constants.AddressZero;

// BigNumbers
export const ONE = ethers.BigNumber.from("1" + eighteenZeros);
export const RESERVE_ONE = ethers.BigNumber.from("1" + sixZeros);

// Fixed number (Decimal)
export const oneHundredFN = ethers.FixedNumber.from(100, "fixed128x32");

export const CREATOR_FUNDS_RELEASE_TIMEOUT_TESTING = 100;
export const MAX_RAISE_DURATION_TESTING = 100;

// Verify Roles
export const DEFAULT_ADMIN_ROLE = ethers.utils.hexZeroPad("0x00", 32);

export const APPROVER_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("APPROVER_ADMIN")
);
export const APPROVER = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("APPROVER")
);

export const REMOVER_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("REMOVER_ADMIN")
);
export const REMOVER = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("REMOVER")
);

export const BANNER_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("BANNER_ADMIN")
);
export const BANNER = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("BANNER")
);

export enum RequestType {
  APPROVE,
  BAN,
  REMOVE,
}

export enum RequestStatus {
  NONE,
  APPROVE,
  BAN,
  REMOVE,
}

export enum VerifyStatus {
  NIL,
  ADDED,
  APPROVED,
  BANNED,
}

export enum VerifyRole {
  NONE,
  APPROVER_ADMIN,
  REMOVER_ADMIN,
  BANNER_ADMIN,
  APPROVER,
  REMOVER,
  BANNER,
}

export enum Tier {
  ZERO, // NIL
  ONE, // COPPER
  TWO, // BRONZE
  THREE, // SILVER
  FOUR, // GOLD
  FIVE, // PLATINUM
  SIX, // DIAMOND
  SEVEN, // CHAD
  EIGHT, // JAWAD
}

// All Opcodes
export enum AllStandardOps {
  CONSTANT,
  STACK,
  CONTEXT,
  STORAGE,
  ZIPMAP,
  DEBUG,
  ERC20_BALANCE_OF,
  ERC20_TOTAL_SUPPLY,
  ERC20_SNAPSHOT_BALANCE_OF_AT,
  ERC20_SNAPSHOT_TOTAL_SUPPLY_AT,
  IERC721_BALANCE_OF,
  IERC721_OWNER_OF,
  IERC1155_BALANCE_OF,
  IERC1155_BALANCE_OF_BATCH,
  BLOCK_NUMBER,
  SENDER,
  THIS_ADDRESS,
  BLOCK_TIMESTAMP,
  SCALE18,
  SCALE18_DIV,
  SCALE18_MUL,
  SCALE_BY,
  SCALEN,
  ANY,
  EAGER_IF,
  EQUAL_TO,
  EVERY,
  GREATER_THAN,
  ISZERO,
  LESS_THAN,
  SATURATING_ADD,
  SATURATING_MUL,
  SATURATING_SUB,
  ADD,
  DIV,
  EXP,
  MAX,
  MIN,
  MOD,
  MUL,
  SUB,
  ITIERV2_REPORT,
  ITIERV2_REPORT_TIME_FOR_TIER,
  SATURATING_DIFF,
  SELECT_LTE,
  UPDATE_TIMES_FOR_TIER_RANGE,
  length,
}

// Orderbook opcodes
export const OrderBookOps = {
  ORDER_FUNDS_CLEARED: 0 + AllStandardOps.length,
  COUNTERPARTY_FUNDS_CLEARED: 1 + AllStandardOps.length,
};


/**
 * Calculate the amount necessary to send or refund for get a `desiredLevel` from `currentLevel` on a TierContract
 * @param desiredLvl Desired TierLevel. Required to be between 0-8
 * @param currentLevel (Optional) Current TierLevel, by default if Tier.Zero -  Required to be between 0-8
 * @returns The difference of tokens between the actual level and desired level
 */;

/**
 * Create a fixed number with ethers. This intend to reduce the code and
 * manage the same format different to default one used by ethers
 * @param value value to convert to fixed number
 * @param format (optional) fixed number format. By default is fixed128x32
 * @returns a new fixedNumber object that represent the value
 */
export const fixedNumber = (
  value: BigNumber | string | number,
  format = "fixed128x32"
): FixedNumber => {
  return ethers.FixedNumber.from(value, format);
};

/**
 * Execute Child Processes
 * @param cmd Command to execute
 * @returns The command ran it
 */
export const exec = (cmd: string): string | Buffer => {
  const srcDir = path.join(__dirname, "..");
  try {
    return execSync(cmd, { cwd: srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

// Subgraph Management
export const fetchSubgraphs = createApolloFetch({
  uri: "http://localhost:8030/graphql",
});

/**
 * Connect to an existing subgraph deployed in localhost
 * @param subgraphName Name of the subgraph
 * @returns connection to subgraph
 */
export const fetchSubgraph = (subgraphName: string): ApolloFetch => {
  return createApolloFetch({
    uri: `http://localhost:8000/subgraphs/name/${subgraphName}`,
  });
};

/**
 * Wait for the synchronization of the subgraph when it is delayed with respect to the chain. It must be used
 * after a transaction and want to be query the result immediately after that
 * @param wait Amount of time in seconds to wait before ask to the subgraph about synchronization
 * @param timeDelay Amount of time in seconds to wait between queries
 * @param seconds Max time in seconds to wait by synchronization
 * @returns Subgraph Synchronized
 */
export const waitForSubgraphToBeSynced = async (
  wait = 0,
  timeDelay = 1,
  seconds = 60,
  subgraphName = "rain-protocol/offchainAssetVault"
): Promise<SyncedSubgraphType> => {
  if (wait > 0) {
    await delay(wait);
  }
  /**
   * Waiting for 60s by default
   * Does not care about waiting the 60s -  the function already try to handle if does not receive
   * a response. If the subgraph need to wait for a big number of blocks, would be good increase
   * the seconds to wait by sync.
   */
  const deadline = Date.now() + seconds * 1000;
  const currentBlock = await ethers.provider.getBlockNumber();

  const resp = new Promise<SyncedSubgraphType>((resolve, reject) => {
    // Function to check if the subgraph is synced asking to the GraphNode
    const checkSubgraphSynced = async () => {
      try {
        const result = await fetchSubgraphs({
          query: `
            {
              indexingStatusForCurrentVersion(subgraphName: "${subgraphName}") {
                synced
                health
                fatalError{
                  message
                  handler
                }
                chains {
                  chainHeadBlock {
                    number
                  }
                  latestBlock {
                    number
                  }
                }
              } 
            } 
          `,
        });
        const data = result.data.indexingStatusForCurrentVersion;
        if (
          data.synced === true &&
          data.chains[0].latestBlock.number == currentBlock
        ) {
          resolve({ synced: true });
        } else if (data.health === "failed") {
          reject(new Error(`Subgraph fatalError - ${data.fatalError.message}`));
        } else {
          throw new Error(`subgraph is not sync`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown Error";
        if (message.includes("connect ECONNREFUSED")) {
          reject(new Error(`Unable to connect to Subgraph node: ${message}`));
        }

        if (message == "Unknown Error") {
          reject(new Error(`${message} - ${e}`));
        }

        if (!currentBlock) {
          reject(new Error(`current block is undefined`));
        }

        if (e instanceof TypeError) {
          reject(
            new Error(
              `${e.message} - Check that the subgraphName provided is correct.`
            )
          );
        }

        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for the subgraph to sync`));
        } else {
          setTimeout(checkSubgraphSynced, timeDelay * 1000);
        }
      }
    };

    checkSubgraphSynced();
  });

  return resp;
};

/**
 * Deploy a contract with they artifact (JSON)
 * @param artifact The artifact of the contract to deploy. It should contain the ABI and bytecode. The
 * user should manage the type contract when returned.
 * @param signer Signer that will deploy the contract
 * @param argmts (Optional) Arguments to deploy the contract
 * @returns A deployed contract instance
 */
export const deploy = async (
  artifact: Artifact | BasicArtifact,
  signer: SignerWithAddress | Signer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argmts: any[] = []
): Promise<Contract> => {
  const iface = new ethers.utils.Interface(artifact.abi);
  const factory = new ethers.ContractFactory(iface, artifact.bytecode, signer);
  const contract = await factory.deploy(...argmts);
  await contract.deployed();
  return contract;
};

/**
 * Get the implementation address correspond to a Factory contract
 * @param factory The factory contract that have the implementation. For ex: a TrustFactory or SaleFactory
 * @returns The implementation address
 */
export const getImplementation = async (factory: Factory): Promise<string> => {
  const { implementation } = (await getEventArgs(
    factory.deployTransaction,
    "Implementation",
    factory
  )) as ImplementationEvent["args"];

  if (!ethers.utils.isAddress(implementation)) {
    throw new Error(
      `invalid implementation address: ${implementation} (${implementation.length} chars)`
    );
  }

  return implementation;
};

/**
 * Get the child address created by a factory contract in the correspond `transaction`
 * @param factory factory The factory contract that create the child. For ex: a TrustFactory or SaleFactory
 * @param transaction Transaction where the child was created
 * @returns Child address
 */
export const getChild = async (
  factory: Factory,
  transaction: ContractTransaction
): Promise<string> => {
  const { child } = (await getEventArgs(
    transaction,
    "NewChild",
    factory
  )) as NewChildEvent["args"];

  if (!ethers.utils.isAddress(child)) {
    throw new Error(`invalid address: ${child} (${child.length} chars)`);
  }

  return child;
};

/**
 * Send empty transactions to mine new blocks. Mainly used in HH network
 * @param count (optional) amount of block to be mined. If not provided, will just mine one block
 */
export const createEmptyBlock = async (count?: number): Promise<void> => {
  const signers = await ethers.getSigners();
  const tx = { to: signers[1].address };
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      await signers[0].sendTransaction(tx);
    }
  } else {
    await signers[0].sendTransaction(tx);
  }
};

/**
 * Wait until reach an specific blockNumber, useful to live networks. ** Note:** since HH network increase
 * block when mined, try calling `createEmptyBlock` instead
 * @param blockNumber amount of block to wait
 */
export const waitForBlock = async (blockNumber: number): Promise<void> => {
  const currentBlock = await ethers.provider.getBlockNumber();

  if (currentBlock >= blockNumber) {
    return;
  }

  console.log({
    currentBlock,
    awaitingBlock: blockNumber,
  });

  await delay(2000);

  return await waitForBlock(blockNumber);
};

/**
 * Create a promise to wait a determined `ms`
 * @param ms Amount of time to wait in milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read a file a return it as string
 * @param _path Location of the file
 * @returns The file as string
 */
export const fetchFile = (_path: string): string => {
  try {
    return fs.readFileSync(_path).toString();
  } catch (error) {
    console.log(error);
    return "";
  }
};

/**
 * Write a file
 * @param _path Location of the file
 * @param file The file
 */
// eslint-disable-next-line
export const writeFile = (_path: string, file: any): void => {
  try {
    fs.writeFileSync(_path, file);
  } catch (error) {
    console.log(error);
  }
};

/**
 *
 * @param tx transaction where event occurs
 * @param eventName name of event
 * @param contract contract object holding the address, filters, interface
 * @param contractAddressOverride (optional) override the contract address which emits this event
 * @returns Event arguments, can be deconstructed by array index or by object key
 */
export const getEventArgs = async (
  tx: ContractTransaction,
  eventName: string,
  contract: Contract,
  contractAddressOverride: string = null
): Promise<Result> => {
  const eventObj = (await tx.wait()).events.find(
    (x) =>
      x.topics[0] === contract.filters[eventName]().topics[0] &&
      x.address === (contractAddressOverride || contract.address)
  );

  if (!eventObj) {
    throw new Error(`Could not find event with name ${eventName}`);
  }

  // Return all events indexed and not indexed
  return contract.interface.decodeEventLog(
    eventName,
    eventObj.data,
    eventObj.topics
  );
};

export const wait = 1000;
