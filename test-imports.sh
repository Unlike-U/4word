#!/bin/bash

echo "🧪 Testing Import Paths..."
echo ""

# Check for common import issues
ERRORS=0

echo "1️⃣  Checking for CryptoJS imports (should be 0)..."
CRYPTOJS_COUNT=$(find src/js -name "*.js" -type f -exec grep -l "crypto-js" {} \; | wc -l)
if [ "$CRYPTOJS_COUNT" -eq 0 ]; then
    echo "  ✅ No CryptoJS imports found"
else
    echo "  ❌ Found $CRYPTOJS_COUNT files still importing CryptoJS:"
    find src/js -name "*.js" -type f -exec grep -l "crypto-js" {} \;
    ((ERRORS++))
fi
echo ""

echo "2️⃣  Checking for broken relative paths..."
# Check for common mistakes like ../../crypto when it should be ../crypto
if find src/js -name "*.js" -type f -exec grep -l "\.\./\.\./crypto" {} \; | grep -q .; then
    echo "  ⚠️  Found potentially incorrect paths:"
    find src/js -name "*.js" -type f -exec grep -l "\.\./\.\./crypto" {} \;
    ((ERRORS++))
else
    echo "  ✅ No obvious path issues"
fi
echo ""

echo "3️⃣  Checking for missing .js extensions..."
MISSING_EXT=$(find src/js -name "*.js" -type f -exec grep -E "from ['\"]\.\.?/[^'\"]*[^.js]['\"]" {} \; | wc -l)
if [ "$MISSING_EXT" -eq 0 ]; then
    echo "  ✅ All imports have .js extensions"
else
    echo "  ⚠️  Found $MISSING_EXT potential missing extensions"
fi
echo ""

echo "4️⃣  Checking for duplicate imports..."
find src/js -name "*.js" -type f | while read -r file; do
    DUPES=$(grep "^import" "$file" | sort | uniq -d)
    if [ -n "$DUPES" ]; then
        echo "  ⚠️  Duplicate imports in $(basename $file):"
        echo "$DUPES"
        ((ERRORS++))
    fi
done
echo ""

echo "5️⃣  Listing all import statements..."
echo "  WebCrypto imports:"
grep -r "import.*webCrypto" src/js --include="*.js" | sed 's/^/    /'
echo ""
echo "  Steganography imports:"
grep -r "import.*steganography" src/js --include="*.js" | sed 's/^/    /'
echo ""
echo "  Storage imports:"
grep -r "import.*indexedDB\|import storage" src/js --include="*.js" | sed 's/^/    /'
echo ""
echo "  Validation imports:"
grep -r "import.*validation" src/js --include="*.js" | sed 's/^/    /'
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All import tests passed!"
    exit 0
else
    echo "⚠️  Found $ERRORS potential issues"
    exit 1
fi
