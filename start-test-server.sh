#!/bin/bash

echo "🚀 Starting 4Word Test Server..."
echo ""

cd ~/www3/4word/src

echo "Server starting at:"
echo "  Local:   http://localhost:9000"
echo "  Network: http://$(hostname -I | awk '{print $1}'):9000"
echo ""
echo "Test pages:"
echo "  Main app: http://localhost:9000/index.html"
echo "  Tests:    http://localhost:9000/test.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 -m http.server 9000
