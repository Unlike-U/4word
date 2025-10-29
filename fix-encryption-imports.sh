#!/bin/bash

# Fix encryption.js to use Web Crypto API

FILE="src/js/services/encryption.js"

if [ ! -f "$FILE" ]; then
    echo "❌ $FILE not found"
    exit 1
fi

echo "🔧 Updating encryption.js..."

# Backup
cp "$FILE" "${FILE}.backup"

# Replace entire file content
cat > "$FILE" << 'EOF'
/**
 * 4Word Encryption Service
 * Wrapper for Web Crypto API
 */

import crypto from '../crypto/webCrypto.js';

export const encryption = {
  async encrypt(message, password) {
    const result = await crypto.encrypt(message, password);
    return result.encrypted;
  },

  async decrypt(encrypted, password) {
    return await crypto.decrypt(encrypted, password);
  },

  async doubleEncrypt(message, password1, password2) {
    const result = await crypto.doubleEncrypt(message, password1, password2);
    return result.encrypted;
  },

  async doubleDecrypt(encrypted, password1, password2) {
    return await crypto.doubleDecrypt(encrypted, password1, password2);
  },

  generatePassword(length = 32) {
    return crypto.generateSecurePassword(length);
  },

  async hash(data) {
    return await crypto.hash(data);
  }
};

export default encryption;
EOF

echo "✅ encryption.js updated"
echo "📦 Backup saved: ${FILE}.backup"
