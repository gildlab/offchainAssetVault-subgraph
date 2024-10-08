import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

require("dotenv").config();

function createLocalHostConfig() {
  const url = "http://localhost:8545";
  const mnemonic =
    "test test test test test test test test test test test junk";
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    url,
  };
}

const {
  RINKEBY_URL,
  PRIVATE_KEY,
  POLYGON_URL,
  MUMBAI_URL,
  ETHEREUM_SEPOLIA_URL,
  POLYGONSCAN_API_KEY,
  POLYGON_AMOY_URL
} = process.env;

export const config = {
  typechain: {
    outDir: "typechain",
  },
  networks: {
    hardhat: {
      blockGasLimit: 100000000,
      allowUnlimitedContractSize: true,
      hardfork: "london",
    },
    rinkeby: {
      url: RINKEBY_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      gasPrice: 11000000000,
    },
    matic: {
      url: POLYGON_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      gasPrice: 53000000000,
    },
    mumbai: {
      url: MUMBAI_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      gasPrice: 53000000000,
    },
    sepolia: {
      url: ETHEREUM_SEPOLIA_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      gasPrice: 10000000000,
    },
    "polygon-amoy" : {
      chainId: 80002,
      url: POLYGON_AMOY_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      gasPrice: 22000000000,
    },
    localhost: createLocalHostConfig(),
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100000,
          },
        },
      },
    ],
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: POLYGONSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 10,
  },
};
export default config;
