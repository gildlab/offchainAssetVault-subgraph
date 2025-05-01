#!/bin/bash
set -e

# Initialize and update the ethgild submodule
echo "Initializing ethgild submodule..."
git submodule update --init --recursive

# Build the contracts
echo "Building contracts..."
nix develop -c bash -c '(cd lib/ethgild && rainix-sol-prelude)'
nix develop -c bash -c '(cd lib/rain.factory && rainix-sol-prelude)'



