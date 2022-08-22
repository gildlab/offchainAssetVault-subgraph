import { expect, assert } from "chai";
import { factory, signers, subgraph } from "./_setup.test";
import { getEventArgs, zeroAddress } from "./utils/utils";
import {
  NewChildEvent,
  OffchainAssetVaultConstructionConfigStruct,
} from "../typechain/OffchainAssetVaultFactory";
import { OffchainAssetVault } from "../typechain/OffchainAssetVault";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as Util from "./utils/utils";
import { FetchResult } from "apollo-fetch";
import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import {
  CERTIFIER,
  CERTIFIER_ADMIN,
  CONFISCATOR,
  CONFISCATOR_ADMIN,
  DEPOSITOR,
  DEPOSITOR_ADMIN,
  ERC1155TIERER,
  ERC1155TIERER_ADMIN,
  ERC20SNAPSHOTTER,
  ERC20SNAPSHOTTER_ADMIN,
  ERC20TIERER,
  ERC20TIERER_ADMIN,
  HANDLER,
  HANDLER_ADMIN,
  WITHDRAWER,
  WITHDRAWER_ADMIN,
} from "../src/roles";
export let deployer: SignerWithAddress;
export let admin: SignerWithAddress;
export let offchainAssetVault: OffchainAssetVault;
let deployTrx: ContractTransaction;
let constructionConfig: OffchainAssetVaultConstructionConfigStruct;
describe("OffchainAssetVaultFactory test", () => {
  before(async () => {
    admin = signers[1];
    deployer = signers[2];
  });

  it("Should deploy the factory correctly", async () => {
    expect(factory.address).to.not.null;
  });

  it("should deploy offchainAssetVault using factory", async () => {
    constructionConfig = {
      admin: admin.address,
      receiptVaultConfig: {
        asset: zeroAddress,
        name: "EthGild",
        symbol: "ETHg",
        uri: "ipfs://bafkreiahuttak2jvjzsd4r62xoxb4e2mhphb66o4cl2ntegnjridtyqnz4",
      },
    };
    deployTrx = await factory
      .connect(deployer)
      .createChildTyped(constructionConfig);

    await Util.waitForSubgraphToBeSynced(1000);

    const { sender, child } = (await getEventArgs(
      deployTrx,
      "NewChild",
      factory
    )) as NewChildEvent["args"];

    offchainAssetVault = (await ethers.getContractAt(
      "OffchainAssetVault",
      child
    )) as OffchainAssetVault;
    assert(
      sender.toLowerCase() == deployer.address.toLowerCase(),
      `${sender} != ${deployer.address.toLowerCase()}`
    );
    expect(child).to.not.null;

    await Util.waitForSubgraphToBeSynced(1000);
    const query = `
      {
        offchainAssetVaultFactory(id: "${factory.address.toLowerCase()}"){
          id
          address
          childrenCount
          children{
            id
          }
        }
      }
    `;

    const response = (await subgraph({
      query,
    })) as FetchResult;
    const data = response.data.offchainAssetVaultFactory;
    assert(
      data.id == factory.address.toLowerCase(),
      `${data.id} != ${factory.address.toLowerCase()}`
    );
    assert(
      data.address == factory.address.toLowerCase(),
      `${data.address} != ${factory.address.toLowerCase()}`
    );
    assert(data.childrenCount == "1", `${data.childrenCount} != 1`);

    const children = data.children;
    expect(children).to.lengthOf(1);
    expect(children).to.deep.includes({
      id: offchainAssetVault.address.toLowerCase(),
    });
  });

  it("Should create offchainAssetVault correctly", async () => {
    const query = `
      {
        offchainAssetVault(id: "${offchainAssetVault.address.toLowerCase()}"){
          id
          address
          deployBlock
          deployTimestamp
          deployer
          factory{
            address
          }
          admin
          name
          symbol
          asAccount
          totalShares
          uri
          certifiedUntil
          shareHolders {
            id
          }
          shareBalances {
            id
          }
          shareApprovals {
            id
          }
          shareTransfers {
            id
          }
          shareConfiscations {
            id
          }
          receipts {
            id
          }
          receiptHolders {
            id
          }
          receiptBalances {
            id
          }
          receiptOperators {
            id
          }
          receiptTransfers {
            id
          }
          receiptConfiscations {
            id
          }
          withdraws {
            id
          }
          deposits {
            id
          }
          roles {
            id
          }
          roleHolders {
            id
          }
          roleRevokes {
            id
          }
          rolesGranted {
            id
          }
        }
      }
    `;

    const response = (await subgraph({ query: query })) as FetchResult;
    const _offchainAssetVault = response.data.offchainAssetVault;

    assert(
      _offchainAssetVault.id == offchainAssetVault.address.toLowerCase(),
      `id: ${
        _offchainAssetVault.id
      } != ${offchainAssetVault.address.toLowerCase()}`
    );
    assert(
      _offchainAssetVault.address == offchainAssetVault.address.toLowerCase(),
      `address: ${
        _offchainAssetVault.address
      } != ${offchainAssetVault.address.toLowerCase()}`
    );
    assert(
      _offchainAssetVault.deployBlock == deployTrx.blockNumber,
      `deployBlock: ${_offchainAssetVault.deployBlock} != ${deployTrx.blockNumber}`
    );
    // assert(
    //   _offchainAssetVault.deployTimestamp == deployTrx.,
    //   `deployTimestamp: ${_offchainAssetVault.deployTimestamp} != ${deployTrx.timestamp}`
    // );
    assert(
      _offchainAssetVault.deployer == deployer.address.toLowerCase(),
      `deployer: ${
        _offchainAssetVault.deployer
      } != ${deployer.address.toLowerCase()}`
    );
    assert(
      _offchainAssetVault.factory.address == factory.address.toLowerCase(),
      `factory: ${
        _offchainAssetVault.factory.address
      } != ${offchainAssetVault.address.toLowerCase()}`
    );
    assert(
      _offchainAssetVault.admin == admin.address.toLowerCase(),
      `admin: ${_offchainAssetVault.admin} != ${admin.address.toLowerCase()}`
    );
    assert(
      _offchainAssetVault.name == constructionConfig.receiptVaultConfig.name,
      `admin: ${_offchainAssetVault.name} != ${constructionConfig.receiptVaultConfig.name}`
    );
    assert(
      _offchainAssetVault.symbol ==
        constructionConfig.receiptVaultConfig.symbol,
      `admin: ${_offchainAssetVault.symbol} != ${constructionConfig.receiptVaultConfig.symbol}`
    );
    assert(
      _offchainAssetVault.uri == constructionConfig.receiptVaultConfig.uri,
      `admin: ${_offchainAssetVault.uri} != ${constructionConfig.receiptVaultConfig.uri}`
    );
    assert(
      _offchainAssetVault.totalShares == "0",
      `admin: ${_offchainAssetVault.totalShares} != 0`
    );
    assert(
      _offchainAssetVault.certifiedUntil == "0",
      `admin: ${_offchainAssetVault.certifiedUntil} != 0`
    );

    expect(_offchainAssetVault.shareHolders).to.empty;
    expect(_offchainAssetVault.shareBalances).to.empty;
    expect(_offchainAssetVault.shareApprovals).to.empty;
    expect(_offchainAssetVault.shareTransfers).to.empty;
    expect(_offchainAssetVault.shareConfiscations).to.empty;
    expect(_offchainAssetVault.receipts).to.empty;
    expect(_offchainAssetVault.receiptHolders).to.empty;
    expect(_offchainAssetVault.receiptBalances).to.empty;
    expect(_offchainAssetVault.receiptOperators).to.empty;
    expect(_offchainAssetVault.receiptTransfers).to.empty;
    expect(_offchainAssetVault.receiptConfiscations).to.empty;
    expect(_offchainAssetVault.withdraws).to.empty;
    expect(_offchainAssetVault.deposits).to.empty;
    expect(_offchainAssetVault.roleRevokes).to.empty;
  });

  it("Should check the Roles entity correctly", async () => {
    const roleQuery = `
      {
        offchainAssetVault(id: "${offchainAssetVault.address.toLowerCase()}"){
          roles{
            id
          }
        }
      }
    `;

    const roleResponse = (await subgraph({ query: roleQuery })) as FetchResult;
    expect(roleResponse.data.offchainAssetVault.roles).to.lengthOf(16);

    const query = `{
      depositor: role(id:"${offchainAssetVault.address.toLowerCase()}-${DEPOSITOR}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      depositorAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${DEPOSITOR_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      withdrawer: role(id:"${offchainAssetVault.address.toLowerCase()}-${WITHDRAWER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      withdrawerAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${WITHDRAWER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      certifier: role(id:"${offchainAssetVault.address.toLowerCase()}-${CERTIFIER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      certifierAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${CERTIFIER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      handler: role(id:"${offchainAssetVault.address.toLowerCase()}-${HANDLER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      handlerAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${HANDLER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc20tierer: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc20tiererAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc1155tierer: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc1155tiererAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc20snapshotter: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC20SNAPSHOTTER}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      erc20snapshotterAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${ERC20SNAPSHOTTER_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      confiscator: role(id:"${offchainAssetVault.address.toLowerCase()}-${CONFISCATOR}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
      confiscatorAdmin: role(id:"${offchainAssetVault.address.toLowerCase()}-${CONFISCATOR_ADMIN}"){
        id
        roleHash
        roleName
        roleHolders{
          id
        }
        offchainAssetVault{
          address
        }
      }
    }`;

    const response = (await subgraph({ query: query })) as FetchResult;

    {
      const role = response.data.depositor;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${DEPOSITOR}`
      );
      assert.equal(role.roleName, `DEPOSITOR`);
      assert.equal(role.roleHash, DEPOSITOR);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.depositorAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${DEPOSITOR_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `DEPOSITOR_ADMIN`);
      assert.equal(roleAdmin.roleHash, DEPOSITOR_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${DEPOSITOR_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.withdrawer;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${WITHDRAWER}`
      );
      assert.equal(role.roleName, `WITHDRAWER`);
      assert.equal(role.roleHash, WITHDRAWER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.withdrawerAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${WITHDRAWER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `WITHDRAWER_ADMIN`);
      assert.equal(roleAdmin.roleHash, WITHDRAWER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${WITHDRAWER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.certifier;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${CERTIFIER}`
      );
      assert.equal(role.roleName, `CERTIFIER`);
      assert.equal(role.roleHash, CERTIFIER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.certifierAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${CERTIFIER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `CERTIFIER_ADMIN`);
      assert.equal(roleAdmin.roleHash, CERTIFIER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${CERTIFIER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.handler;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${HANDLER}`
      );
      assert.equal(role.roleName, `HANDLER`);
      assert.equal(role.roleHash, HANDLER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.handlerAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${HANDLER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `HANDLER_ADMIN`);
      assert.equal(roleAdmin.roleHash, HANDLER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${HANDLER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.erc20tierer;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER}`
      );
      assert.equal(role.roleName, `ERC20TIERER`);
      assert.equal(role.roleHash, ERC20TIERER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.erc20tiererAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC20TIERER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `ERC20TIERER_ADMIN`);
      assert.equal(roleAdmin.roleHash, ERC20TIERER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${ERC20TIERER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.erc1155tierer;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER}`
      );
      assert.equal(role.roleName, `ERC1155TIERER`);
      assert.equal(role.roleHash, ERC1155TIERER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.erc1155tiererAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC1155TIERER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `ERC1155TIERER_ADMIN`);
      assert.equal(roleAdmin.roleHash, ERC1155TIERER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${ERC1155TIERER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.erc20snapshotter;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC20SNAPSHOTTER}`
      );
      assert.equal(role.roleName, `ERC20SNAPSHOTTER`);
      assert.equal(role.roleHash, ERC20SNAPSHOTTER);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.erc20snapshotterAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${ERC20SNAPSHOTTER_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `ERC20SNAPSHOTTER_ADMIN`);
      assert.equal(roleAdmin.roleHash, ERC20SNAPSHOTTER_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${ERC20SNAPSHOTTER_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }

    {
      const role = response.data.confiscator;
      assert.equal(
        role.id,
        `${offchainAssetVault.address.toLowerCase()}-${CONFISCATOR}`
      );
      assert.equal(role.roleName, `CONFISCATOR`);
      assert.equal(role.roleHash, CONFISCATOR);
      assert.equal(
        role.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      expect(role.roleHolders).to.lengthOf(0);

      const roleAdmin = response.data.confiscatorAdmin;
      assert.equal(
        roleAdmin.id,
        `${offchainAssetVault.address.toLowerCase()}-${CONFISCATOR_ADMIN}`
      );
      assert.equal(roleAdmin.roleName, `CONFISCATOR_ADMIN`);
      assert.equal(roleAdmin.roleHash, CONFISCATOR_ADMIN);
      assert.equal(
        roleAdmin.offchainAssetVault.address,
        offchainAssetVault.address.toLowerCase()
      );
      assert.equal(
        roleAdmin.roleHolders[0].id,
        `${offchainAssetVault.address.toLowerCase()}-${admin.address.toLowerCase()}-${CONFISCATOR_ADMIN}`
      );
      expect(roleAdmin.roleHolders).to.lengthOf(1);
    }
  });
});
