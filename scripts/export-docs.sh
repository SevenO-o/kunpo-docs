#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/kunpo-docs-export.XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT
ZIP="$WORK_DIR/export.zip"

cd "$ROOT"
echo "Exporting Mintlify site..."
mintlify export --output "$ZIP"

unzip -tq "$ZIP" >/dev/null
unzip -q "$ZIP" -d "$WORK_DIR/site"

bash "$ROOT/scripts/post-export.sh" "$WORK_DIR/site"
# Package after post-processing so the zip contains the same search as the preview.
(cd "$WORK_DIR/site" && zip -qr "$WORK_DIR/ready.zip" .)
unzip -tq "$WORK_DIR/ready.zip" >/dev/null
rm -rf "$ROOT/kunpo-api-docs-export"
mv "$WORK_DIR/site" "$ROOT/kunpo-api-docs-export"
mv "$WORK_DIR/ready.zip" "$ROOT/kunpo-api-docs-export.zip"

echo "Done: $ROOT/kunpo-api-docs-export.zip"
