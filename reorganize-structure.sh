#!/bin/bash
# File: reorganize-structure.sh

cd ~/www3/4word

echo "🔧 Reorganizing 4Word directory structure..."

# Create proper directory structure in /src/js/
mkdir -p src/js/crypto
mkdir -p src/js/storage
mkdir -p src/js/lib

# Move misplaced files to correct locations
echo "📦 Moving files to correct locations..."

# Move crypto files
if [ -f "src/crypto/webCrypto.js" ]; then
    mv src/crypto/webCrypto.js src/js/crypto/webCrypto.js
    echo "✅ Moved webCrypto.js"
fi

# Move storage files
if [ -f "src/storage/indexedDB.js" ]; then
    mv src/storage/indexedDB.js src/js/storage/indexedDB.js
    echo "✅ Moved indexedDB.js"
fi

# Move utils/validation.js
if [ -f "src/utils/validation.js" ]; then
    mv src/utils/validation.js src/js/utils/validation.js
    echo "✅ Moved validation.js"
fi

# Move CLI
if [ -f "src/cli/cli.js" ]; then
    mv src/cli/cli.js src/js/services/cli.js
    echo "✅ Moved cli.js"
fi

# Move CSS file to styles
if [ -f "src/components/StegoInbox.css" ]; then
    mv src/components/StegoInbox.css src/styles/StegoInbox.css
    echo "✅ Moved StegoInbox.css"
fi

# Fix typo: StegoInbox.jx -> StegoInbox.js
if [ -f "src/js/components/StegoInbox.jx" ]; then
    mv src/js/components/StegoInbox.jx src/js/components/StegoInbox.js
    echo "✅ Fixed StegoInbox.jx -> StegoInbox.js"
fi

# Remove empty directories
rmdir src/crypto 2>/dev/null
rmdir src/storage 2>/dev/null
rmdir src/utils 2>/dev/null
rmdir src/cli 2>/dev/null
rmdir src/components 2>/dev/null

echo "✅ Directory reorganization complete!"
echo ""
echo "📁 New structure:"
tree src -L 3 -I node_modules 2>/dev/null || find src -type f -name "*.js" -o -name "*.css" | sort
