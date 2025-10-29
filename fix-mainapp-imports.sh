#!/bin/bash

# Fix MainApp.js imports

FILE="src/js/components/MainApp.js"

if [ ! -f "$FILE" ]; then
    echo "❌ $FILE not found"
    exit 1
fi

echo "🔧 Updating MainApp.js imports..."

# Backup
cp "$FILE" "${FILE}.backup"

# Add storage import for initialization
if ! grep -q "import storage from" "$FILE"; then
    sed -i '1i import storage from '"'"'../storage/indexedDB.js'"'"';' "$FILE"
    echo "  ✓ Added storage import"
fi

# Add initialization code if not present
if ! grep -q "storage.init()" "$FILE"; then
    # Find the init or constructor and add storage init
    sed -i '/constructor.*{/a \    this.initStorage();' "$FILE"
    
    # Add initStorage method before last }
    sed -i '$i\  async initStorage() {\n    try {\n      await storage.init();\n      console.log('"'"'✅ Storage initialized'"'"');\n    } catch (error) {\n      console.error('"'"'Storage init failed:'"'"', error);\n    }\n  }\n' "$FILE"
    
    echo "  ✓ Added storage initialization"
fi

echo "✅ MainApp.js updated"
