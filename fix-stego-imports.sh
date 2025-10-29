#!/bin/bash

# Fix SteganographyView.js imports

FILE="src/js/components/SteganographyView.js"

if [ ! -f "$FILE" ]; then
    echo "❌ $FILE not found"
    exit 1
fi

echo "🔧 Updating SteganographyView.js imports..."

# Backup
cp "$FILE" "${FILE}.backup"

# Add imports at the top if not present
if ! grep -q "import stego from" "$FILE"; then
    sed -i '1i import stego from '"'"'../crypto/steganography.js'"'"';' "$FILE"
    echo "  ✓ Added stego import"
fi

if ! grep -q "import.*Validator" "$FILE"; then
    sed -i '1i import { Validator } from '"'"'../utils/validation.js'"'"';' "$FILE"
    echo "  ✓ Added Validator import"
fi

if ! grep -q "import storage from" "$FILE"; then
    sed -i '1i import storage from '"'"'../storage/indexedDB.js'"'"';' "$FILE"
    echo "  ✓ Added storage import"
fi

# Remove CryptoJS if present
if grep -q "crypto-js" "$FILE"; then
    sed -i '/crypto-js/d' "$FILE"
    echo "  ✓ Removed CryptoJS"
fi

echo "✅ SteganographyView.js updated"
