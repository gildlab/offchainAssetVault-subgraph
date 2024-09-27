let
  pkgs = import
    (builtins.fetchTarball {
      name = "0-unstable-2024-09-13";
      url = "https://github.com/nixos/nixpkgs/archive/247cebfe0bb628849a8781be40f193bf622b877b.tar.gz";
    })
    { };

  compile = pkgs.writeShellScriptBin "compile" ''
    npx hardhat compile
  '';

  codegen = pkgs.writeShellScriptBin "codegen" ''
    npm run codegen
  '';

  build = pkgs.writeShellScriptBin "build" ''
    npm run build
  '';

  prepare-mumbai = pkgs.writeShellScriptBin "prepare-mumbai" ''
    npx mustache config/mumbai.json subgraph.template.yaml subgraph.yaml
    codegen
    build
  '';

  prepare-polygon = pkgs.writeShellScriptBin "prepare-polygon" ''
    npx mustache config/polygon.json subgraph.template.yaml subgraph.yaml
    codegen
    build
  '';

  deploy-mumbai = pkgs.writeShellScriptBin "deploy-mumbai" ''
    npm run ts-node scripts/index.ts --config config/mumbai.json --subgraphTemplate subgraph.template.yaml --subgraphName gild-lab/offchainassetvault
  '';

  deploy-polygon = pkgs.writeShellScriptBin "deploy-polygon" ''
    npm run ts-node scripts/index.ts --config config/polygon.json --subgraphTemplate subgraph.template.yaml --subgraphName gild-lab/offchainassetvault
  '';

  init = pkgs.writeShellScriptBin "init" ''
    mkdir -p contracts && cp -r node_modules/@gildlab/ethgild/contracts/* contracts
    compile
  '';
in
pkgs.stdenv.mkDerivation {
  name = "shell";
  buildInputs = [
    pkgs.nixpkgs-fmt
    pkgs.nodejs-18_x
    codegen
    build
    prepare-mumbai
    prepare-polygon
    deploy-mumbai
    deploy-polygon
    compile
    init
  ];

  shellHook = ''
    export PATH=$( npm bin ):$PATH
    # keep it fresh
    npm i
  '';
}
