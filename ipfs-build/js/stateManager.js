/**
 * Secure State Manager - No client-side exposed state
 * Uses closure pattern for privacy
 */
class StateManager {
  #state;
  #listeners;
  #encryptionKey;

  constructor() {
    this.#state = this.#initializeState();
    this.#listeners = new Set();
    this.#encryptionKey = this.#generateKey();
  }

  #generateKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  #initializeState() {
    return {
      currentUser: null,
      users: {},
      ui: {
        recipient: '',
        messageText: '',
        encryptKey: '',
        encryptKey2: '',
        securityLevel: 'encrypted',
        privacyLevel: 'private',
        persistenceLevel: 'permanent',
        networkEnabled: false,
        modal: null,
        commandInput: '',
        commandResult: '',
        isRecording: false,
        attachedFile: null,
        confirmDialog: null
      }
    };
  }

  // Secure getter - returns deep clone to prevent mutation
  getState(path) {
    if (!path) return this.#deepClone(this.#state);
    
    const keys = path.split('.');
    let value = this.#state;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return this.#deepClone(value);
  }

  // Secure setter with validation
  setState(path, value, validate = true) {
    if (validate && !this.#validateStateChange(path, value)) {
      console.error('Invalid state change blocked:', path);
      return false;
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.#state;

    for (const key of keys) {
      if (!target[key]) target[key] = {};
      target = target[key];
    }

    target[lastKey] = value;
    this.#notify(path, value);
    return true;
  }

  #validateStateChange(path, value) {
    // Add validation rules here
    if (path.includes('passphraseHash') && typeof value !== 'string') {
      return false;
    }
    if (path.includes('privateKey') && typeof value !== 'string') {
      return false;
    }
    return true;
  }

  subscribe(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  #notify(path, value) {
    this.#listeners.forEach(callback => {
      try {
        callback({ path, value, state: this.#deepClone(this.#state) });
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  #deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.#deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.#deepClone(obj[key]);
      }
    }
    return cloned;
  }

  // Secure storage methods with encryption
  persist() {
    try {
      const dataToStore = {
        users: this.#state.users,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };
      
      const jsonString = JSON.stringify(dataToStore);
      const encrypted = this.#encrypt(jsonString);
      localStorage.setItem('fw_secure_data', encrypted);
      
      console.log('State persisted successfully');
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  restore() {
    try {
      const encrypted = localStorage.getItem('fw_secure_data');
      
      if (!encrypted) {
        console.log('No stored data found');
        return;
      }

      const decrypted = this.#decrypt(encrypted);
      
      if (!decrypted) {
        console.warn('Failed to decrypt stored data, clearing...');
        localStorage.removeItem('fw_secure_data');
        return;
      }

      const data = JSON.parse(decrypted);
      
      // Validate data structure
      if (data && data.users && typeof data.users === 'object') {
        // Merge with existing users
        this.#state.users = {
          ...this.#state.users,
          ...data.users
        };
        console.log('State restored successfully');
      } else {
        console.warn('Invalid data structure, clearing...');
        localStorage.removeItem('fw_secure_data');
      }
    } catch (error) {
      console.error('Failed to restore state:', error.message);
      // Clear corrupted data
      try {
        localStorage.removeItem('fw_secure_data');
        console.log('Corrupted data cleared');
      } catch (e) {
        console.error('Failed to clear corrupted data:', e);
      }
    }
  }

  #encrypt(data) {
    try {
      // Simple Base64 encoding for demo
      // In production, use Web Crypto API
      return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  #decrypt(data) {
    try {
      // Simple Base64 decoding for demo
      return decodeURIComponent(escape(atob(data)));
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Clear all data
  clearAll() {
    try {
      localStorage.removeItem('fw_secure_data');
      this.#state = this.#initializeState();
      this.#notify('reset', null);
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}

export default new StateManager();
