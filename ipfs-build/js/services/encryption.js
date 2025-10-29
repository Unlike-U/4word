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
