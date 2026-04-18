{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.exiftool
    pkgs.jpegoptim
    pkgs.optipng
  ];
}
