import hre, { ethers } from "hardhat";
import { OffchainAssetReceiptVaultFactory } from "../typechain-types/contracts/vault/offchainAsset/OffchainAssetReceiptVaultFactory";
import { OffchainAssetReceiptVault } from "../typechain-types/contracts/vault/offchainAsset/OffchainAssetReceiptVault";
import { ReceiptFactory } from "../typechain-types/contracts/vault/receipt/ReceiptFactory";
import { exec, fetchFile, fetchSubgraph, waitForSubgraphToBeSynced, writeFile } from "./utils";
import * as path from "path";
import { ApolloFetch } from "apollo-fetch";

export let subgraph: ApolloFetch;

describe("Deploy Factory Test", () => {
  let factory: OffchainAssetReceiptVaultFactory;
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

    const configPath = path.resolve(__dirname, `../config/${hre.network.name}.json`);
    const config = JSON.parse(fetchFile(configPath));

    config.network = hre.network.name;
    config.offchainAssetReceiptVaultFactory = factory.address;
    config.offchainAssetReceiptVaultFactoryBlock = factory.deployTransaction.blockNumber;

    console.log(factory.address);
    console.log(offchainAssetReceiptVaultImplementation.address);
    console.log(receiptFactoryContract.address);

    writeFile(configPath, JSON.stringify(config, null, 2))

    exec("npm run create-local");
    exec("npm run deploy-local");

    subgraph = fetchSubgraph("gildlab/offchainassetvault");
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
  });

  it("Should create factory entity", async () => {
    const query = `{
            offchainAssetReceiptVaultFactory(id:${factory.address.toLowerCase()}){
                id
                address
                implementation
                childrenCount
                children{
                    id
                }
            }
        }`;
  });
});
