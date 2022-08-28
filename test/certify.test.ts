import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FetchResult } from "apollo-fetch";
import { assert } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { admin, offchainAssetVault } from "./1_construction.test";
import { waitForSubgraphToBeSynced } from "./utils/utils";
import { signers, subgraph } from "./_setup.test";

let alice: SignerWithAddress;
let trx: ContractTransaction;
let certifiedUntil;
describe("Certify Test", () => {
    before(async () => {
        alice = signers[7];
        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        certifiedUntil = block.timestamp + 100;

        await offchainAssetVault.connect(admin).grantRole(await offchainAssetVault.CERTIFIER(), alice.address);

        trx = await offchainAssetVault.connect(alice).certify(certifiedUntil, [], false);
        await waitForSubgraphToBeSynced(1000);
    });

    it("Should create correct certify entity", async ()=> {
        const query = `{
            certify(id: "Certify-${trx.hash.toLowerCase()}"){
                id
                timestamp
                certifiedUntil
                data
                offchainAssetVault{
                    certifiedUntil
                }
                emitter{
                    address
                }
                certifier{
                    address
                }
                transaction{
                    id
                }
            }
        }`;
        const response = (await subgraph({query: query})) as FetchResult;
        const certify = response.data.certify;

        assert.equal(certify.id, `Certify-${trx.hash}`);
        assert.equal(certify.data, `0x`);
        assert.equal(certify.certifiedUntil, certifiedUntil);
        assert.equal(certify.emitter.address, alice.address.toLowerCase());
        assert.equal(certify.certifier.address, alice.address.toLowerCase());
        assert.equal(certify.transaction.id, `${trx.hash}`);
        assert.equal(certify.offchainAssetVault.certifiedUntil, certifiedUntil);
    });
});