class StateManager {
  #state;
  #listeners;

  constructor() {
    this.#state = this.#initializeState();
    this.#listeners = new Set();
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

  getState(path) {
    if (!path) return this.#deepClone(this.#state);
    const keys = path.split('.');
    let value = this.#state;
    for (const key of keys) {
      value = value?.[key];
    }
    return this.#deepClone(value);
  }

  setState(path, value) {
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

  persist() {
    try {
      const dataToStore = {
        users: this.#sanitizeUsers(this.#state.users),
        timestamp: new Date().toISOString()
      };
      const jsonString = JSON.stringify(dataToStore);
      const encoded = encodeURIComponent(jsonString);
      localStorage.setItem('fw_secure_data', encoded);
      console.log('✓ State saved');
    } catch (error) {
      console.error('Save failed:', error.message);
      localStorage.removeItem('fw_secure_data');
    }
  }

  #sanitizeUsers(users) {
    const sanitized = {};
    for (const username in users) {
      const user = users[username];
      sanitized[username] = {
        username: user.username,
        passphraseHash: user.passphraseHash,
        publicKey: user.publicKey,
        privateKey: user.privateKey,
        friends: user.friends || [],
        groups: user.groups || [],
        messages: (user.messages || []).map(msg => {
          const sanitizedMsg = {
            id: msg.id,
            from: msg.from,
            to: msg.to,
            message: msg.message,
            security: msg.security,
            privacy: msg.privacy,
            persistence: msg.persistence,
            timestamp: msg.timestamp,
            read: msg.read,
            destructed: msg.destructed,
            encrypted: msg.encrypted,
            doubleEncrypted: msg.doubleEncrypted,
            selfDestruct: msg.selfDestruct,
            attachedFile: msg.attachedFile
          };
          
          // Preserve stegoMetadata and basic file info for stego images
          if (msg.attachedFileData) {
            sanitizedMsg.attachedFileData = {
              name: msg.attachedFileData.name,
              type: msg.attachedFileData.type,
              size: msg.attachedFileData.size,
              // Keep full data for stego images (includes metadata)
              stegoMetadata: msg.attachedFileData.stegoMetadata,
              // For stego images, keep the image data too
              data: msg.attachedFileData.stegoMetadata ? msg.attachedFileData.data : undefined
            };
          }
          
          return sanitizedMsg;
        }),
        friendRequests: user.friendRequests || [],
        groupInvites: user.groupInvites || [],
        deadDrops: user.deadDrops || [],
        createdAt: user.createdAt
      };
    }
    return sanitized;
  }

  restore() {
    try {
      const encoded = localStorage.getItem('fw_secure_data');
      if (!encoded) {
        console.log('No saved data');
        return;
      }
      const jsonString = decodeURIComponent(encoded);
      const data = JSON.parse(jsonString);
      if (data?.users) {
        this.#state.users = { ...this.#state.users, ...data.users };
        console.log('✓ State restored');
      }
    } catch (error) {
      console.error('Restore failed:', error.message);
      localStorage.removeItem('fw_secure_data');
    }
  }

  clearAll() {
    localStorage.removeItem('fw_secure_data');
    this.#state = this.#initializeState();
    console.log('✓ Data cleared');
  }
}

export default new StateManager();
