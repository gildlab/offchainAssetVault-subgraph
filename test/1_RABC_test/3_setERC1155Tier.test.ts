import { admin, offchainAssetVault } from "../1_construction.test";
import { ReadWriteTier } from "../../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "../_setup.test";
import { waitForSubgraphToBeSynced } from "../utils/utils";
import { ERC1155TIERER } from "../../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

let TierV2TestContract: ReadWriteTier;
export let erc1155Tierer: SignerWithAddress;
const minTier = ethers.BigNumber.from(10);
let grantRoleTrx: ContractTransaction;
describe("Set ERC1155Tier test", () => {
  before(async () => {
    erc1155Tierer = signers[4];
    grantRoleTrx = await offchainAssetVault
      .connect(admin)
      .grantRole(
        await offchainAssetVault.ERC1155TIERER(),
        erc1155Tierer.address
      );

    const TierV2Test = await ethers.getContractFactory("ReadWriteTier");
    TierV2TestContract = (await TierV2Test.deploy()) as ReadWriteTier;
    await TierV2TestContract.deployed();

    const trx = await offchainAssetVault
      .connect(erc1155Tierer)
      .setERC1155Tier(TierV2TestContract.address, minTier, []);

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
    assert.equal(role.roleName, "ERC1155TIERER");
    assert.equal(role.roleHash, ERC1155TIERER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(
      roleHolders.account.address,
      erc1155Tierer.address.toLowerCase()
    );
    
    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(
      roleGrants.account.address,
      erc1155Tierer.address.toLowerCase()
    );

    const activeRoles = roleHolders.activeRoles;
    expect(activeRoles).to.lengthOf(1)
    expect(activeRoles).to.deep.includes({id: `${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER}`})
  });
});
