import CryptoJS from 'crypto-js';

/**
 * Advanced Encryption Service with Keypair Support
 */
export class EncryptionService {
  static #masterKey = null;

  // Generate RSA-like keypair (simplified for demo, use Web Crypto API in production)
  static async generateKeyPair() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKey),
        privateKey: JSON.stringify(privateKey)
      };
    } catch (error) {
      console.error('KeyPair generation failed:', error);
      // Fallback to simplified keypair
      return this.generateSimpleKeyPair();
    }
  }

  static generateSimpleKeyPair() {
    const privateKey = this.generateSecureKey(64);
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return {
      publicKey,
      privateKey
    };
  }

  // Generate secure random key
  static generateSecureKey(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash password using PBKDF2
  static hashPassword(password, salt = null) {
    if (!salt) {
      salt = CryptoJS.lib.WordArray.random(128/8).toString();
    }
    
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512/32,
      iterations: 10000
    }).toString();

    return {
      hash: hash,
      salt: salt,
      combined: `${salt}:${hash}`
    };
  }

  // Verify password
  static verifyPassword(password, combined) {
    const [salt, hash] = combined.split(':');
    const testHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512/32,
      iterations: 10000
    }).toString();
    
    return hash === testHash;
  }

  // AES-256 Encryption
  static encryptMessage(message, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  // AES-256 Decryption
  static decryptMessage(encrypted, key) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const message = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!message) {
        return '[Invalid Key]';
      }
      
      return message;
    } catch (error) {
      return '[Decryption Failed]';
    }
  }

  // Double Encryption (2DE)
  static encrypt2DE(message, key1, key2) {
    const first = this.encryptMessage(message, key1);
    if (!first) return null;
    
    const second = this.encryptMessage(first, key2);
    return second;
  }

  static decrypt2DE(encrypted, key1, key2) {
    const first = this.decryptMessage(encrypted, key2);
    if (first.includes('[Invalid') || first.includes('[Decryption')) {
      return first;
    }
    
    const second = this.decryptMessage(first, key1);
    return second;
  }

  // Keypair encryption for user messages
  static async encryptWithPublicKey(message, publicKeyJwk) {
    try {
      // For demo: use symmetric encryption with public key as password
      // In production, use actual RSA encryption
      const key = CryptoJS.SHA256(publicKeyJwk).toString();
      return this.encryptMessage(message, key);
    } catch (error) {
      console.error('Public key encryption failed:', error);
      return null;
    }
  }

  static async decryptWithPrivateKey(encrypted, privateKeyJwk) {
    try {
      // For demo: use symmetric decryption with private key
      const key = CryptoJS.SHA256(privateKeyJwk).toString();
      return this.decryptMessage(encrypted, key);
    } catch (error) {
      console.error('Private key decryption failed:', error);
      return '[Decryption Failed]';
    }
  }

  // Generate message signature
  static signMessage(message, privateKey) {
    return CryptoJS.HmacSHA256(message, privateKey).toString();
  }

  // Verify message signature
  static verifySignature(message, signature, publicKey) {
    const expectedSignature = CryptoJS.HmacSHA256(message, publicKey).toString();
    return signature === expectedSignature;
  }
}
