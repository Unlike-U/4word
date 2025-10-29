#!/bin/bash

echo "🔧 Fixing all issues..."

# 1. Fix SASS darken() warnings
echo "Fixing SASS warnings..."
sed -i 's/darken(\$bg-input, 5%)/#e8eaed/g' src/styles/main.scss
sed -i 's/darken(\$border-color, 5%)/#d8dadd/g' src/styles/main.scss
sed -i 's/darken(\$danger, 10%)/#cc3026/g' src/styles/main.scss
sed -i 's/darken(\$warning, 20%)/#cc7a00/g' src/styles/main.scss

# 2. Clear localStorage message
echo ""
echo "⚠️  IMPORTANT: Open browser console (F12) and run:"
echo "   localStorage.clear(); location.reload();"
echo ""

echo "✅ SASS warnings fixed!"
echo ""
echo "Restart webpack: npm run dev"
