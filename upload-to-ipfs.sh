#!/bin/bash

echo "📦 Uploading 4Word to IPFS via Web3.Storage"
echo "==========================================="

# Check if build exists
if [ ! -d "ipfs-build" ]; then
    echo "❌ Build directory not found!"
    echo "Run: ./build-for-ipfs.sh first"
    exit 1
fi

# Install w3cli (Web3.Storage CLI)
echo "Installing Web3.Storage CLI..."
npm install -g @web3-storage/w3cli

# Create account (opens browser)
echo ""
echo "Creating Web3.Storage account..."
echo "(This will open your browser for login)"
w3 login

# Upload directory
echo ""
echo "Uploading ipfs-build/ to IPFS..."
cd ipfs-build
w3 put . --name "4word-v1.0.0"

echo ""
echo "✅ Upload complete!"
echo ""
echo "Your IPFS CID will be displayed above."
echo "Copy it and use it to update your Unstoppable Domain."
echo ""
