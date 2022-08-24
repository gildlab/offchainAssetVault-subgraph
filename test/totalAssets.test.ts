import { assert } from "chai";
import { offchainAssetVault, admin } from "./1_construction.test";
import { deployERC20PriceOracleVault } from "./utils/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20PriceOracleVault, TestErc20, TwoPriceOracle } from "../typechain";
import { ethers } from "hardhat";
import { signers } from "./_setup.test";

let alice: SignerWithAddress;
let bob: SignerWithAddress;
let asset: TestErc20,
  receiptVault: ERC20PriceOracleVault,
  priceOracle: TwoPriceOracle;
describe("TotalAssets test", () => {
  before(async () => {
    alice = signers[2];
    bob = signers[3];
    [receiptVault, asset, priceOracle] = await deployERC20PriceOracleVault();
  });

  it("Check total Assets", async () => {
    const totalSupply = await offchainAssetVault.totalSupply();
    const totalAssets = await offchainAssetVault.totalAssets();

    const shareRatio = await priceOracle.price();
    const aliceAssets = ethers.BigNumber.from(1000);

    await asset.transfer(alice.address, aliceAssets);

    await asset.connect(alice).increaseAllowance(offchainAssetVault.address, aliceAssets);

    await offchainAssetVault.connect(admin).grantRole(await offchainAssetVault.DEPOSITOR(), alice.address);

    await offchainAssetVault["deposit(uint256,address,uint256,bytes)"](
        aliceAssets,
        bob.address,
        shareRatio,
        []
      );

    await console.log(totalAssets, totalSupply);
    assert(
      totalSupply.eq(totalAssets),
      `Wrong total assets. Expected ${totalSupply} got ${totalAssets}`
    );
  });
});
