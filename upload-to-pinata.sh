#!/bin/bash

echo "📌 Uploading to Pinata (Web Interface)"
echo "======================================"

# Ensure build exists
if [ ! -d "ipfs-build" ]; then
    ./build-for-ipfs.sh
fi

# Create tarball
cd ipfs-build
tar -czf ../4word-ipfs.tar.gz .
cd ..

echo ""
echo "✅ Created: 4word-ipfs.tar.gz"
echo ""
echo "═══════════════════════════════════════"
echo "📤 UPLOAD INSTRUCTIONS:"
echo "═══════════════════════════════════════"
echo ""
echo "1. Go to: https://app.pinata.cloud/pinmanager"
echo "2. Sign up (free - no credit card)"
echo "3. Click 'Upload' button"
echo "4. Select 'File'"
echo "5. Choose: 4word-ipfs.tar.gz"
echo "6. Wait for upload to complete"
echo "7. Copy the CID (IPFS hash) shown"
echo ""
echo "Then update your Unstoppable Domain with that CID!"
echo ""

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "https://app.pinata.cloud/pinmanager" 2>/dev/null &
elif command -v open &> /dev/null; then
    open "https://app.pinata.cloud/pinmanager" 2>/dev/null &
fi

echo "Opening browser..."
echo ""
