import { admin, offchainAssetVault } from "./1_construction.test";
import { ReadWriteTier } from "../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "./_setup.test";
import { waitForSubgraphToBeSynced } from "./utils/utils";
import { WITHDRAWER } from "../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

let withdrawer: SignerWithAddress;
let grantRoleTrx: ContractTransaction;
describe("Set Withdrawer test", () => {
  before(async () => {
    withdrawer = signers[6];
    grantRoleTrx = await offchainAssetVault
      .connect(admin)
      .grantRole(await offchainAssetVault.WITHDRAWER(), withdrawer.address);
    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for withdrawer", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${WITHDRAWER}"){
                roleName
                roleHash
                roleHolders{
                    account{
                        address
                    }
                    hasRole
                    roleGrants{
                        id
                        sender{
                            address
                        }
                        emitter{
                            address
                        }
                        account{
                            address
                        }
                    }
                }
            }
        }`;

    const response = (await subgraph({ query: query })) as FetchResult;
    const role = response.data.role;
    assert.equal(role.roleName, "WITHDRAWER");
    assert.equal(role.roleHash, WITHDRAWER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(roleHolders.account.address, withdrawer.address.toLowerCase());
    assert.isTrue(roleHolders.hasRole);
    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(roleGrants.account.address, withdrawer.address.toLowerCase());
  });
});
