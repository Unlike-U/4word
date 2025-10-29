/**
 * 4Word IndexedDB Storage Module
 * Secure, encrypted local storage for messages
 */

import crypto from '../crypto/webCrypto.js';

export class SecureStorage {
  constructor() {
    this.dbName = '4WordDB';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize database
   */
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

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('type', 'type', { unique: false });
          messageStore.createIndex('hash', 'hash', { unique: true });
        }

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { 
            keyPath: 'address' 
          });
          contactStore.createIndex('name', 'name', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save encrypted message
   */
  async saveMessage(message, masterPassword) {
    if (!this.db) await this.init();

    // Encrypt entire message object
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
   * Get all messages (decrypted)
   */
  async getMessages(masterPassword, limit = 100) {
    if (!this.db) await this.init();

    return new Promise(async (resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Newest first

      const messages = [];
      let count = 0;

      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          try {
            const decrypted = await crypto.decrypt(
              cursor.value.encrypted,
              masterPassword
            );
            const message = JSON.parse(decrypted);
            messages.push({
              id: cursor.value.id,
              ...message,
              storedAt: cursor.value.timestamp
            });
            count++;
            cursor.continue();
          } catch (error) {
            // Skip corrupted messages
            cursor.continue();
          }
        } else {
          resolve(messages);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Search messages
   */
  async searchMessages(query, masterPassword) {
    const allMessages = await this.getMessages(masterPassword, 1000);
    const lowerQuery = query.toLowerCase();
    
    return allMessages.filter(msg => 
      (msg.content && msg.content.toLowerCase().includes(lowerQuery)) ||
      (msg.recipientAddress && msg.recipientAddress.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Delete message
   */
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

  /**
   * Clear all messages (with confirmation)
   */
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

  /**
   * Get storage statistics
   */
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

export const storage = new SecureStorage();
