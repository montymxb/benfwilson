#!/usr/bin/env bash
set -euo pipefail

IMAGE_DIR="public/assets/images"

# check that required tools are installed
for cmd in exiftool jpegoptim optipng; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is not installed. Install via: brew install $cmd"
    exit 1
  fi
done

if [ ! -d "$IMAGE_DIR" ]; then
  echo "Error: directory $IMAGE_DIR does not exist"
  exit 1
fi

# strip all EXIF/metadata from every image (GPS, camera info, timestamps, etc.)
echo "Stripping metadata..."
exiftool -all= -overwrite_original "$IMAGE_DIR"/*

# compress JPGs — quality 80, strip any remaining markers
echo "Optimizing JPEGs..."
for f in "$IMAGE_DIR"/*.jpg "$IMAGE_DIR"/*.jpeg; do
  if [ -f "$f" ]; then
    jpegoptim --max=80 --strip-all "$f"
  fi
done

# optimize PNGs losslessly
echo "Optimizing PNGs..."
for f in "$IMAGE_DIR"/*.png; do
  if [ -f "$f" ]; then
    optipng -o2 "$f"
  fi
done

echo "Done!"
