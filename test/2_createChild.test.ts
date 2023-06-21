import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { OffchainAssetReceiptVault, Receipt } from "../typechain";
import { factory, subgraph } from "./1_factory.test";
import { getEventArgs, waitForSubgraphToBeSynced } from "./utils";

let alice: SignerWithAddress;
let tx: ContractTransaction;
export let vault: OffchainAssetReceiptVault;
export let receipt: Receipt;
describe("Create Child test", () => {
  before(async () => {
    const signers = await ethers.getSigners();
    alice = signers[0];

    const constructionConfig = {
      admin: alice.address,
      vaultConfig: {
        asset: ethers.constants.AddressZero,
        name: "OffchainAssetReceiptVault",
        symbol: "OARV",
      },
    };

    tx = await factory.createChildTyped(constructionConfig);
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
  });

  it("Should update the factory entity", async () => {
    const { child } = await getEventArgs(tx, "NewChild", factory);
    vault = await ethers.getContractAt("OffchainAssetReceiptVault", child) as OffchainAssetReceiptVault;
    const { sender, config } = await getEventArgs(tx, "OffchainAssetReceiptVaultInitialized", vault);
    receipt = await ethers.getContractAt("Receipt",config.receiptVaultConfig.receipt) as Receipt;
    const query = `{
        offchainAssetReceiptVaultFactory(id:"${factory.address.toLowerCase()}"){
            childrenCount
            children{
                id
            }
        }
    }`;

    const response = (await subgraph({ query })) as FetchResult;
    const factoryData = response.data.offchainAssetReceiptVaultFactory;
    expect(factoryData.children).to.deep.include({ id: child.toLowerCase() });
    assert.equal(factoryData.childrenCount, 1, "incorrect children count");
    assert.equal(factoryData.children.length, 1, "incorrect children count");
  });

  it("Should create vault entity", async () => {
    const { child } = await getEventArgs(tx, "NewChild", factory);

    const query = `{
        offchainAssetReceiptVault(id:"${child.toLowerCase()}"){
          id
          address
          admin
          name
          symbol
          deployer
          deployBlock
          factory{
            id
          }
          asAccount {
            id
          }
          totalShares
          certifiedUntil
          hashCount
        }
      }`;

    const response = (await subgraph({ query })) as FetchResult;
    const vaultData = response.data.offchainAssetReceiptVault;

    assert.equal(vaultData.id, child.toLowerCase());
    assert.equal(vaultData.address, child.toLowerCase());
    assert.equal(vaultData.admin, alice.address.toLowerCase());
    assert.equal(vaultData.name, "OffchainAssetReceiptVault");
    assert.equal(vaultData.symbol, "OARV");
    assert.equal(vaultData.deployer, alice.address.toLowerCase());
    assert.equal(vaultData.deployBlock, tx.blockNumber);
    assert.equal(vaultData.factory.id, factory.address.toLowerCase());
    assert.equal(vaultData.asAccount.id, `${child.toLowerCase()}-${child.toLowerCase()}`);
    assert.equal(vaultData.totalShares, 0);
    assert.equal(vaultData.certifiedUntil, 0);
    assert.equal(vaultData.hashCount, 0);
  });
});
