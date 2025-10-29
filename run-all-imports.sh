#!/bin/bash

#####################################################
# Master script to run all updates
#####################################################

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "╔════════════════════════════════════════╗"
echo "║   4Word Complete Update Suite          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Step 1: Reorganize structure
if [ -f "$SCRIPT_DIR/reorganize-structure.sh" ]; then
    echo "📁 Step 1: Reorganizing directory structure..."
    bash "$SCRIPT_DIR/reorganize-structure.sh"
    echo ""
else
    echo "⚠️  reorganize-structure.sh not found, skipping..."
fi

# Step 2: Update import paths
if [ -f "$SCRIPT_DIR/update-import-paths.sh" ]; then
    echo "🔗 Step 2: Updating import paths..."
    bash "$SCRIPT_DIR/update-import-paths.sh"
    echo ""
else
    echo "❌ update-import-paths.sh not found!"
    exit 1
fi

# Step 3: Fix specific files
echo "🔧 Step 3: Fixing specific component imports..."

for script in fix-encryption-imports.sh fix-stego-imports.sh fix-inbox-imports.sh fix-mainapp-imports.sh; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        bash "$SCRIPT_DIR/$script"
    else
        echo "⚠️  $script not found, skipping..."
    fi
done

echo ""

# Step 4: Verify structure
if [ -f "$SCRIPT_DIR/verify-structure.sh" ]; then
    echo "✓ Step 4: Verifying structure..."
    bash "$SCRIPT_DIR/verify-structure.sh"
else
    echo "⚠️  verify-structure.sh not found, skipping verification..."
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ All updates complete!             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Review the changes in your code editor"
echo "  2. Test the application: python3 -m http.server 8000"
echo "  3. Open http://localhost:8000/src/index.html"
echo "  4. Check browser console for errors"
echo ""
echo "Backups are in backup_* directories"
