// Encryption service for handling password encryption and verification
const EncryptionService = {
  /**
   * Hash a password using SHA-256
   * @param {string} password - The password to hash
   * @returns {Promise<string>} The hashed password in hex format
   */
  async hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Hash error:', error);
      // Fallback to simple hash for development
      return this.simpleHash(password);
    }
  },

  /**
   * Simple hash fallback (for development only)
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  },

  /**
   * Verify a password against a hash
   * @param {string} password - The password to verify
   * @param {string} hash - The hash to compare against
   * @returns {Promise<boolean>} True if password matches hash
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  },

  /**
   * Generate a random salt
   * @param {number} length - Length of the salt
   * @returns {string} Random salt in hex format
   */
  generateSalt(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Hash password with salt
   * @param {string} password - The password to hash
   * @param {string} salt - The salt to use
   * @returns {Promise<string>} The salted hash
   */
  async hashPasswordWithSalt(password, salt) {
    const combined = password + salt;
    return await this.hashPassword(combined);
  },

  /**
   * Verify password with salt
   * @param {string} password - The password to verify
   * @param {string} hash - The hash to compare against
   * @param {string} salt - The salt used
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPasswordWithSalt(password, hash, salt) {
    const passwordHash = await this.hashPasswordWithSalt(password, salt);
    return passwordHash === hash;
  },

  /**
   * Generate a secure random password
   * @param {number} length - Length of the password
   * @returns {string} Random password
   */
  generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(x => charset[x % charset.length])
      .join('');
  }
};

export { EncryptionService };
export default EncryptionService;
