let
  pkgs = import
    (builtins.fetchTarball {
      name = "nixos-unstable-2021-10-01";
      url = "https://github.com/nixos/nixpkgs/archive/d3d2c44a26b693293e8c79da0c3e3227fc212882.tar.gz";
      sha256 = "0vi4r7sxzfdaxzlhpmdkvkn3fjg533fcwsy3yrcj5fiyqip2p3kl";
    })
    { };

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
in
pkgs.stdenv.mkDerivation {
  name = "shell";
  buildInputs = [
    pkgs.nixpkgs-fmt
    pkgs.nodejs-16_x
    codegen
    build
    prepare-mumbai
    prepare-polygon
    deploy-mumbai
    deploy-polygon
  ];

  shellHook = ''
    export PATH=$( npm bin ):$PATH
    # keep it fresh
    npm i
  '';
}
