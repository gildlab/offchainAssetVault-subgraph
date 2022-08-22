import { admin, offchainAssetVault } from "./1_construction.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "./_setup.test";
import { waitForSubgraphToBeSynced } from "./utils/utils";
import { ERC20SNAPSHOTTER } from "../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

let ERC20Snapshotter: SignerWithAddress;
let grantRoleTrx: ContractTransaction;
describe("Set ERC20Snapshotter test", () => {
  before(async () => {
    ERC20Snapshotter = signers[2];
    grantRoleTrx = await offchainAssetVault
      .connect( admin)
      .grantRole(
        await offchainAssetVault.ERC20SNAPSHOTTER(),
        ERC20Snapshotter.address
      );
    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for ERC20Snapshotter", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${ERC20SNAPSHOTTER}"){
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
    assert.equal(role.roleName, "ERC20SNAPSHOTTER");
    assert.equal(role.roleHash, ERC20SNAPSHOTTER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(
      roleHolders.account.address,
      ERC20Snapshotter.address.toLowerCase()
    );
    assert.isTrue(roleHolders.hasRole);
    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(
      roleGrants.account.address,
      ERC20Snapshotter.address.toLowerCase()
    );
  });
});
