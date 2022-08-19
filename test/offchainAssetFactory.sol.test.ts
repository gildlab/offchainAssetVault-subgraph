import { expect } from "chai";
import { offchainAssetVaultFactory, signers } from "./_setup.test";
import { zeroAddress } from "./utils/utils";
import { ConstructionConfigStruct } from "../typechain/OffchainAssetVaultFactory";
describe("OffchainAssetVaultFactory test", () => {
  before(async () => {});

  it("Should deploy the factory correctly", async () => {
    expect(offchainAssetVaultFactory.address).to.not.null;
  });

  it("should deploy offchainAssetVault using factory",async () => {
    const constructionConfig: ConstructionConfigStruct = {
      admin: signers[1].address,
      receiptVaultConfig: {
        asset: zeroAddress,
        name: "EthGild",
        symbol: "ETHg",
        uri: "ipfs://bafkreiahuttak2jvjzsd4r62xoxb4e2mhphb66o4cl2ntegnjridtyqnz4",
      },
    };
    const offchainAssetVault = await offchainAssetVaultFactory.createChildTyped(constructionConfig);
  });
});
