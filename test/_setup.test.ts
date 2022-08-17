import hre, { ethers } from "hardhat";
import { OffchainAssetVaultFactory } from "../typechain/OffchainAssetVaultFactory";
import * as path from "path";
import * as Util from "./utils/utils";

export let offchainAssetVaultFactory: OffchainAssetVaultFactory;
export let signers;

before("Deploy OffchainAssetVault Factory", async () => {
  signers = await ethers.getSigners();
  const OffchainAssetVaultFactory = await ethers.getContractFactory(
    "OffchainAssetVaultFactory"
  );
  offchainAssetVaultFactory =
    (await OffchainAssetVaultFactory.deploy()) as OffchainAssetVaultFactory;
  await offchainAssetVaultFactory.deployed();

  const pathExampleConfig = path.resolve(
    __dirname,
    `../config/${hre.network.name}.json`
  );
  const config = JSON.parse(Util.fetchFile(pathExampleConfig));

  config.network = hre.network.name;
  config.offchainAssetVaultFactory = offchainAssetVaultFactory.address;
  config.offchainAssetVaultFactoryBlock =
    offchainAssetVaultFactory.deployTransaction.blockNumber;

  Util.writeFile(pathExampleConfig, JSON.stringify(config, null, 2));

  const deployConfigExPath = path.resolve(
    __dirname,
    "../scripts/deployConfig.example.json"
  );

  const deployConfig = JSON.parse(Util.fetchFile(deployConfigExPath));

  // Setting all to localhost to test locally
  deployConfig.subgraphName = "rain-protocol/offchainAssetVault";
  deployConfig.configPath = "config/localhost.json";
  deployConfig.endpoint = "http://localhost:8020/";
  deployConfig.ipfsEndpoint = "http://localhost:5001";
  deployConfig.versionLabel = "1.0.0";

  // Write to the deployment configuration
  const deployConfigPath = path.resolve(
    __dirname,
    "../scripts/deployConfig.json"
  );
  
  Util.writeFile(deployConfigPath, JSON.stringify(deployConfig, null, 2));

  Util.exec(`npm run deploy-subgraph`);
});
