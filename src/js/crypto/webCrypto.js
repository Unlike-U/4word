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

  // ============================================
  // RSA FUNCTIONS (NEW)
  // ============================================

  /**
   * Generate RSA-OAEP key pair
   * @returns {Promise<{publicKey: string, privateKey: string}>}
   */
  async generateRSAKeyPair() {
    try {
      const keyPair = await this.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await this.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKey = await this.subtle.exportKey('jwk', keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKey),
        privateKey: JSON.stringify(privateKey),
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data with RSA public key
   * @param {string} data - Data to encrypt
   * @param {string} publicKeyJwk - Public key in JWK format (string)
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async encryptWithPublicKey(data, publicKeyJwk) {
    try {
      const publicKeyData = typeof publicKeyJwk === 'string' 
        ? JSON.parse(publicKeyJwk) 
        : publicKeyJwk;

      const publicKey = await this.subtle.importKey(
        'jwk',
        publicKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encryptedBuffer = await this.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        dataBuffer
      );

      return this.arrayBufferToBase64(new Uint8Array(encryptedBuffer));
    } catch (error) {
      throw new Error(`RSA encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with RSA private key
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} privateKeyJwk - Private key in JWK format (string)
   * @returns {Promise<string>} Decrypted data
   */
  async decryptWithPrivateKey(encryptedData, privateKeyJwk) {
    try {
      const privateKeyData = typeof privateKeyJwk === 'string' 
        ? JSON.parse(privateKeyJwk) 
        : privateKeyJwk;

      const privateKey = await this.subtle.importKey(
        'jwk',
        privateKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );

      const encryptedArray = this.base64ToArrayBuffer(encryptedData);

      const decryptedBuffer = await this.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedArray
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`RSA decryption failed: ${error.message}`);
    }
  }

  /**
   * Sign data with RSA private key
   * @param {string} data - Data to sign
   * @param {string} privateKeyJwk - Private key in JWK format
   * @returns {Promise<string>} Base64 encoded signature
   */
  async signData(data, privateKeyJwk) {
    try {
      const privateKeyData = typeof privateKeyJwk === 'string'
        ? JSON.parse(privateKeyJwk)
        : privateKeyJwk;

      const privateKey = await this.subtle.importKey(
        'jwk',
        privateKeyData,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const signature = await this.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        privateKey,
        dataBuffer
      );

      return this.arrayBufferToBase64(new Uint8Array(signature));
    } catch (error) {
      throw new Error(`Signing failed: ${error.message}`);
    }
  }

  /**
   * Verify signature with RSA public key
   * @param {string} data - Original data
   * @param {string} signature - Base64 encoded signature
   * @param {string} publicKeyJwk - Public key in JWK format
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verifySignature(data, signature, publicKeyJwk) {
    try {
      const publicKeyData = typeof publicKeyJwk === 'string'
        ? JSON.parse(publicKeyJwk)
        : publicKeyJwk;

      const publicKey = await this.subtle.importKey(
        'jwk',
        publicKeyData,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signatureArray = this.base64ToArrayBuffer(signature);

      const isValid = await this.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        publicKey,
        signatureArray,
        dataBuffer
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

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
