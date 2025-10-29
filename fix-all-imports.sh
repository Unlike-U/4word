#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Complete Import Fix Suite            ║"
echo "╚════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Fix remaining imports
if [ -f "$SCRIPT_DIR/fix-remaining-imports.sh" ]; then
    bash "$SCRIPT_DIR/fix-remaining-imports.sh"
else
    echo "❌ fix-remaining-imports.sh not found!"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo ""

# Step 2: Test imports
if [ -f "$SCRIPT_DIR/test-imports.sh" ]; then
    echo "Running import tests..."
    echo ""
    bash "$SCRIPT_DIR/test-imports.sh"
else
    echo "⚠️  test-imports.sh not found, skipping tests..."
fi

echo ""
echo "═══════════════════════════════════════"
echo ""
echo "✅ Fix suite complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff src/js/"
echo "  2. Start dev server: python3 -m http.server 8000"
echo "  3. Open: http://localhost:8000/src/index.html"
echo "  4. Check browser console for errors"
echo ""
