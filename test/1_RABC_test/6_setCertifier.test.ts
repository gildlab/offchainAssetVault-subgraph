import { admin, offchainAssetVault } from "../1_construction.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "../_setup.test";
import { waitForSubgraphToBeSynced } from "../utils/utils";
import { CERTIFIER } from "../../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

export let certifier: SignerWithAddress;
let grantRoleTrx: ContractTransaction;
describe("Set Certifier test", () => {
  before(async () => {
    certifier = signers[7];
    grantRoleTrx = await offchainAssetVault
      .connect(admin)
      .grantRole(await offchainAssetVault.CERTIFIER(), certifier.address);
    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for certifier", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${CERTIFIER}"){
                roleName
                roleHash
                roleHolders{
                    account{
                        address
                    }
                    activeRoles{
                      id
                    }
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
    assert.equal(role.roleName, "CERTIFIER");
    assert.equal(role.roleHash, CERTIFIER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(roleHolders.account.address, certifier.address.toLowerCase());
    
    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(roleGrants.account.address, certifier.address.toLowerCase());

    const activeRoles = roleHolders.activeRoles;
    expect(activeRoles).to.lengthOf(1)
    expect(activeRoles).to.deep.includes({id: `${offchainAssetVault.address.toLowerCase()}-${CERTIFIER}`})
  });
});
