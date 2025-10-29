#!/bin/bash

echo "📥 Downloading 4word.zip from Server"
echo "===================================="
echo ""

# Configuration
SERVER="138.2.143.240"
USER="ubuntu"
REMOTE_PATH="/home/ubuntu/www3/4word/4word.zip"
LOCAL_PATH="./4word.zip"

# SSH key path (update this to your key location)
SSH_KEY="$HOME/.ssh/id_rsa"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "⚠️  SSH key not found: $SSH_KEY"
    echo ""
    read -p "Enter path to your SSH key: " SSH_KEY
fi

# Check if key has correct permissions
if [ -f "$SSH_KEY" ]; then
    chmod 600 "$SSH_KEY"
fi

echo "Settings:"
echo "  Server: $USER@$SERVER"
echo "  Remote: $REMOTE_PATH"
echo "  Local:  $LOCAL_PATH"
echo "  SSH Key: $SSH_KEY"
echo ""

# Check if file exists on server
echo "Checking if file exists on server..."
if ssh -i "$SSH_KEY" "$USER@$SERVER" "test -f $REMOTE_PATH"; then
    SIZE=$(ssh -i "$SSH_KEY" "$USER@$SERVER" "du -h $REMOTE_PATH | cut -f1")
    echo "✅ File found on server (Size: $SIZE)"
else
    echo "❌ File not found on server: $REMOTE_PATH"
    echo ""
    echo "Creating it now on server..."
    ssh -i "$SSH_KEY" "$USER@$SERVER" << 'REMOTE_SCRIPT'
cd ~/www3/4word
if [ -d "ipfs-build" ]; then
    cd ipfs-build
    zip -r ../4word.zip .
    echo "✅ Created 4word.zip"
else
    echo "❌ ipfs-build directory not found!"
    echo "Run ./build-for-ipfs.sh on server first"
    exit 1
fi
REMOTE_SCRIPT
fi

echo ""
echo "Starting download..."
echo ""

# Download with rsync (shows progress)
rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    "$USER@$SERVER:$REMOTE_PATH" \
    "$LOCAL_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "✅ DOWNLOAD COMPLETE!"
    echo "═══════════════════════════════════════"
    echo ""
    echo "File saved to: $LOCAL_PATH"
    echo "Size: $(du -h $LOCAL_PATH | cut -f1)"
    echo ""
    echo "Next steps:"
    echo "  1. Unzip: unzip 4word.zip"
    echo "  2. Upload to Pinata/IPFS"
    echo "  3. Get CID"
    echo "  4. Update Unstoppable Domain"
    echo ""
else
    echo ""
    echo "❌ Download failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check SSH key path: $SSH_KEY"
    echo "  2. Test connection: ssh -i $SSH_KEY $USER@$SERVER"
    echo "  3. Verify file exists: ssh -i $SSH_KEY $USER@$SERVER ls -lh $REMOTE_PATH"
    echo ""
fi
