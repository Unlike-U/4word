#!/bin/bash
# File: verify-structure.sh

echo "🔍 Verifying 4Word Structure..."
echo ""

ERRORS=0

# Check critical files
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ MISSING: $1"
        ((ERRORS++))
    fi
}

echo "📁 Checking core files:"
check_file "src/js/crypto/webCrypto.js"
check_file "src/js/crypto/steganography.js"
check_file "src/js/storage/indexedDB.js"
check_file "src/js/utils/validation.js"
check_file "src/js/components/StegoInbox.js"
check_file "src/styles/StegoInbox.css"

echo ""
echo "📁 Checking old locations (should not exist):"

check_not_exist() {
    if [ ! -f "$1" ]; then
        echo "✅ Removed: $1"
    else
        echo "⚠️  Still exists: $1 (should be deleted)"
        ((ERRORS++))
    fi
}

check_not_exist "src/crypto/webCrypto.js"
check_not_exist "src/storage/indexedDB.js"
check_not_exist "src/utils/validation.js"
check_not_exist "src/components/StegoInbox.jx"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Structure is correct."
else
    echo "❌ Found $ERRORS issues. Please review above."
fi
