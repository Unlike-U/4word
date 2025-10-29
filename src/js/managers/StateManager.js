import initialUsers from '../../data/initialUsers.json';

class StateManagerClass {
  constructor() {
    this.storageKey = '4word_app_state';
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (!Array.isArray(state.users)) {
          state.users = initialUsers;
        }
        return state;
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }

    console.log('No saved data');
    return {
      users: Array.isArray(initialUsers) ? initialUsers : [],
      currentUser: null,
      messages: [],
      keyPairs: {}, // Store user keypairs
      publicKeys: {}, // Store public keys for all users
      settings: {
        theme: 'light',
        notifications: true
      }
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // User methods
  getUsers() {
    if (!Array.isArray(this.state.users)) {
      this.state.users = [];
    }
    return this.state.users;
  }

  getCurrentUser() {
    return this.state.currentUser;
  }

  setCurrentUser(user) {
    this.state.currentUser = user;
    this.saveState();
  }

  clearCurrentUser() {
    this.state.currentUser = null;
    this.saveState();
  }

  // KeyPair methods
  saveUserKeyPair(username, publicKey, encryptedPrivateKey) {
    if (!this.state.keyPairs) {
      this.state.keyPairs = {};
    }
    if (!this.state.publicKeys) {
      this.state.publicKeys = {};
    }
    
    this.state.keyPairs[username] = {
      publicKey,
      privateKey: encryptedPrivateKey
    };
    
    this.state.publicKeys[username] = publicKey;
    
    this.saveState();
    console.log(`Saved keypair for ${username}`);
  }

  getUserKeyPair(username) {
    if (!this.state.keyPairs) return null;
    return this.state.keyPairs[username];
  }

  getPublicKey(username) {
    if (!this.state.publicKeys) return null;
    return this.state.publicKeys[username];
  }

  getAllPublicKeys() {
    return this.state.publicKeys || {};
  }

  // Message methods
  getMessages() {
    return this.state.messages || [];
  }

  addMessage(message) {
    if (!this.state.messages) {
      this.state.messages = [];
    }
    this.state.messages.push({
      ...message,
      id: message.id || Date.now(),
      timestamp: message.timestamp || new Date().toISOString(),
      read: false
    });
    this.saveState();
  }

  markMessageAsRead(messageId) {
    if (!this.state.messages) return;
    
    const message = this.state.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      this.saveState();
      console.log(`Message ${messageId} marked as read`);
    }
  }

  deleteMessage(messageId) {
    if (!this.state.messages) return;
    
    const initialLength = this.state.messages.length;
    this.state.messages = this.state.messages.filter(m => m.id !== messageId);
    
    if (this.state.messages.length < initialLength) {
      this.saveState();
      console.log(`Message ${messageId} permanently deleted from storage`);
      return true;
    }
    return false;
  }

  cleanupSelfDestructMessages() {
    if (!this.state.messages) return;
    
    const initialLength = this.state.messages.length;
    this.state.messages = this.state.messages.filter(m => {
      if (m.messageType !== 'self-destruct') return true;
      if (!m.read) return true;
      return false;
    });
    
    if (this.state.messages.length < initialLength) {
      this.saveState();
      console.log(`Cleaned up ${initialLength - this.state.messages.length} self-destruct messages`);
    }
  }

  // Settings methods
  getSettings() {
    return this.state.settings || {};
  }

  updateSettings(settings) {
    this.state.settings = {
      ...this.state.settings,
      ...settings
    };
    this.saveState();
  }

  // Clear all data
  clearAll() {
    this.state = {
      users: Array.isArray(initialUsers) ? initialUsers : [],
      currentUser: null,
      messages: [],
      keyPairs: {},
      publicKeys: {},
      settings: {
        theme: 'light',
        notifications: true
      }
    };
    this.saveState();
  }
}

export const StateManager = new StateManagerClass();
export default StateManager;
