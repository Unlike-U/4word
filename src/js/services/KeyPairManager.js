/**
 * RSA KeyPair Manager for End-to-End Encryption
 */
class KeyPairManagerClass {
  constructor() {
    this.keyPairs = new Map();
    this.algorithm = {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    };
    
    // Check if Web Crypto API is available
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if Web Crypto API is supported
   * @returns {boolean}
   */
  checkSupport() {
    if (typeof window === 'undefined') {
      console.warn('Window object not available');
      return false;
    }
    
    if (!window.crypto) {
      console.warn('window.crypto not available');
      return false;
    }
    
    if (!window.crypto.subtle) {
      console.warn('window.crypto.subtle not available - requires HTTPS or localhost');
      return false;
    }
    
    return true;
  }

  /**
   * Generate a new RSA keypair for a user
   * @param {string} username - Username
   * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
   */
  async generateKeyPair(username) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported. Please use HTTPS or localhost.');
    }

    try {
      const keyPair = await window.crypto.subtle.generateKey(
        this.algorithm,
        true,
        ["encrypt", "decrypt"]
      );

      console.log(`Generated new keypair for ${username}`);
      
      this.keyPairs.set(username, keyPair);
      
      return keyPair;
    } catch (error) {
      console.error('KeyPair generation error:', error);
      throw new Error(`Failed to generate keypair: ${error.message}`);
    }
  }

  /**
   * Export public key to storable format
   * @param {CryptoKey} publicKey
   * @returns {Promise<string>} Base64 encoded public key
   */
  async exportPublicKey(publicKey) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return exportedAsBase64;
  }

  /**
   * Import public key from stored format
   * @param {string} base64Key - Base64 encoded public key
   * @returns {Promise<CryptoKey>}
   */
  async importPublicKey(base64Key) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    
    return await window.crypto.subtle.importKey(
      'spki',
      binaryKey,
      this.algorithm,
      true,
      ['encrypt']
    );
  }

  /**
   * Export private key to storable format (encrypted)
   * @param {CryptoKey} privateKey
   * @param {string} password - Password to encrypt the private key
   * @returns {Promise<string>} Encrypted base64 private key
   */
  async exportPrivateKey(privateKey, password) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    
    const encryptionKey = await this.deriveKeyFromPassword(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedKey = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      exported
    );
    
    const combined = new Uint8Array(iv.length + encryptedKey.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedKey), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Import private key from stored format (encrypted)
   * @param {string} encryptedBase64 - Encrypted base64 private key
   * @param {string} password - Password to decrypt the private key
   * @returns {Promise<CryptoKey>}
   */
  async importPrivateKey(encryptedBase64, password) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    try {
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encryptedKey = combined.slice(12);
      
      const decryptionKey = await this.deriveKeyFromPassword(password);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        decryptionKey,
        encryptedKey
      );
      
      return await window.crypto.subtle.importKey(
        'pkcs8',
        decrypted,
        this.algorithm,
        true,
        ['decrypt']
      );
    } catch (error) {
      console.error('Failed to import private key:', error);
      throw new Error('Invalid password or corrupted key');
    }
  }

  /**
   * Derive encryption key from password
   * @param {string} password
   * @returns {Promise<CryptoKey>}
   */
  async deriveKeyFromPassword(password) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('4word-salt-v1'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt message with recipient's public key
   * @param {string} message - Plain text message
   * @param {CryptoKey} recipientPublicKey - Recipient's public key
   * @returns {Promise<string>} Base64 encrypted message
   */
  async encryptMessage(message, recipientPublicKey) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      encoded
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Decrypt message with own private key
   * @param {string} encryptedMessage - Base64 encrypted message
   * @param {CryptoKey} privateKey - Own private key
   * @returns {Promise<string>} Decrypted message
   */
  async decryptMessage(encryptedMessage, privateKey) {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    try {
      const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Get cached keypair or load from storage
   * @param {string} username
   * @returns {Object|null}
   */
  getCachedKeyPair(username) {
    return this.keyPairs.get(username) || null;
  }

  /**
   * Cache keypair in memory
   * @param {string} username
   * @param {Object} keyPair
   */
  cacheKeyPair(username, keyPair) {
    this.keyPairs.set(username, keyPair);
  }

  /**
   * Clear cached keypairs (on logout)
   */
  clearCache() {
    this.keyPairs.clear();
  }
}

export const KeyPairManager = new KeyPairManagerClass();
export default KeyPairManager;
