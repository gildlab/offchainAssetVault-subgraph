import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction, ethers } from "ethers";
import { admin, offchainAssetVault } from "./1_construction.test";
import { TierV2TestContract as ERC20Tier } from "./1_RABC_test/2_setERC20Tier.test";
import { Tier, waitForSubgraphToBeSynced } from "./utils/utils";
import { signers, subgraph } from "./_setup.test";

let alice: SignerWithAddress;
let trx: ContractTransaction
describe("ConfiscateShares test", () => {
    before(async () => {
        alice = signers[2];
        await ERC20Tier.connect(alice).setTier(alice.address, Tier.ONE, [])
        await offchainAssetVault.connect(admin).grantRole(await offchainAssetVault.CONFISCATOR(), alice.address);

        trx = await offchainAssetVault.connect(alice)["confiscate(address)"](alice.address);
        await waitForSubgraphToBeSynced(1000);
    });

    it("Should correct ConfiscateShares entity",async () => {
        const query = `{
            offchainAssetVault(id: "${offchainAssetVault.address.toLowerCase()}"){
                shareConfiscations{
                    id
                }
            }
            confiscateShares(id: "ConfiscateShares-${trx.hash.toLowerCase()}"){
                id
                confiscated
                confiscator{
                    address
                }
                confiscatee{
                    address
                }
                transaction{
                    id
                }
                emitter{
                    address
                }
            }
        }`;

        const response = (await subgraph({query:query})) as FetchResult;
        const confiscateShares = response.data.confiscateShares;
        const shareConfiscations = response.data.offchainAssetVault.shareConfiscations;
        expect(shareConfiscations).to.lengthOf(1);
        expect(shareConfiscations).to.deep.includes({id: `ConfiscateShares-${trx.hash.toLowerCase()}`});

        assert.equal(confiscateShares.id, `ConfiscateShares-${trx.hash.toLowerCase()}`);
        assert.equal(confiscateShares.confiscator.address, alice.address.toLowerCase());
        assert.equal(confiscateShares.confiscatee.address, alice.address.toLowerCase());
        assert.equal(confiscateShares.emitter.address, alice.address.toLowerCase());
        assert.equal(confiscateShares.transaction.id, trx.hash.toLowerCase());
    });
});