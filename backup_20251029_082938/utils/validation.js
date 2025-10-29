/**
 * Input Validation & Sanitization
 */

export class Validator {
  /**
   * Sanitize string input (prevent XSS)
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate Ethereum address
   */
  static isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate file size
   */
  static validateFileSize(file, maxSizeMB = 10) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }
    return true;
  }

  /**
   * Validate image file
   */
  static validateImageFile(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPEG, and WebP allowed.');
    }
    
    this.validateFileSize(file, 10);
    return true;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Minimum ${minLength} characters required`);
    }
    if (!hasUpperCase) errors.push('Add uppercase letters');
    if (!hasLowerCase) errors.push('Add lowercase letters');
    if (!hasNumbers) errors.push('Add numbers');
    if (!hasSpecialChar) errors.push('Add special characters');

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    return {
      valid: errors.length === 0,
      errors,
      strength: strength === 4 ? 'strong' : strength >= 2 ? 'medium' : 'weak'
    };
  }

  /**
   * Rate limit check (client-side)
   */
  static checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
    const key = `rateLimit_${action}`;
    const now = Date.now();
    
    let attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove old attempts outside window
    attempts = attempts.filter(time => now - time < windowMs);
    
    if (attempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...attempts);
      const resetTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${resetTime}s`);
    }
    
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));
    
    return true;
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }
}

