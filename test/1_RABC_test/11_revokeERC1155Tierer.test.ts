import { admin, offchainAssetVault } from "../1_construction.test";
import { subgraph } from "../_setup.test";
import { waitForSubgraphToBeSynced } from "../utils/utils";
import { ERC1155TIERER } from "../../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";
import { erc1155Tierer } from "./3_setERC1155Tier.test";

let grantRoleTrx: ContractTransaction;
describe("Revoke ERC20Tierer test", () => {
  before(async () => {
    grantRoleTrx = await offchainAssetVault
      .connect( admin)
      .revokeRole(
        await offchainAssetVault.ERC1155TIERER(),
        erc1155Tierer.address
      );
    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for erc1155Tierer", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER}"){
                roleName
                roleHash
                roleHolders{
                    account{
                        address
                    }
                    activeRoles{
                      id
                    }
                    roleRevoked{
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
    assert.equal(role.roleName, "ERC1155TIERER");
    assert.equal(role.roleHash, ERC1155TIERER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(
      roleHolders.account.address,
      erc1155Tierer.address.toLowerCase()
    );
    expect(roleHolders.roleRevoked).to.lengthOf(1);

    const roleRevoked = roleHolders.roleRevoked[0];
    expect(roleRevoked).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleRevoked.sender.address, admin.address.toLowerCase());
    assert.equal(roleRevoked.emitter.address, admin.address.toLowerCase());
    assert.equal(
      roleRevoked.account.address,
      erc1155Tierer.address.toLowerCase()
    );

    const activeRoles = roleHolders.activeRoles;
    expect(activeRoles).to.lengthOf(0)
  });
});
