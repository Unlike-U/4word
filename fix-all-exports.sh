#!/bin/bash

echo "🔧 Fixing all module exports..."
echo ""

# ============================================
# Fix webCrypto.js
# ============================================
echo "1️⃣ Fixing webCrypto.js..."

cat > src/js/crypto/webCrypto.js << 'EOF'
/**
 * 4Word Web Crypto API Module
 */

class SecureCrypto {
  constructor() {
    this.subtle = window.crypto.subtle;
    this.SALT_LENGTH = 16;
    this.IV_LENGTH = 12;
    this.KEY_LENGTH = 256;
    this.ITERATIONS = 600000;
  }

  getRandomBytes(length) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }

  async deriveKey(password, salt = null) {
    if (!salt) {
      salt = this.getRandomBytes(this.SALT_LENGTH);
    }

    const passwordBuffer = new TextEncoder().encode(password);
    
    const baseKey = await this.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await this.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );

    return { key: derivedKey, salt };
  }

  async encrypt(plaintext, password) {
    try {
      const { key, salt } = await this.deriveKey(password);
      const iv = this.getRandomBytes(this.IV_LENGTH);
      const plaintextBuffer = new TextEncoder().encode(plaintext);

      const ciphertext = await this.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        key,
        plaintextBuffer
      );

      const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

      return {
        encrypted: this.arrayBufferToBase64(combined),
        timestamp: Date.now(),
        algorithm: 'AES-256-GCM',
        iterations: this.ITERATIONS
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decrypt(encryptedData, password) {
    try {
      const combined = this.base64ToArrayBuffer(
        typeof encryptedData === 'string' ? encryptedData : encryptedData.encrypted
      );

      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const ciphertext = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

      const { key } = await this.deriveKey(password, salt);

      const decrypted = await this.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }

  async doubleEncrypt(plaintext, password1, password2) {
    const firstLayer = await this.encrypt(plaintext, password1);
    const secondLayer = await this.encrypt(firstLayer.encrypted, password2);
    return { ...secondLayer, layers: 2, algorithm: '2DE-AES-256-GCM' };
  }

  async doubleDecrypt(encryptedData, password1, password2) {
    const firstDecrypt = await this.decrypt(encryptedData, password2);
    return await this.decrypt(firstDecrypt, password1);
  }

  generateSecurePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomValues = this.getRandomBytes(length);
    return Array.from(randomValues).map(byte => charset[byte % charset.length]).join('');
  }

  async hash(data) {
    const buffer = new TextEncoder().encode(data);
    const hashBuffer = await this.subtle.digest('SHA-256', buffer);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// Export singleton
const cryptoInstance = new SecureCrypto();
export default cryptoInstance;
EOF

echo "   ✅ webCrypto.js fixed"

# ============================================
# Fix steganography.js
# ============================================
echo "2️⃣ Fixing steganography.js..."

cat > src/js/crypto/steganography.js << 'EOF'
/**
 * 4Word Advanced Steganography Module
 */

import crypto from './webCrypto.js';

class AdvancedSteganography {
  constructor() {
    this.SIGNATURE = 'FW';
    this.VERSION = 1;
  }

  chaosSequence(seed, length) {
    const sequence = [];
    let x = this.seedToFloat(seed);
    const r = 3.99;
    for (let i = 0; i < length; i++) {
      x = r * x * (1 - x);
      sequence.push(x);
    }
    return sequence;
  }

  seedToFloat(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }

  async embedMessage(imageFile, message, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const encrypted = await crypto.encrypt(message, password);
        const payload = JSON.stringify(encrypted);
        const header = `${this.SIGNATURE}${this.VERSION}${payload.length.toString().padStart(8, '0')}`;
        const fullData = header + payload;
        
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            const chaosSeq = this.chaosSequence(password, pixels.length / 4);
            const pixelIndices = chaosSeq
              .map((val, idx) => ({ val, idx }))
              .sort((a, b) => a.val - b.val)
              .map(item => item.idx);

            const capacity = Math.floor(pixels.length / 4) * 3;
            if (fullData.length * 8 > capacity) {
              reject(new Error('Image too small for message'));
              return;
            }

            let bitIndex = 0;
            for (const char of fullData) {
              const charCode = char.charCodeAt(0);
              for (let bit = 7; bit >= 0; bit--) {
                const pixelIndex = pixelIndices[Math.floor(bitIndex / 3)];
                const colorChannel = (bitIndex % 3);
                const pixelByte = pixelIndex * 4 + colorChannel;
                pixels[pixelByte] = (pixels[pixelByte] & 0xFE) | ((charCode >> bit) & 1);
                bitIndex++;
              }
            }

            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
              resolve({
                blob,
                filename: `4word_stego_${Date.now()}.png`,
                originalSize: imageFile.size,
                newSize: blob.size,
                messageLength: message.length
              });
            }, 'image/png');
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(error);
      }
    });
  }

  async extractMessage(imageFile, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            const chaosSeq = this.chaosSequence(password, pixels.length / 4);
            const pixelIndices = chaosSeq
              .map((val, idx) => ({ val, idx }))
              .sort((a, b) => a.val - b.val)
              .map(item => item.idx);

            let bitIndex = 0;
            const readChars = (count) => {
              let result = '';
              for (let i = 0; i < count; i++) {
                let charCode = 0;
                for (let bit = 7; bit >= 0; bit--) {
                  const pixelIndex = pixelIndices[Math.floor(bitIndex / 3)];
                  const colorChannel = bitIndex % 3;
                  const pixelByte = pixelIndex * 4 + colorChannel;
                  charCode |= (pixels[pixelByte] & 1) << bit;
                  bitIndex++;
                }
                result += String.fromCharCode(charCode);
              }
              return result;
            };

            const header = readChars(11);
            if (!header.startsWith(this.SIGNATURE)) {
              reject(new Error('No hidden message found or wrong password'));
              return;
            }

            const messageLength = parseInt(header.substring(3, 11));
            if (isNaN(messageLength) || messageLength <= 0) {
              reject(new Error('Corrupted stego data'));
              return;
            }

            const encryptedPayload = readChars(messageLength);
            const encryptedObj = JSON.parse(encryptedPayload);
            const decrypted = await crypto.decrypt(encryptedObj, password);
            
            resolve({
              message: decrypted,
              extractedAt: Date.now(),
              algorithm: encryptedObj.algorithm
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(new Error(`Extraction failed: ${error.message}`));
      }
    });
  }

  async getImageCapacity(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const pixels = img.width * img.height;
          const bytesCapacity = Math.floor(pixels * 3 / 8);
          const charsCapacity = bytesCapacity - 11;
          resolve({
            width: img.width,
            height: img.height,
            totalPixels: pixels,
            maxMessageBytes: bytesCapacity,
            maxMessageChars: charsCapacity,
            recommendedMaxChars: Math.floor(charsCapacity * 0.8)
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }
}

// Export singleton
const stegoInstance = new AdvancedSteganography();
export default stegoInstance;
EOF

echo "   ✅ steganography.js fixed"

# ============================================
# Fix indexedDB.js
# ============================================
echo "3️⃣ Fixing indexedDB.js..."

cat > src/js/storage/indexedDB.js << 'EOF'
/**
 * 4Word IndexedDB Storage
 */

import crypto from '../crypto/webCrypto.js';

class SecureStorage {
  constructor() {
    this.dbName = '4WordDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('type', 'type', { unique: false });
          messageStore.createIndex('hash', 'hash', { unique: true });
        }
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'address' });
          contactStore.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveMessage(message, masterPassword) {
    if (!this.db) await this.init();
    const serialized = JSON.stringify(message);
    const encrypted = await crypto.encrypt(serialized, masterPassword);
    const hash = await crypto.hash(serialized);
    const messageObj = {
      encrypted: encrypted.encrypted,
      timestamp: Date.now(),
      type: message.type || 'text',
      hash: hash,
      metadata: { algorithm: encrypted.algorithm, layers: message.encryption?.layers || 1 }
    };
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(messageObj);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(masterPassword, limit = 100) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const messages = [];
      let count = 0;
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          try {
            const decrypted = await crypto.decrypt(cursor.value.encrypted, masterPassword);
            const message = JSON.parse(decrypted);
            messages.push({ id: cursor.value.id, ...message, storedAt: cursor.value.timestamp });
            count++;
            cursor.continue();
          } catch (error) {
            cursor.continue();
          }
        } else {
          resolve(messages);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStats() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        resolve({
          messageCount: countRequest.result,
          dbName: this.dbName,
          version: this.version
        });
      };
      countRequest.onerror = () => reject(countRequest.error);
    });
  }
}

// Export singleton
const storageInstance = new SecureStorage();
export default storageInstance;
EOF

echo "   ✅ indexedDB.js fixed"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ All exports fixed!                ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Test now: http://localhost:9000/quick-test.html"
