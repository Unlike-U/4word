#!/bin/bash

echo "🔍 Validating Import Statements..."
echo ""

ERRORS=0

# Function to check import syntax
check_import_syntax() {
    local file="$1"
    local line_num=0
    
    while IFS= read -r line; do
        ((line_num++))
        
        # Check for import statements
        if echo "$line" | grep -q "^import"; then
            # Check for missing .js in relative imports
            if echo "$line" | grep -qE "from ['\"](\./|\.\./)" && ! echo "$line" | grep -q "\.js['\"]"; then
                echo "  ⚠️  Line $line_num: Missing .js extension"
                echo "      $line"
                ((ERRORS++))
            fi
            
            # Check for wrong destructuring (should use default import)
            if echo "$line" | grep -q "import { crypto }\|import { stego }\|import { storage }"; then
                echo "  ⚠️  Line $line_num: Should use default import"
                echo "      $line"
                echo "      Suggestion: import crypto from '...' (not { crypto })"
                ((ERRORS++))
            fi
        fi
    done < "$file"
}

echo "Checking JavaScript files..."
echo ""

find src/js -name "*.js" -type f | while read -r file; do
    echo "📄 $(basename $file)"
    check_import_syntax "$file"
done

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All imports validated successfully!"
else
    echo "⚠️  Found $ERRORS potential issues"
fi
