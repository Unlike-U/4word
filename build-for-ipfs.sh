#!/bin/bash

echo "📦 Building 4Word for IPFS/Unstoppable Domains"
echo "=============================================="

# Create build directory
rm -rf ipfs-build
mkdir -p ipfs-build

# Copy source files
cp -r src/* ipfs-build/

# Create IPFS-specific index
cat > ipfs-build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4Word - Decentralized Secure Messaging</title>
    <meta name="description" content="Web3-Powered Secure Messaging - Private, Modular, Eternal">
    
    <!-- IPFS-specific meta -->
    <meta name="ipfs-gateway" content="true">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #00ff88;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .hero {
            text-align: center;
            padding: 60px 20px;
            background: rgba(0, 255, 136, 0.05);
            border-bottom: 2px solid #00ff88;
        }
        
        .hero h1 {
            font-size: 48px;
            margin-bottom: 16px;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        
        .hero p {
            font-size: 18px;
            color: #888;
            margin-bottom: 8px;
        }
        
        .badge {
            display: inline-block;
            background: rgba(0, 255, 136, 0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin: 4px;
            border: 1px solid #00ff88;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            flex: 1;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-top: 40px;
        }
        
        .card {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            padding: 24px;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 255, 136, 0.2);
            border-color: #00ff88;
        }
        
        .card h3 {
            color: #00ff88;
            margin-bottom: 12px;
            font-size: 20px;
        }
        
        .card p {
            color: #ccc;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
            transform: translateY(-2px);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 40px 0;
        }
        
        .feature {
            background: rgba(0, 255, 136, 0.05);
            padding: 16px;
            border-radius: 8px;
            border-left: 3px solid #00ff88;
        }
        
        .feature h4 {
            color: #00ff88;
            margin-bottom: 8px;
        }
        
        footer {
            background: #0a0a0a;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #2a2a2a;
            color: #666;
        }
        
        .status-bar {
            background: rgba(0, 255, 136, 0.1);
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .pulse {
            width: 12px;
            height: 12px;
            background: #00ff88;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🔐 4Word</h1>
        <p>Web3-Powered Secure Messaging</p>
        <p>Private • Modular • Eternal</p>
        <div style="margin-top: 16px;">
            <span class="badge">AES-256-GCM</span>
            <span class="badge">Steganography</span>
            <span class="badge">2DE</span>
            <span class="badge">IPFS</span>
            <span class="badge">Unstoppable</span>
        </div>
    </div>

    <div class="container">
        <div class="status-bar">
            <div class="pulse"></div>
            <span>Hosted on IPFS - Decentralized & Censorship Resistant</span>
        </div>

        <div class="features">
            <div class="feature">
                <h4>🔒 Military-Grade Crypto</h4>
                <p>AES-256-GCM encryption with 600K PBKDF2 iterations</p>
            </div>
            <div class="feature">
                <h4>🖼️ Steganography</h4>
                <p>Hide encrypted messages inside images</p>
            </div>
            <div class="feature">
                <h4>💾 Local Storage</h4>
                <p>Encrypted IndexedDB for offline access</p>
            </div>
            <div class="feature">
                <h4>🌐 Web3 Native</h4>
                <p>Built for decentralized web</p>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🧪 Test Suite</h3>
                <p>Run comprehensive tests to verify all cryptographic functions are working correctly.</p>
                <a href="./quick-test.html" class="btn">Run Tests</a>
            </div>

            <div class="card">
                <h3>📝 Full Test Page</h3>
                <p>Interactive testing interface with detailed output and controls.</p>
                <a href="./test.html" class="btn">Open Tests</a>
            </div>

            <div class="card">
                <h3>🔧 Testing Tools</h3>
                <p>Quick tools for encryption, password generation, and validation.</p>
                <a href="./testing-tools.html" class="btn">Open Tools</a>
            </div>
        </div>

        <div style="margin-top: 60px; padding: 24px; background: rgba(0, 255, 136, 0.05); border-radius: 12px; border: 1px solid #2a2a2a;">
            <h2 style="margin-bottom: 16px;">🚀 Getting Started</h2>
            <ol style="color: #ccc; line-height: 2; padding-left: 24px;">
                <li>Run the test suite to verify everything works</li>
                <li>Try encrypting/decrypting messages</li>
                <li>Test steganography with an image</li>
                <li>Explore the testing tools</li>
                <li>Build your secure messaging app!</li>
            </ol>
        </div>

        <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>View on GitHub: <a href="https://github.com/Unlike-U/4word" style="color: #00ff88;">Unlike-U/4word</a></p>
        </div>
    </div>

    <footer>
        <p>4Word v1.0.0 - MIT License</p>
        <p>Hosted on IPFS via Unstoppable Domains</p>
        <p style="margin-top: 8px; font-size: 12px;">
            Powered by Web Crypto API • IndexedDB • IPFS
        </p>
    </footer>

    <script>
        // Display IPFS info if available
        if (window.location.protocol === 'ipfs:' || window.location.hostname.includes('ipfs')) {
            console.log('🌐 Running on IPFS!');
            console.log('CID:', window.location.pathname.split('/')[2] || 'Unknown');
        }
    </script>
</body>
</html>
EOF

echo "✅ Created IPFS-optimized index.html"

# Create _redirects file for IPFS gateways
cat > ipfs-build/_redirects << 'EOF'
/*    /index.html   200
EOF

# Create ipfs.json manifest
cat > ipfs-build/ipfs.json << 'EOF'
{
  "name": "4Word",
  "description": "Web3-Powered Secure Messaging - Private, Modular, Eternal",
  "version": "1.0.0",
  "author": "Unlike-U",
  "license": "MIT",
  "repository": "https://github.com/Unlike-U/4word",
  "keywords": ["encryption", "web3", "messaging", "crypto", "ipfs", "unstoppable-domains"],
  "ipfs": true
}
EOF

# Create package info for IPFS
cat > ipfs-build/package.json << 'EOF'
{
  "name": "4word",
  "version": "1.0.0",
  "description": "Web3-Powered Secure Messaging",
  "type": "module",
  "homepage": "https://4word.crypto"
}
EOF

# Calculate total size
TOTAL_SIZE=$(du -sh ipfs-build | cut -f1)

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ IPFS Build Complete!             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📁 Build directory: ipfs-build/"
echo "📊 Total size: $TOTAL_SIZE"
echo ""
echo "Files ready for IPFS upload:"
ls -lh ipfs-build/ | tail -n +2
echo ""
echo "Next steps:"
echo "  1. Upload to IPFS (see options below)"
echo "  2. Get IPFS hash (CID)"
echo "  3. Update Unstoppable Domain records"
echo ""
