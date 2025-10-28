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
      console.error('Invalid state change blocked:', path, value);
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
        timestamp: new Date().toISOString()
      };
      const encrypted = this.#encrypt(JSON.stringify(dataToStore));
      localStorage.setItem('fw_secure_data', encrypted);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  restore() {
    try {
      const encrypted = localStorage.getItem('fw_secure_data');
      if (encrypted) {
        const decrypted = this.#decrypt(encrypted);
        const data = JSON.parse(decrypted);
        
        // Merge with existing users
        this.#state.users = {
          ...this.#state.users,
          ...data.users
        };
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }

  #encrypt(data) {
    // Use XOR encryption with key for demo
    // In production, use Web Crypto API
    const key = this.#encryptionKey;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  #decrypt(data) {
    const key = this.#encryptionKey;
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  // Clear all data
  clearAll() {
    localStorage.removeItem('fw_secure_data');
    this.#state = this.#initializeState();
    this.#notify('reset', null);
  }
}

export default new StateManager();
