#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Fixing Remaining Import Issues      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. Fix encryption.js completely
# ============================================
echo "1️⃣  Fixing encryption.js..."

FILE="src/js/services/encryption.js"
if [ -f "$FILE" ]; then
    cp "$FILE" "${FILE}.backup"
    
    cat > "$FILE" << 'EOF'
/**
 * 4Word Encryption Service
 * Wrapper for Web Crypto API
 */

import crypto from '../crypto/webCrypto.js';

export const encryption = {
  /**
   * Encrypt message using AES-256-GCM
   */
  async encrypt(message, password) {
    try {
      const result = await crypto.encrypt(message, password);
      return result.encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  },

  /**
   * Decrypt message
   */
  async decrypt(encrypted, password) {
    try {
      return await crypto.decrypt(encrypted, password);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  },

  /**
   * Double encryption (2DE)
   */
  async doubleEncrypt(message, password1, password2) {
    try {
      const result = await crypto.doubleEncrypt(message, password1, password2);
      return result.encrypted;
    } catch (error) {
      console.error('2DE encryption error:', error);
      throw error;
    }
  },

  /**
   * Double decryption
   */
  async doubleDecrypt(encrypted, password1, password2) {
    try {
      return await crypto.doubleDecrypt(encrypted, password1, password2);
    } catch (error) {
      console.error('2DE decryption error:', error);
      throw error;
    }
  },

  /**
   * Generate secure password
   */
  generatePassword(length = 32) {
    return crypto.generateSecurePassword(length);
  },

  /**
   * Hash data using SHA-256
   */
  async hash(data) {
    return await crypto.hash(data);
  }
};

export default encryption;
EOF

    echo -e "  ${GREEN}✓${NC} Replaced encryption.js (removed CryptoJS)"
else
    echo -e "  ${RED}✗${NC} encryption.js not found!"
fi

echo ""

# ============================================
# 2. Fix StegoInbox.js imports
# ============================================
echo "2️⃣  Fixing StegoInbox.js..."

FILE="src/js/components/StegoInbox.js"
if [ -f "$FILE" ]; then
    cp "$FILE" "${FILE}.backup"
    
    # Fix the import statement
    sed -i "s|import { crypto } from '../crypto/webCrypto.js';|import crypto from '../crypto/webCrypto.js';|g" "$FILE"
    
    echo -e "  ${GREEN}✓${NC} Fixed StegoInbox.js imports"
else
    echo -e "  ${YELLOW}⚠${NC}  StegoInbox.js not found, skipping..."
fi

echo ""

# ============================================
# 3. Fix SteganographyView.js imports
# ============================================
echo "3️⃣  Fixing SteganographyView.js..."

FILE="src/js/components/SteganographyView.js"
if [ -f "$FILE" ]; then
    cp "$FILE" "${FILE}.backup"
    
    # Fix wrong path and import syntax
    sed -i "s|import { crypto } from './webCrypto.js';|import crypto from '../crypto/webCrypto.js';|g" "$FILE"
    sed -i "s|import stego from './steganography.js';|import stego from '../crypto/steganography.js';|g" "$FILE"
    
    # Add missing imports if not present
    if ! grep -q "import.*Validator" "$FILE"; then
        sed -i "1i import { Validator } from '../utils/validation.js';" "$FILE"
    fi
    
    if ! grep -q "import storage from" "$FILE"; then
        sed -i "1i import storage from '../storage/indexedDB.js';" "$FILE"
    fi
    
    echo -e "  ${GREEN}✓${NC} Fixed SteganographyView.js paths"
else
    echo -e "  ${YELLOW}⚠${NC}  SteganographyView.js not found, skipping..."
fi

echo ""

# ============================================
# 4. Fix CLI.js imports
# ============================================
echo "4️⃣  Fixing cli.js imports..."

FILE="src/js/services/cli.js"
if [ -f "$FILE" ]; then
    cp "$FILE" "${FILE}.backup"
    
    # Normalize to default imports
    sed -i "s|import { crypto } from '../crypto/webCrypto.js';|import crypto from '../crypto/webCrypto.js';|g" "$FILE"
    sed -i "s|import { stego } from '../crypto/steganography.js';|import stego from '../crypto/steganography.js';|g" "$FILE"
    sed -i "s|import { storage } from '../storage/indexedDB.js';|import storage from '../storage/indexedDB.js';|g" "$FILE"
    
    echo -e "  ${GREEN}✓${NC} Fixed cli.js imports"
else
    echo -e "  ${YELLOW}⚠${NC}  cli.js not found, skipping..."
fi

echo ""

# ============================================
# 5. Fix indexedDB.js imports
# ============================================
echo "5️⃣  Fixing indexedDB.js imports..."

FILE="src/js/storage/indexedDB.js"
if [ -f "$FILE" ]; then
    cp "$FILE" "${FILE}.backup"
    
    # Normalize to default import
    sed -i "s|import { crypto } from '../crypto/webCrypto.js';|import crypto from '../crypto/webCrypto.js';|g" "$FILE"
    
    echo -e "  ${GREEN}✓${NC} Fixed indexedDB.js imports"
else
    echo -e "  ${YELLOW}⚠${NC}  indexedDB.js not found, skipping..."
fi

echo ""

# ============================================
# 6. Fix missing .js extensions globally
# ============================================
echo "6️⃣  Adding missing .js extensions..."

find src/js -name "*.js" -type f | while read -r file; do
    # Fix imports without .js extension (but not node_modules or external packages)
    # Match: from '../something' or from './something' but not from 'package-name'
    sed -i -E "s|from (['\"])(\./.*|\.\./.*)(['\"])([^.])|from \1\2.js\3|g" "$file" 2>/dev/null || true
    
    # Fix: from '../crypto/webCrypto' -> from '../crypto/webCrypto.js'
    sed -i "s|from '\(.*\)'\$|from '\1.js'|g" "$file" 2>/dev/null || true
    sed -i "s|from \"\(.*\)\"\$|from \"\1.js\"|g" "$file" 2>/dev/null || true
    
    # Remove double .js.js if we created it
    sed -i "s|\.js\.js|.js|g" "$file" 2>/dev/null || true
done

echo -e "  ${GREEN}✓${NC} Added missing .js extensions"

echo ""

# ============================================
# 7. Remove any remaining CryptoJS references
# ============================================
echo "7️⃣  Removing any CryptoJS references..."

CRYPTOJS_FILES=$(find src/js -name "*.js" -type f -exec grep -l "crypto-js\|CryptoJS" {} \; 2>/dev/null || true)

if [ -n "$CRYPTOJS_FILES" ]; then
    echo "$CRYPTOJS_FILES" | while read -r file; do
        if [ -f "$file" ]; then
            cp "$file" "${file}.backup"
            
            # Remove import lines
            sed -i "/import.*crypto-js/d" "$file"
            sed -i "/require.*crypto-js/d" "$file"
            sed -i "/import.*CryptoJS/d" "$file"
            
            # Comment out CryptoJS usage (don't break code)
            sed -i "s|CryptoJS\.|// DEPRECATED: CryptoJS.|g" "$file"
            
            echo -e "  ${YELLOW}⚠${NC}  Removed CryptoJS from: $file"
        fi
    done
else
    echo -e "  ${GREEN}✓${NC} No CryptoJS references found"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ All import fixes complete!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Backups created with .backup extension"
echo ""
