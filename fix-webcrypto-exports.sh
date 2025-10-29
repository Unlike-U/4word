#!/bin/bash

FILE="src/js/crypto/webCrypto.js"

echo "🔧 Fixing webCrypto.js exports..."

# Backup
cp "$FILE" "${FILE}.backup"

# Make sure it has both default and named exports
cat >> "$FILE" << 'EOF'

// Named export for destructuring
export { cryptoInstance as crypto };
EOF

echo "✅ Added named export to webCrypto.js"
