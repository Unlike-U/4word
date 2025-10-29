#!/bin/bash

echo "🔧 Fixing IndexedDB async issue..."

cat > src/js/storage/indexedDB.js << 'EOF'
/**
 * 4Word IndexedDB Storage - Fixed async handling
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
          const messageStore = db.createObjectStore('messages', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('type', 'type', { unique: false });
          messageStore.createIndex('hash', 'hash', { unique: true });
        }
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { 
            keyPath: 'address' 
          });
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
      metadata: { 
        algorithm: encrypted.algorithm, 
        layers: message.encryption?.layers || 1 
      }
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(messageObj);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get messages - FIXED: Separate cursor iteration from async decryption
   */
  async getMessages(masterPassword, limit = 100) {
    if (!this.db) await this.init();

    // Step 1: Collect all encrypted messages (synchronously)
    const encryptedMessages = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const collected = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          collected.push({
            id: cursor.value.id,
            encrypted: cursor.value.encrypted,
            timestamp: cursor.value.timestamp,
            type: cursor.value.type,
            metadata: cursor.value.metadata
          });
          count++;
          cursor.continue(); // Safe - no async operations
        } else {
          resolve(collected);
        }
      };

      request.onerror = () => reject(request.error);
    });

    // Step 2: Decrypt all messages (asynchronously, outside transaction)
    const decryptedMessages = [];
    for (const encMsg of encryptedMessages) {
      try {
        const decrypted = await crypto.decrypt(encMsg.encrypted, masterPassword);
        const message = JSON.parse(decrypted);
        decryptedMessages.push({
          id: encMsg.id,
          ...message,
          storedAt: encMsg.timestamp
        });
      } catch (error) {
        // Skip corrupted/wrong password messages
        console.warn(`Failed to decrypt message ${encMsg.id}:`, error.message);
      }
    }

    return decryptedMessages;
  }

  async searchMessages(query, masterPassword) {
    const allMessages = await this.getMessages(masterPassword, 1000);
    const lowerQuery = query.toLowerCase();
    
    return allMessages.filter(msg => 
      (msg.content && msg.content.toLowerCase().includes(lowerQuery)) ||
      (msg.recipientAddress && msg.recipientAddress.toLowerCase().includes(lowerQuery))
    );
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

  async clearAllMessages() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.clear();
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

  // Bonus: Get all messages without decryption (for management)
  async getAllRaw(limit = 100) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const messages = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          messages.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(messages);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton
const storageInstance = new SecureStorage();
export default storageInstance;
EOF

echo "✅ Fixed indexedDB.js - async handling corrected"
echo ""
echo "Refresh your browser and run tests again!"
