{
  description = "Flake utils demo";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.flake-utils.inputs.nixpkgs.follows = "nixpkgs";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in
      {
        #packages = rec {
        #  hello = pkgs.hello;
        #  default = hello;
        #};
        #apps = rec {
        #  hello = flake-utils.lib.mkApp { drv = self.packages.${system}.hello; };
        #  default = hello;
        #};

        packages = {
          dmenu = pkgs.rustPlatform.buildRustPackage {
            inherit (
              builtins.fromTOML (builtins.readFile ./Cargo.toml).package
            ) name version;
            src = ./.;
            cargoLock.lockFile = ./Cargo.lock;
            buildInputs = with pkgs; [ glib.dev glib.bin pkg-config ];
          };
        };

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [ 
            glib.dev
            glib.bin
            cargo
            rustc
            pkg-config
            rust-analyzer
            clippy
          ];
        };
      }
    );
}
