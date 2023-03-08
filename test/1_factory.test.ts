import hre, { ethers } from "hardhat";
import { OffchainAssetReceiptVaultFactory } from "../typechain/contracts/vault/offchainAsset/OffchainAssetReceiptVaultFactory";
import { OffchainAssetReceiptVault } from "../typechain/contracts/vault/offchainAsset/OffchainAssetReceiptVault";
import { ReceiptFactory } from "../typechain/contracts/vault/receipt/ReceiptFactory";
import {
  exec,
  fetchFile,
  fetchSubgraph,
  waitForSubgraphToBeSynced,
  writeFile,
} from "./utils";
import * as path from "path";
import { ApolloFetch, FetchResult } from "apollo-fetch";
import { assert } from "chai";

export let subgraph: ApolloFetch;
export let factory: OffchainAssetReceiptVaultFactory;

describe("Deploy Factory Test", () => {
  before(async () => {
    const offchainAssetReceiptVaultImplementationFactory =
      await ethers.getContractFactory("OffchainAssetReceiptVault");
    const offchainAssetReceiptVaultImplementation =
      (await offchainAssetReceiptVaultImplementationFactory.deploy()) as OffchainAssetReceiptVault;

    const receiptFactoryFactory = await ethers.getContractFactory(
      "ReceiptFactory"
    );
    const receiptFactoryContract =
      (await receiptFactoryFactory.deploy()) as ReceiptFactory;
    await receiptFactoryContract.deployed();

    const Factory = await ethers.getContractFactory(
      "OffchainAssetReceiptVaultFactory"
    );
    factory = (await Factory.deploy({
      implementation: offchainAssetReceiptVaultImplementation.address,
      receiptFactory: receiptFactoryContract.address,
    })) as OffchainAssetReceiptVaultFactory;
    await factory.deployed();

    const configPath = path.resolve(
      __dirname,
      `../config/localhost.json`
    );
    const config = JSON.parse(fetchFile(configPath));

    config.network = hre.network.name;
    config.offchainAssetReceiptVaultFactory = factory.address;
    config.offchainAssetReceiptVaultFactoryBlock =
      factory.deployTransaction.blockNumber;

    writeFile(configPath, JSON.stringify(config, null, 2));

    exec("npm run create-local");
    exec("npm run deploy-local");

    subgraph = fetchSubgraph("gildlab/offchainassetvault");
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
  });

  it("Should create factory entity", async () => {
    const query = `{
            offchainAssetReceiptVaultFactory(id:"${factory.address.toLowerCase()}"){
                id
                address
                implementation
                childrenCount
                children{
                    id
                }
            }
        }`;
    const response = (await subgraph({
      query,
    })) as FetchResult;

    const factoryData = response.data.offchainAssetReceiptVaultFactory;
    assert.equal(factory.address.toLowerCase(), factoryData.id, `${factory.address.toLowerCase()} != ${factoryData.id}`);
    assert.equal(factory.address.toLowerCase(), factoryData.address, `${factory.address.toLowerCase()} != ${factoryData.address}`);
    assert.equal(0 , factoryData.childrenCount, `${0} != ${factoryData.childrenCount}`);
    assert.isEmpty(factoryData.children, "children Array not empty");
  });
});
