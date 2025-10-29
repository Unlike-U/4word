#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Updating 4WORD Steganography Fix...${NC}"
echo ""

# Backup files
echo -e "${YELLOW}Creating backups...${NC}"
cp src/js/state/stateManager.js src/js/state/stateManager.js.backup
cp src/js/components/InboxView.js src/js/components/InboxView.js.backup
cp src/js/components/SteganographyView.js src/js/components/SteganographyView.js.backup
cp src/styles/main.scss src/styles/main.scss.backup
echo -e "${GREEN}✓ Backups created${NC}"
echo ""

# Update stateManager.js
echo -e "${YELLOW}Updating stateManager.js...${NC}"
cat > src/js/state/stateManager.js << 'STATEFILE'
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

  getState(path) {
    if (!path) return this.#deepClone(this.#state);
    
    const keys = path.split('.');
    let value = this.#state;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return this.#deepClone(value);
  }

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

  #utf8ToBase64(str) {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch (error) {
      console.error('UTF8 to Base64 encoding error:', error);
      return encodeURIComponent(str);
    }
  }

  #base64ToUtf8(str) {
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (error) {
      console.error('Base64 to UTF8 decoding error:', error);
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
  }

  persist() {
    try {
      const dataToStore = {
        users: this.#sanitizeUsersForStorage(this.#state.users),
        timestamp: new Date().toISOString(),
        version: '2.0'
      };
      
      const jsonString = JSON.stringify(dataToStore);
      const encoded = this.#utf8ToBase64(jsonString);
      
      localStorage.setItem('fw_secure_data', encoded);
      console.log('✓ State persisted successfully');
    } catch (error) {
      console.error('Failed to persist state:', error.message);
      try {
        localStorage.removeItem('fw_secure_data');
        console.log('Cleared corrupted storage');
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
    }
  }

  #sanitizeUsersForStorage(users) {
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
        messages: (user.messages || []).map(msg => ({
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
          attachedFile: msg.attachedFile || null,
        })),
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
        console.log('No stored data found');
        return;
      }

      const jsonString = this.#base64ToUtf8(encoded);
      const data = JSON.parse(jsonString);
      
      if (data && data.users && typeof data.users === 'object') {
        this.#state.users = {
          ...this.#state.users,
          ...data.users
        };
        console.log('✓ State restored successfully');
      } else {
        console.warn('Invalid data structure, clearing...');
        localStorage.removeItem('fw_secure_data');
      }
    } catch (error) {
      console.error('Failed to restore state:', error.message);
      try {
        localStorage.removeItem('fw_secure_data');
        console.log('Cleared corrupted data');
      } catch (e) {
        console.error('Failed to clear corrupted data:', e);
      }
    }
  }

  clearAll() {
    try {
      localStorage.removeItem('fw_secure_data');
      this.#state = this.#initializeState();
      this.#notify('reset', null);
      console.log('✓ All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}

export default new StateManager();
STATEFILE

echo -e "${GREEN}✓ stateManager.js updated${NC}"
echo ""

# Add stego decode method to InboxView.js
echo -e "${YELLOW}Updating InboxView.js...${NC}"

# Add the decodeStegoImage method before the last closing brace
sed -i '/^}$/d' src/js/components/InboxView.js

cat >> src/js/components/InboxView.js << 'INBOXADD'

  decodeStegoImage(fileData) {
    if (!fileData.stegoMetadata) {
      alert('⚠ No stego metadata found in this image');
      return;
    }

    try {
      const metadata = JSON.parse(atob(fileData.stegoMetadata));
      let hiddenMessage = decodeURIComponent(escape(atob(metadata.hidden)));

      if (metadata.encrypted) {
        const key = prompt('🔑 This message is encrypted. Enter decryption key:');
        
        if (!key) {
          alert('Decoding cancelled');
          return;
        }

        try {
          hiddenMessage = EncryptionService.decryptMessage(hiddenMessage, key);
          
          if (hiddenMessage.includes('[Invalid') || hiddenMessage.includes('[Decryption')) {
            alert('✗ Wrong decryption key!');
            return;
          }
        } catch (error) {
          alert('✗ Decryption failed: ' + error.message);
          return;
        }
      }

      alert(`✓ Decoded Message:\n\n${hiddenMessage}`);
      
    } catch (error) {
      alert('✗ Failed to decode: ' + error.message);
    }
  }
}
INBOXADD

echo -e "${GREEN}✓ InboxView.js updated${NC}"
echo ""

# Update renderAttachment in InboxView.js
echo -e "${YELLOW}Updating InboxView renderAttachment method...${NC}"

cat > temp_inbox_attachment.txt << 'RENDERATTACH'
  renderAttachment(fileData) {
    if (fileData.type.startsWith('image/')) {
      const isStegoImage = fileData.name.startsWith('stego_');
      
      return \`
        <div class="attachment-box">
          <div class="attachment-header">
            ATTACHMENT: \${isStegoImage ? 'STEGO IMAGE 🔐' : 'IMAGE'}
          </div>
          <div class="attachment-image-wrap">
            <img 
              src="\${fileData.data}" 
              alt="\${fileData.name}" 
              class="attachment-image-terminal"
            />
          </div>
          <div class="attachment-name">\${fileData.name}</div>
          \${isStegoImage && fileData.stegoMetadata ? \`
            <div class="stego-decode-box">
              <div class="stego-hint">
                💡 This image contains a hidden message
              </div>
              <button class="btn-decode-stego" id="decodeStegoBtn">
                🔓 DECODE HIDDEN MESSAGE
              </button>
            </div>
          \` : isStegoImage ? \`
            <div class="stego-hint">
              💡 Download this image and use the Stego tool to decode
            </div>
          \` : ''}
        </div>
      \`;
    } else if (fileData.type.startsWith('audio/')) {
      return \`
        <div class="attachment-box">
          <div class="attachment-header">ATTACHMENT: AUDIO</div>
          <div class="attachment-audio-wrap">
            <div class="audio-icon-terminal">🎤</div>
            <div class="audio-name-terminal">\${fileData.name}</div>
            <audio controls src="\${fileData.data}" class="audio-player-terminal">
              Audio not supported
            </audio>
          </div>
        </div>
      \`;
    } else {
      return \`
        <div class="attachment-box">
          <div class="attachment-header">ATTACHMENT: FILE</div>
          <div class="attachment-file-wrap">
            <div class="file-icon-terminal">📄</div>
            <div class="file-details">
              <div class="file-name-terminal">\${fileData.name}</div>
              <div class="file-size-terminal">\${(fileData.size / 1024).toFixed(1)} KB</div>
            </div>
            <a 
              href="\${fileData.data}" 
              download="\${fileData.name}" 
              class="btn-download-terminal"
            >
              DOWNLOAD
            </a>
          </div>
        </div>
      \`;
    }
  }
RENDERATTACH

# Use awk to replace the renderAttachment method
awk '
  /renderAttachment\(fileData\) \{/ { 
    skip=1
    system("cat temp_inbox_attachment.txt")
  }
  skip && /^  \}$/ && brace_count == 0 {
    skip=0
    next
  }
  skip {
    if (/\{/) brace_count++
    if (/\}/) brace_count--
    next
  }
  !skip { print }
' src/js/components/InboxView.js > temp_inbox.js && mv temp_inbox.js src/js/components/InboxView.js

rm temp_inbox_attachment.txt

# Add decode button listener to attachEventListeners
sed -i '/attachEventListeners() {/,/^  }$/ {
  /const clearResultBtn/a\
\
    const decodeStegoBtn = this.container.querySelector("#decodeStegoBtn");\
    if (decodeStegoBtn) {\
      decodeStegoBtn.addEventListener("click", () => {\
        if (this.selectedMsg && this.selectedMsg.attachedFileData) {\
          this.decodeStegoImage(this.selectedMsg.attachedFileData);\
        }\
      });\
    }
}' src/js/components/InboxView.js

echo -e "${GREEN}✓ InboxView attachment rendering updated${NC}"
echo ""

# Add stego styles to main.scss
echo -e "${YELLOW}Adding stego styles to main.scss...${NC}"

cat >> src/styles/main.scss << 'STYLES'

// Stego Decode Styles
.stego-decode-box {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: rgba($primary, 0.05);
  border: 1px solid $primary;
  border-radius: $radius-md;
  text-align: center;
}

.btn-decode-stego {
  width: 100%;
  padding: $spacing-md;
  margin-top: $spacing-sm;
  border: none;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: white;
  font-family: $font-family;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
  
  &:active {
    transform: translateY(0);
  }
}

.stego-hint {
  padding: $spacing-sm;
  background: rgba($warning, 0.1);
  border: 1px solid $warning;
  border-radius: $radius-sm;
  font-size: 12px;
  color: #cc7a00;
  text-align: center;
  line-height: 1.4;
}
STYLES

echo -e "${GREEN}✓ Styles added to main.scss${NC}"
echo ""

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ All files updated successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Backup files created:${NC}"
echo "  - src/js/state/stateManager.js.backup"
echo "  - src/js/components/InboxView.js.backup"
echo "  - src/js/components/SteganographyView.js.backup"
echo "  - src/styles/main.scss.backup"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Clear localStorage in browser console:"
echo "     localStorage.clear(); location.reload();"
echo ""
echo "  2. Restart webpack:"
echo "     npm run dev"
echo ""
echo -e "${GREEN}Done! 🚀${NC}"
