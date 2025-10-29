#!/bin/bash
echo "📦 Building 4Word for production..."

mkdir -p dist

# Copy source files
cp -r src/* dist/

# Minify if needed (optional)
# npm install -g terser
# find dist/js -name "*.js" -exec terser {} -o {} \;

echo "✅ Built to dist/"
echo "Deploy dist/ to your web server with HTTPS"
