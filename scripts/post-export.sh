#!/bin/bash
# Apply local fixes after mintlify export (export overwrites serve.js and startup scripts).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT="${1:-$ROOT/kunpo-api-docs-export}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -d "$EXPORT" ]]; then
  echo "Error: $EXPORT not found. Run mintlify export first."
  exit 1
fi

cp "$SCRIPT_DIR/serve.js" "$EXPORT/serve.js"

node "$SCRIPT_DIR/build-search.mjs" "$EXPORT"

if [[ -f "$EXPORT/Start Docs.command" ]]; then
  if ! grep -q 'PORT=' "$EXPORT/Start Docs.command"; then
    sed -i '' '/cd "\$(dirname "\$0")"/a\
export PORT="${PORT:-5500}"
' "$EXPORT/Start Docs.command" 2>/dev/null || \
    sed -i '/cd "\$(dirname "\$0")"/a export PORT="${PORT:-5500}"' "$EXPORT/Start Docs.command"
  fi
  chmod +x "$EXPORT/Start Docs.command"
fi

if [[ -f "$EXPORT/Start Docs.bat" ]]; then
  if ! grep -q 'set PORT=' "$EXPORT/Start Docs.bat"; then
    sed -i '' 's/node serve.js/if not defined PORT set PORT=5500\n  node serve.js/' "$EXPORT/Start Docs.bat" 2>/dev/null || \
    sed -i 's/node serve.js/if not defined PORT set PORT=5500\r\n  node serve.js/' "$EXPORT/Start Docs.bat"
  fi
fi

echo "Post-export search and launcher setup complete (auto port from 5500)."
