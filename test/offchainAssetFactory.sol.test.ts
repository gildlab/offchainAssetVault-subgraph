import { expect } from "chai";
import { offchainAssetVaultFactory, signers } from "./_setup.test";
import {  } from "../typechain/OffchainAssetVault"
describe("OffchainAssetVaultFactory test", () => {
  before(async () => {});

  it("Should deploy the factory correctly", async () => {
    expect(offchainAssetVaultFactory.address).to.not.null;
  });

  it("should deploy offchainAssetVault using factory",async () => {
    const offchainAssetVault = await offchainAssetVaultFactory.createChildTyped();
  });
});
