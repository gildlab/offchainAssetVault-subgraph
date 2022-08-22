import { admin, offchainAssetVault } from "./1_construction.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "./_setup.test";
import { waitForSubgraphToBeSynced } from "./utils/utils";
import { DEPOSITOR } from "../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

let depositor: SignerWithAddress;
let grantRoleTrx: ContractTransaction;
describe("Set Depositor test", () => {
  before(async () => {
    depositor = signers[4];
    grantRoleTrx = await offchainAssetVault
      .connect(admin)
      .grantRole(await offchainAssetVault.DEPOSITOR(), depositor.address);
    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for depositor", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${DEPOSITOR}"){
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
    assert.equal(role.roleName, "DEPOSITOR");
    assert.equal(role.roleHash, DEPOSITOR);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(roleHolders.account.address, depositor.address.toLowerCase());
    assert.isTrue(roleHolders.hasRole);
    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(roleGrants.account.address, depositor.address.toLowerCase());
  });
});
