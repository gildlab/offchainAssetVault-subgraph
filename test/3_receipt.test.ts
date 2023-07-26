import { ReadWriteTier } from "../typechain";
import { ethers } from "hardhat";
import { receipt,vault } from "./2_createChild.test";
import { arrayify } from "ethers/lib/utils";
import { waitForSubgraphToBeSynced } from "./utils";
import { subgraph } from "./1_factory.test";
import { FetchResult } from "apollo-fetch";

const assert = require("assert");

let TierV2TestContract: ReadWriteTier;

describe("Receipt", async function () {
  beforeEach(async () => {
    const TierV2Test = await ethers.getContractFactory("ReadWriteTier");
    TierV2TestContract = (await TierV2Test.deploy()) as ReadWriteTier;
    await TierV2TestContract.deployed();
  });

  it("Checks ReceiptInformation event data", async function () {

    const signers = await ethers.getSigners();
    const alice = signers[0];

    let meta ="0xff0a89c674ee7874a50059014c789c5550414ec33010fc8a95731be1a42d0e3754090e5c40422db7c8b5b7e996d81b6c075a107f671d4002df76667666bc1f85d70e8aab621de86cc98b5beaadb80f7404938a5961888245af134416cda52a253fb59ac9852c9b0ba91aa55866219a804342f27fbc300a2d3ce8304f109c386077983b1d3af4c2c22bf43438f0490cdf69a227c3395630ad45420873298e63c068d14cceb3a2e376ed10d0e4cad5b2ced93d3986c88e93a87da677e6545d2e7eb8c0517e9c16a42c7f3768801343f2e2b2ac19e231e884becb567b4c2dcfede4242bb5ca8790ada1f80f5fd63f5eb0c364754e6dca86318dd164c5a2c90a3f84653be4dda473649d8b61087fb145ae35e8f34e9be7d6914f875cb79aaa39f4dcade77f441a8381166242c79762c983b3eb718cfb1bb73fd34e551b7b7d685ed7cdf2f1ad7b02d8aa5332dbbb51837dd91c7df1f905bec3a1cb011bffc47a6299e8a91102706170706c69636174696f6e2f6a736f6e03676465666c6174651bffa8e8a9b9cf4a31782e516d6642356242676f635131526366773855416e37634b5265475941676b5643736e55746d7067544568354d3746a200785d516d644375757366466d66796f6238325664416839764339355477675865655738787463574b7561656471566a6e2c516d616366706f365a5369773674315652437a507a46506a6431345259784d676e415967656e3838415052746175011bff9fae3cc645f463"
    await receipt.connect(alice).receiptInformation(ethers.BigNumber.from(1), arrayify(meta));

    const query = `{
        offchainAssetReceiptVault(id:"${vault.address.toLowerCase()}"){
          id
          receipts {
            id
            receiptInformations {
              information
              payload
              contentEncoding
              contentType
            }
          }
        }
      }`;
    await waitForSubgraphToBeSynced(1000, 1, 60, "gildlab/offchainassetvault");
    const response = (await subgraph({ query })) as FetchResult;
    const vaultData = response.data.offchainAssetReceiptVault.receipts[0].receiptInformations[0];

    assert.equal(vaultData.contentEncoding, "deflate");
    assert.equal(vaultData.contentType, "application/json");
    assert.equal(vaultData.information, meta);
  });

});
