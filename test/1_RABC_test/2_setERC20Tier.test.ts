import { admin, offchainAssetVault } from "../1_construction.test";
import { ReadWriteTier } from "../../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signers, subgraph } from "../_setup.test";
import { waitForSubgraphToBeSynced } from "../utils/utils";
import { ERC20TIERER } from "../../src/roles";
import { FetchResult } from "apollo-fetch";
import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";

let TierV2TestContract: ReadWriteTier;
export let erc20Tierer: SignerWithAddress;
const minTier = ethers.BigNumber.from(10);
let grantRoleTrx: ContractTransaction;
describe("Set ERC20Tier test", () => {
  before(async () => {
    erc20Tierer = signers[3];
    grantRoleTrx = await offchainAssetVault
      .connect(admin)
      .grantRole(await offchainAssetVault.ERC20TIERER(), erc20Tierer.address);

    const TierV2Test = await ethers.getContractFactory("ReadWriteTier");
    TierV2TestContract = (await TierV2Test.deploy()) as ReadWriteTier;
    await TierV2TestContract.deployed();

    const trx = await offchainAssetVault
      .connect(erc20Tierer)
      .setERC20Tier(TierV2TestContract.address, minTier, []);

    await waitForSubgraphToBeSynced(1000);
  });

  it("should add RoleHolder entity for erc20Tierer", async () => {
    const query = `{
            role(id: "${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER}"){
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
    assert.equal(role.roleName, "ERC20TIERER");
    assert.equal(role.roleHash, ERC20TIERER);
    expect(role.roleHolders).to.lengthOf(1);

    const roleHolders = role.roleHolders[0];
    assert.equal(
      roleHolders.account.address,
      erc20Tierer.address.toLowerCase()
    );

    expect(roleHolders.roleGrants).to.lengthOf(1);

    const roleGrants = roleHolders.roleGrants[0];
    expect(roleGrants).to.deep.includes({ id: grantRoleTrx.hash });
    assert.equal(roleGrants.sender.address, admin.address.toLowerCase());
    assert.equal(roleGrants.emitter.address, admin.address.toLowerCase());
    assert.equal(roleGrants.account.address, erc20Tierer.address.toLowerCase());

    const activeRoles = roleHolders.activeRoles;
    expect(activeRoles).to.lengthOf(1)
    expect(activeRoles).to.deep.includes({id: `${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER}`})

  });
});
