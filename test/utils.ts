import { execSync } from "child_process";
import { ethers } from "hardhat";
import path from "path";
import { ApolloFetch, createApolloFetch } from "apollo-fetch";
import dotenv from "dotenv";
import fs from "fs";
import { BigNumber, Contract, ContractTransaction, Event } from "ethers";
import { Result } from "ethers/lib/utils";

dotenv.config();

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
export const fetchSubgraphs = process.env.GRAPH_URL
  ? createApolloFetch({
      uri: `http://${process.env.GRAPH_URL}:8030/graphql`,
    })
  : createApolloFetch({
      uri: `http://localhost:8030/graphql`,
    });

/**
 * Connect to an existing subgraph deployed in localhost
 * @param subgraphName Name of the subgraph
 * @returns connection to subgraph
 */
export const fetchSubgraph = (subgraphName: string): ApolloFetch => {
  return process.env.GRAPH_URL
    ? createApolloFetch({
        uri: `http://${process.env.GRAPH_URL}:8000/subgraphs/name/${subgraphName}`,
      })
    : createApolloFetch({
        uri: `http://localhost:8000/subgraphs/name/${subgraphName}`,
      });
};

/**
 * Create a promise to wait a determinated `ms`
 * @param ms Amount of time to wait in miliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Interfaces
interface SyncedSubgraphType {
  synced: boolean;
}

export const waitForSubgraphToBeSynced = async (
  wait = 0,
  timeDelay = 1,
  seconds = 60,
  subgraphName = "beehive-innovation/rain-protocol-test"
): Promise<SyncedSubgraphType> => {
  if (wait > 0) {
    await delay(wait);
  }
  /**
   * Waiting for 60s by default
   * Does not care about waiting the 60s -  the function already try to handle if does not receive
   * a response. If the subgraph need to wait for a big number of blocks, would be good increse
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

/// @param tx - transaction where event occurs
/// @param eventName - name of event
/// @param contract - contract object holding the address, filters, interface
/// @returns Event arguments, can be deconstructed by array index or by object key
export const getEventArgs = async (
  tx: ContractTransaction,
  eventName: string,
  contract: Contract
): Promise<Result> => {
  const eventObj = await getEvent(tx, eventName, contract);
  return await contract.interface.decodeEventLog(
    eventName,
    eventObj.data,
    eventObj.topics
  );
};

export const getEvent = async (
  tx: ContractTransaction,
  eventName: string,
  contract: Contract
): Promise<Event> => {
  const events = (await tx.wait()).events || [];
  const filter = (contract.filters[eventName]().topics || [])[0];
  const eventObj = events.find(
    (x) => x.topics[0] == filter && x.address == contract.address
  );

  if (!eventObj) {
    throw new Error(`Could not find event with name ${eventName}`);
  }

  return eventObj;
};

export const eighteenZeros = "000000000000000000";


export const ADDRESS_ZERO = ethers.constants.AddressZero;
export const ONE = ethers.BigNumber.from("1" + eighteenZeros);

export const fixedPointMul = (a: BigNumber, b: BigNumber): BigNumber =>
  a.mul(b).div(ONE);
export const fixedPointDiv = (a: BigNumber, b: BigNumber): BigNumber =>
  a.mul(ONE).div(b);
export const fixedPointDivRound = (a: BigNumber, b: BigNumber): BigNumber => {
  let result = a.mul(ONE).div(b);

  if (a.mul(ONE).mod(b).gt(0)) {
    result = result.add(1);
  }
  return result;
};

/**
 * Prefixes every rain meta document
 */
export const RAIN_META_DOCUMENT = BigInt(0xff0a89c674ee7874n);
/**S
 * OA Schema
 */
export const OA_SCHEMA = BigInt(0xffa8e8a9b9cf4a31n);
/**
 * OA Hash list
 */
export const OA_HASH_LIST = BigInt(0xff9fae3cc645f463n);
/**
 * OA Structure
 */
export const OA_STRUCTURE = BigInt(0xffc47a6299e8a911n);