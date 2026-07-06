# offchainAssetVault-subgraph

The Graph subgraph for
[Offchain Asset Receipt Vaults](https://github.com/rainprotocol/ethgild). It
indexes vault deployments, deposits, withdrawals, share and receipt transfers,
authorizer roles, certifications, wrapped-token activity, and precomputed vault
aggregates used by the Gildlab REST API.

## What it indexes

- **Deployers** — `CloneFactory` and `StoxUnifiedDeployer` create new vault
  instances via templates.
- **Vaults** — `OffchainAssetReceiptVault` entities with share/receipt balances,
  authorizers, certifications, and exchange rates.
- **Activity** — deposits, withdrawals, transfers, confiscations, and wrapped
  ERC20 transfers.
- **Aggregates** — `tokenHolderCount`, `shareTransferCount`, `depositVolume`,
  and `withdrawVolume` maintained incrementally in handlers.

Contract ABIs come from git submodules (`lib/ethgild`, `lib/rain.factory`,
`lib/st0x.deploy`). Per-network contract addresses live in
[`networks.json`](./networks.json).

## Prerequisites

- [Nix](https://nixos.org/download/) with flakes enabled
- [Docker](https://docs.docker.com/get-docker/) (for Matchstick unit tests)

## Setup

```bash
git submodule update --init --recursive
./prep-ethgild.sh
```

`prep-ethgild.sh` initializes submodules and builds contract artifacts via
`rainix-sol-prelude`.

## Development

Enter the Nix dev shell:

```bash
nix develop
```

### Build

```bash
nix develop -c offchain-assets-subgraph-build
```

Or manually:

```bash
npm install
graph codegen
graph build
```

Build for a specific network (uses `networks.json`):

```bash
graph build --network base
```

### Test

Matchstick tests run inside Docker:

```bash
nix develop -c offchain-assets-subgraph-test
```

Or:

```bash
npm test
```

## Deploy

Deployments are triggered manually from GitHub Actions (**Deploy subgraph**
workflow). Pick a network and the workflow will:

1. Build contract artifacts and the subgraph
2. Deploy to Goldsky as `sft-<network>/<git-short-sha>`

The deploy version is the short git commit SHA of the checked-out ref, so each
deployment is traceable to an exact commit.

Requires the `CI_GOLDSKY_TOKEN` repository secret.

Supported networks: `arbitrum-one`, `arbitrum_sepolia`, `avalanche`, `base`,
`bsc`, `mainnet`, `flare`, `mumbai`, `oasis_sapphire`, `matic`, `sepolia`,
`songbird`, `linea`.

## Project layout

```
schema.graphql      GraphQL entity definitions
subgraph.yaml       Manifest (data sources, templates, handlers)
networks.json       Per-network contract addresses and start blocks
src/                AssemblyScript event handlers
tests/              Matchstick unit tests
lib/                Contract submodules (ethgild, rain.factory, st0x.deploy)
flake.nix           Nix dev shell and build/test tasks
```

## CI

- **Subgraph unit tests** — runs on push (`graph build` + Matchstick via Docker)
- **Deploy subgraph** — manual `workflow_dispatch` to Goldsky
