#!/bin/bash

# Fix InboxView.js imports

FILE="src/js/components/InboxView.js"

if [ ! -f "$FILE" ]; then
    echo "❌ $FILE not found"
    exit 1
fi

echo "🔧 Updating InboxView.js imports..."

# Backup
cp "$FILE" "${FILE}.backup"

# Add storage import if not present
if ! grep -q "import storage from" "$FILE"; then
    sed -i '1i import storage from '"'"'../storage/indexedDB.js'"'"';' "$FILE"
    echo "  ✓ Added storage import"
fi

# Add crypto import if not present
if ! grep -q "import crypto from.*webCrypto" "$FILE"; then
    sed -i '1i import crypto from '"'"'../crypto/webCrypto.js'"'"';' "$FILE"
    echo "  ✓ Added crypto import"
fi

# Fix encryption imports to be async-aware
sed -i 's/decrypt(\(.*\))/await decrypt(\1)/g' "$FILE"
sed -i 's/encrypt(\(.*\))/await encrypt(\1)/g' "$FILE"

echo "✅ InboxView.js updated"
