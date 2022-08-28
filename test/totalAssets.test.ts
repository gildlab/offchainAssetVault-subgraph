import { assert, expect } from "chai";
import { offchainAssetVault, admin } from "./1_construction.test";
import { deployERC20PriceOracleVault, getEventArgs, waitForSubgraphToBeSynced } from "./utils/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20PriceOracleVault, TestErc20, TwoPriceOracle } from "../typechain";
import { ethers } from "hardhat";
import { signers, subgraph } from "./_setup.test";
import { BigNumber } from "ethers";
import { FetchResult } from "apollo-fetch";

let alice: SignerWithAddress;
let bob: SignerWithAddress;
export let asset: TestErc20,
  receiptVault: ERC20PriceOracleVault,
  priceOracle: TwoPriceOracle;
let expectedTotalShares: BigNumber;
export let caller, receiver, assets, shares, id, receiptInformation;
describe("TotalAssets on deposit test", () => {
  before(async () => {
    alice = signers[2];
    bob = signers[3];
    [receiptVault, asset, priceOracle] = await deployERC20PriceOracleVault();
  });

  it("Check total Assets", async () => {
    const shareRatio = await priceOracle.price();
    const aliceAssets = ethers.BigNumber.from(1000);
    expectedTotalShares = aliceAssets;
    await asset.transfer(alice.address, aliceAssets);

    await asset.connect(alice).increaseAllowance(offchainAssetVault.address, aliceAssets);

    await offchainAssetVault.connect(admin).grantRole(await offchainAssetVault.DEPOSITOR(), alice.address);
    await offchainAssetVault.connect(admin).grantRole(await offchainAssetVault.CERTIFIER(), alice.address);
    
    const trx = await offchainAssetVault.connect(alice)["deposit(uint256,address,uint256,bytes)"](
        aliceAssets,
        bob.address,
        shareRatio,
        bob.address
      );
    
    [ caller, receiver, assets, shares, id, receiptInformation] = await getEventArgs(trx, "DepositWithReceipt", offchainAssetVault);
    await waitForSubgraphToBeSynced(1000);

    const query = `{
        offchainAssetVault(id: "${offchainAssetVault.address.toLowerCase()}"){
            totalShares
            receipts{
                id
            }
            deposits{
                id
            }
        }
        receipt: receipt(id: "${offchainAssetVault.address.toLowerCase()}-${id}"){
                  id
                  receiptId
                  shares
                  receiptInformations{
                      id
                      information
                  }
                }
    }`;

    const response = (await subgraph({query: query})) as FetchResult;
    const _offchainAssetVault = response.data.offchainAssetVault;

    const receipts = _offchainAssetVault.receipts;
    const deposits = _offchainAssetVault.deposits;
    const receipt = response.data.receipt;
    const receiptInformations = receipt.receiptInformations;
    
    assert.equal(_offchainAssetVault.totalShares, expectedTotalShares);
    
    expect(receipts).to.lengthOf(1);
    expect(deposits).to.lengthOf(1);
    expect(receipts).to.deep.includes({id: `${offchainAssetVault.address.toLowerCase()}-${id}`});
    expect(deposits).to.deep.includes({id: `${id}`});
    
    assert.equal(receipt.id,`${offchainAssetVault.address.toLowerCase()}-${id}`);
    assert.equal(receipt.shares,aliceAssets);
    assert.equal(receipt.receiptId, id);
    assert.equal(receipt.receiptId, id);
    expect(receiptInformations).to.lengthOf(1);
    assert.equal(receiptInformations[0].information, receiptInformation);
    assert.equal(receiptInformations[0].id, `${offchainAssetVault.address.toLowerCase()}-${id}`);
  });
});
