import MessageManager from '../managers/MessageManager.js';
import { StateManager } from '../managers/StateManager.js';
import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import KeyPairManager from '../services/KeyPairManager.js';
import Web3Service from '../services/Web3Service.js';
import BackendService from '../services/BackendService.js';

export class ChatView {
  constructor(currentUser) {
    this.container = null;
    this.currentUser = currentUser;
    this.stateManager = StateManager;
    this.messages = [];
    this.selectedReceiver = null;
    this.messageType = 'permanent';
    this.encryptionKey = '';
    this.decryptionKey = '';
    this.selectedFile = null;
    this.showEmojiPicker = false;
    this.displayedSelfDestructMessages = new Set();
    this.documentClickHandler = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'chat-view';
    
    const users = this.stateManager.getUsers().filter(u => u.username !== this.currentUser.username);
    
    this.container.innerHTML = `
      <div class="chat-header">
        <h2><i class="fas fa-comments"></i> Chat</h2>
        <div class="chat-controls">
          <div class="receiver-select-container">
            <label for="receiverSelect">
              <i class="fas fa-user"></i> To:
            </label>
            <select id="receiverSelect" class="receiver-select">
              <option value="">Everyone (Public)</option>
              ${users.map(user => `
                <option value="${user.username}">${user.displayName || user.username}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="encryption-key-container">
            <label for="encryptionKey">
              <i class="fas fa-key"></i> Extra Encryption:
            </label>
            <input 
              type="password" 
              id="encryptionKey" 
              class="encryption-key-input" 
              placeholder="Optional extra layer"
              autocomplete="off"
            >
            <button class="toggle-key-btn" id="toggleKeyBtn" title="Show/Hide key">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="welcome-message">
          <i class="fas fa-comments fa-3x"></i>
          <h3>Welcome to 4Word Chat!</h3>
          <p>Start a conversation by typing a message below.</p>
          <div class="storage-info">
            <div class="storage-item">
              <i class="fas fa-save"></i>
              <strong>Permanent:</strong> Stored on Base blockchain (requires wallet + gas)
            </div>
            <div class="storage-item">
              <i class="fas fa-clock"></i>
              <strong>Temporary:</strong> Stored on backend server (24h expiry)
            </div>
            <div class="storage-item">
              <i class="fas fa-bomb"></i>
              <strong>Self-Destruct:</strong> Stored on backend (deleted after read)
            </div>
          </div>
          <p class="filter-info">
            <i class="fas fa-shield-alt"></i> 
            Private messages are automatically encrypted with RSA (End-to-End).
          </p>
        </div>
      </div>

      <div class="chat-input-container">
        <div class="message-type-selector">
          <button class="message-type-btn active" data-type="permanent" title="Permanent - Blockchain storage">
            <i class="fas fa-save"></i>
            <span>Permanent</span>
            <small>⛽ Gas</small>
          </button>
          <button class="message-type-btn" data-type="temporary" title="Temporary - 24h backend storage">
            <i class="fas fa-clock"></i>
            <span>Temporary</span>
            <small>24h</small>
          </button>
          <button class="message-type-btn" data-type="self-destruct" title="Self-destruct - Backend storage">
            <i class="fas fa-bomb"></i>
            <span>Self-Destruct</span>
            <small>Read once</small>
          </button>
        </div>
        
        <!-- File Preview -->
        <div class="file-preview-container" id="filePreviewContainer" style="display: none;">
          <div class="file-preview">
            <img id="filePreviewImage" style="display: none;">
            <div class="file-info" id="fileInfo"></div>
            <button class="remove-file-btn" id="removeFileBtn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Emoji/GIF Picker -->
        <div class="emoji-picker" id="emojiPicker" style="display: none;">
          <div class="emoji-picker-tabs">
            <button class="emoji-tab active" data-tab="emoji">
              <i class="fas fa-smile"></i> Emoji
            </button>
            <button class="emoji-tab" data-tab="gif">
              <i class="fas fa-image"></i> GIF
            </button>
          </div>
          
          <div class="emoji-content">
            <div class="emoji-panel active" data-panel="emoji">
              <div class="emoji-grid" id="emojiGrid">
                ${this.generateEmojiGrid()}
              </div>
            </div>
            
            <div class="emoji-panel" data-panel="gif">
              <div class="gif-search">
                <input type="text" id="gifSearch" placeholder="Search GIFs..." class="gif-search-input">
                <button id="gifSearchBtn" class="gif-search-btn">
                  <i class="fas fa-search"></i>
                </button>
              </div>
              <div class="gif-grid" id="gifGrid">
                <p class="gif-placeholder">Search for GIFs above</p>
              </div>
            </div>
          </div>
        </div>
        
        <form class="chat-input-form" id="chatForm">
          <button type="button" class="attach-btn" id="attachBtn" title="Attach file">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="file" id="fileInput" accept="image/*,video/*,.pdf,.doc,.docx" style="display: none;">
          
          <button type="button" class="emoji-btn" id="emojiBtn" title="Emoji & GIFs">
            <i class="fas fa-smile"></i>
          </button>
          
          <input 
            type="text" 
            id="messageInput" 
            class="chat-input" 
            placeholder="Type a message..."
            autocomplete="off"
          >
          
          <button type="submit" class="send-btn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    `;

    this.attachEventListeners();
    this.loadMessages();
    
    return this.container;
  }

  generateEmojiGrid() {
    const emojis = [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏',
      '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
      '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '😎',
      '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
      '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎', '👌', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
      '🔥', '💧', '🌊', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽',
      '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒'
    ];

    return emojis.map(emoji => 
      `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
    ).join('');
  }

  attachEventListeners() {
    const form = this.container.querySelector('#chatForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    const receiverSelect = this.container.querySelector('#receiverSelect');
    receiverSelect.addEventListener('change', (e) => {
      this.selectedReceiver = e.target.value || null;
      this.updatePlaceholder();
    });

    const keyInput = this.container.querySelector('#encryptionKey');
    keyInput.addEventListener('input', (e) => {
      this.encryptionKey = e.target.value;
      this.decryptionKey = e.target.value;
      this.updatePlaceholder();
      
      if (this.messages.length > 0) {
        this.refreshMessages();
      }
    });

    const toggleKeyBtn = this.container.querySelector('#toggleKeyBtn');
    toggleKeyBtn.addEventListener('click', () => {
      const keyInput = this.container.querySelector('#encryptionKey');
      const icon = toggleKeyBtn.querySelector('i');
      
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        keyInput.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });

    const typeButtons = this.container.querySelectorAll('.message-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.setMessageType(type);
      });
    });

    const attachBtn = this.container.querySelector('#attachBtn');
    const fileInput = this.container.querySelector('#fileInput');
    
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    const removeFileBtn = this.container.querySelector('#removeFileBtn');
    removeFileBtn.addEventListener('click', () => this.removeFile());

    const emojiBtn = this.container.querySelector('#emojiBtn');
    emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());

    const emojiTabs = this.container.querySelectorAll('.emoji-tab');
    emojiTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.currentTarget.dataset.tab;
        this.switchEmojiTab(tabType);
      });
    });

    const emojiItems = this.container.querySelectorAll('.emoji-item');
    emojiItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const emoji = e.currentTarget.dataset.emoji;
        this.insertEmoji(emoji);
      });
    });

    const gifSearchBtn = this.container.querySelector('#gifSearchBtn');
    const gifSearchInput = this.container.querySelector('#gifSearch');
    
    gifSearchBtn.addEventListener('click', () => {
      this.searchGifs(gifSearchInput.value);
    });

    gifSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchGifs(gifSearchInput.value);
      }
    });

    this.documentClickHandler = (e) => {
      if (!this.container) return;
      
      const emojiPicker = this.container.querySelector('#emojiPicker');
      const emojiBtn = this.container.querySelector('#emojiBtn');
      
      if (emojiPicker && emojiBtn && this.showEmojiPicker && 
          !emojiPicker.contains(e.target) && 
          !emojiBtn.contains(e.target)) {
        this.toggleEmojiPicker();
      }
    };
    
    document.addEventListener('click', this.documentClickHandler);
  }

  handleFileSelect(file) {
    this.selectedFile = file;
    
    const previewContainer = this.container.querySelector('#filePreviewContainer');
    const previewImage = this.container.querySelector('#filePreviewImage');
    const fileInfo = this.container.querySelector('#fileInfo');
    
    previewContainer.style.display = 'block';
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
      };
      reader.readAsDataURL(file);
      fileInfo.innerHTML = `<i class="fas fa-image"></i> ${file.name} (${this.formatFileSize(file.size)})`;
    } else {
      previewImage.style.display = 'none';
      const icon = this.getFileIcon(file.type);
      fileInfo.innerHTML = `<i class="fas ${icon}"></i> ${file.name} (${this.formatFileSize(file.size)})`;
    }
  }

  removeFile() {
    this.selectedFile = null;
    const previewContainer = this.container.querySelector('#filePreviewContainer');
    const fileInput = this.container.querySelector('#fileInput');
    previewContainer.style.display = 'none';
    fileInput.value = '';
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    const emojiPicker = this.container.querySelector('#emojiPicker');
    if (emojiPicker) {
      emojiPicker.style.display = this.showEmojiPicker ? 'block' : 'none';
    }
  }

  switchEmojiTab(tabType) {
    const tabs = this.container.querySelectorAll('.emoji-tab');
    const panels = this.container.querySelectorAll('.emoji-panel');
    
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabType);
    });
    
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabType);
    });
  }

  insertEmoji(emoji) {
    const input = this.container.querySelector('#messageInput');
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);
    
    input.value = textBefore + emoji + textAfter;
    input.focus();
    input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
  }

  async searchGifs(query) {
    if (!query.trim()) {
      MessageManager.showWarning('Please enter a search term');
      return;
    }

    const gifGrid = this.container.querySelector('#gifGrid');
    gifGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

    const apiKey = 'AIzaSyAXwQU_OKMq0yGwJdXwBdmNLqV_L_zNJLg';
    const limit = 20;
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=${limit}&media_filter=gif`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        gifGrid.innerHTML = data.results.map(gif => `
          <div class="gif-item" data-gif-url="${gif.media_formats.gif.url}">
            <img src="${gif.media_formats.tinygif.url}" alt="${gif.content_description}">
          </div>
        `).join('');
        
        const gifItems = gifGrid.querySelectorAll('.gif-item');
        gifItems.forEach(item => {
          item.addEventListener('click', () => {
            this.insertGif(item.dataset.gifUrl);
          });
        });
      } else {
        gifGrid.innerHTML = '<p class="gif-placeholder">No GIFs found</p>';
      }
    } catch (error) {
      console.error('GIF search error:', error);
      gifGrid.innerHTML = '<p class="gif-placeholder">Error loading GIFs. Try again.</p>';
    }
  }

  insertGif(gifUrl) {
    const input = this.container.querySelector('#messageInput');
    input.value = (input.value + ' ' + gifUrl).trim();
    this.toggleEmojiPicker();
    MessageManager.showSuccess('GIF added! Send your message.');
  }

  getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'fa-image';
    if (fileType.startsWith('video/')) return 'fa-video';
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    return 'fa-file';
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  setMessageType(type) {
    this.messageType = type;
    
    const buttons = this.container.querySelectorAll('.message-type-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    this.updatePlaceholder();
  }

  updatePlaceholder() {
    const input = this.container.querySelector('#messageInput');
    let placeholder = 'Type a message';
    
    if (this.selectedReceiver) {
      const users = this.stateManager.getUsers();
      const receiver = users.find(u => u.username === this.selectedReceiver);
      const receiverName = receiver ? (receiver.displayName || receiver.username) : this.selectedReceiver;
      placeholder = `Message to ${receiverName}`;
    }

    const typeLabels = {
      permanent: '(blockchain)',
      temporary: '(24h backend)',
      'self-destruct': '(read once)'
    };

    let encryptionLabel = '';
    if (this.selectedReceiver) {
      encryptionLabel = ' 🔐';
    }
    if (this.encryptionKey) {
      encryptionLabel += ' 🔑';
    }

    input.placeholder = `${placeholder} ${typeLabels[this.messageType]}${encryptionLabel}...`;
  }

  encryptMessage(text, key) {
    if (!key || key.length === 0) return text;
    
    try {
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const textChar = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(textChar ^ keyChar);
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  }

  decryptMessage(encryptedText, key) {
    if (!key || key.length === 0) return null;
    
    try {
      const encrypted = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const encChar = encrypted.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(encChar ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  async sendMessage() {
    const input = this.container.querySelector('#messageInput');
    const message = input.value.trim();

    if (!message && !this.selectedFile) {
      MessageManager.showWarning('Please enter a message or attach a file');
      return;
    }

    // Check wallet connection for permanent messages
    if (this.messageType === 'permanent' && !Web3Service.isConnected) {
      MessageManager.showError('Please connect your wallet to send permanent messages');
      return;
    }

    const originalMessage = message;
    let finalMessageText = message;
    let rsaEncrypted = false;

    // Layer 1: RSA Encryption (if private message)
    if (this.selectedReceiver && KeyPairManager.isSupported) {
      try {
        const recipientPublicKey = this.stateManager.getPublicKey(this.selectedReceiver);
        
        if (recipientPublicKey) {
          const importedPublicKey = await KeyPairManager.importPublicKey(recipientPublicKey);
          finalMessageText = await KeyPairManager.encryptMessage(message, importedPublicKey);
          rsaEncrypted = true;
          console.log(`🔐 Message RSA encrypted for ${this.selectedReceiver}`);
        }
      } catch (error) {
        console.error('RSA encryption error:', error);
      }
    }

    // Layer 2: Manual Encryption (optional additional layer)
    let manuallyEncrypted = false;
    if (this.encryptionKey) {
      finalMessageText = this.encryptMessage(finalMessageText, this.encryptionKey);
      manuallyEncrypted = true;
      console.log(`🔑 Additional manual encryption applied`);
    }

    let fileData = null;
    if (this.selectedFile) {
      fileData = {
        name: this.selectedFile.name,
        type: this.selectedFile.type,
        size: this.selectedFile.size,
        url: URL.createObjectURL(this.selectedFile)
      };
    }

    const messageObj = {
      text: finalMessageText,
      rsaEncrypted: rsaEncrypted,
      manuallyEncrypted: manuallyEncrypted,
      sender: this.currentUser.username,
      senderName: this.currentUser.displayName,
      receiver: this.selectedReceiver,
      messageType: this.messageType,
      file: fileData
    };

    try {
      // Route to appropriate storage
      if (this.messageType === 'permanent') {
        await this.storeOnBlockchain(messageObj, originalMessage);
      } else {
        await this.storeOnBackend(messageObj, originalMessage);
      }

      input.value = '';
      this.removeFile();

    } catch (error) {
      console.error('Send message error:', error);
      MessageManager.showError('Failed to send message: ' + error.message);
    }
  }

  async storeOnBlockchain(messageObj, originalMessage) {
    try {
      const result = await Web3Service.storeMessage({
        senderUsername: messageObj.sender,
        receiver: messageObj.receiver || '',
        text: messageObj.text,
        rsaEncrypted: messageObj.rsaEncrypted,
        manuallyEncrypted: messageObj.manuallyEncrypted
      });

      // Add to local messages for immediate display
      const displayObj = {
        ...messageObj,
        id: result.messageId,
        timestamp: new Date().toISOString(),
        originalText: originalMessage,
        isOwnMessage: true,
        source: 'blockchain',
        txHash: result.txHash
      };

      this.messages.push(displayObj);
      this.displayMessage(displayObj);

      EventBus.emit(EVENTS.CHAT.MESSAGE_SENT, displayObj);

    } catch (error) {
      throw error;
    }
  }

  async storeOnBackend(messageObj, originalMessage) {
    try {
      const result = await BackendService.storeMessage({
        ...messageObj,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Add to local messages for immediate display
      const displayObj = {
        ...messageObj,
        id: result.id,
        timestamp: result.timestamp,
        expiresAt: result.expiresAt,
        originalText: originalMessage,
        isOwnMessage: true,
        source: 'backend'
      };

      this.messages.push(displayObj);
      this.displayMessage(displayObj);

      const typeLabel = this.messageType === 'temporary' ? '(24h)' : '(self-destruct)';
      MessageManager.showSuccess(`Message sent ${typeLabel}`);

      EventBus.emit(EVENTS.CHAT.MESSAGE_SENT, displayObj);

    } catch (error) {
      throw error;
    }
  }

  async displayMessage(message) {
    const messagesContainer = this.container.querySelector('#chatMessages');
    
    const welcome = messagesContainer.querySelector('.welcome-message');
    if (welcome) {
      welcome.remove();
    }

    const messageEl = document.createElement('div');
    const isOwnMessage = message.sender === this.currentUser.username;
    const isPrivate = message.receiver && message.receiver !== '';
    
    messageEl.className = `chat-message ${isOwnMessage ? 'own-message' : ''}`;
    messageEl.dataset.messageId = message.id;
    messageEl.dataset.source = message.source || 'unknown';
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const typeIcons = {
      permanent: '<i class="fas fa-save" title="Permanent - Blockchain"></i>',
      temporary: '<i class="fas fa-clock" title="Temporary - 24h"></i>',
      'self-destruct': '<i class="fas fa-bomb" title="Self-destruct"></i>'
    };

    const typeIcon = typeIcons[message.messageType] || '';

    let receiverInfo = '';
    if (isPrivate) {
      const users = this.stateManager.getUsers();
      const receiver = users.find(u => u.username === message.receiver);
      const receiverName = receiver ? (receiver.displayName || receiver.username) : message.receiver;
      receiverInfo = `<span class="message-receiver"><i class="fas fa-lock"></i> Private to ${receiverName}</span>`;
    }

    let displayText = '';
    let messageClass = '';

    displayText = message.text;

    if (message.originalText) {
      displayText = message.originalText;
    } else {
      // Layer 1: RSA Decryption
      if (message.rsaEncrypted && !isOwnMessage && KeyPairManager.isSupported) {
        try {
          const cachedKeyPair = KeyPairManager.getCachedKeyPair(this.currentUser.username);
          
          if (cachedKeyPair && cachedKeyPair.privateKey) {
            displayText = await KeyPairManager.decryptMessage(displayText, cachedKeyPair.privateKey);
            messageClass = 'rsa-decrypted';
            console.log('🔓 RSA decrypted');
          } else {
            displayText = '🔒 [RSA Encrypted - Keys not loaded]';
            messageClass = 'encrypted-locked';
          }
        } catch (error) {
          console.error('RSA decryption failed:', error);
          displayText = '🔒 [RSA Encrypted - Decryption failed]';
          messageClass = 'encrypted-locked';
        }
      }

      // Layer 2: Manual Decryption
      if (message.manuallyEncrypted && messageClass !== 'encrypted-locked') {
        if (this.decryptionKey) {
          const decrypted = this.decryptMessage(displayText, this.decryptionKey);
          if (decrypted) {
            displayText = decrypted;
            messageClass = 'decrypted-message';
            console.log('🔑 Manual decryption applied');
          } else {
            displayText = '🔑 [Manually Encrypted - Wrong Key]';
            messageClass = 'encrypted-locked';
          }
        } else {
          displayText = '🔑 [Manually Encrypted - Enter key to decrypt]';
          messageClass = 'encrypted-locked';
        }
      }
    }

    const gifUrlPattern = /https?:\/\/.*\.gif/i;
    let contentHtml = '';
    
    if (gifUrlPattern.test(displayText)) {
      const gifUrl = displayText.match(gifUrlPattern)[0];
      const textWithoutGif = displayText.replace(gifUrl, '').trim();
      contentHtml = `
        ${textWithoutGif ? `<p>${this.escapeHtml(textWithoutGif)}</p>` : ''}
        <img src="${gifUrl}" class="message-gif" alt="GIF">
      `;
    } else {
      contentHtml = this.escapeHtml(displayText);
    }

    let fileHtml = '';
    if (message.file) {
      if (message.file.type.startsWith('image/')) {
        fileHtml = `
          <div class="message-attachment">
            <img src="${message.file.url}" alt="${message.file.name}" class="message-image">
          </div>
        `;
      } else {
        const icon = this.getFileIcon(message.file.type);
        fileHtml = `
          <div class="message-attachment file-attachment">
            <i class="fas ${icon}"></i>
            <div class="file-attachment-info">
              <div class="file-name">${message.file.name}</div>
              <div class="file-size">${this.formatFileSize(message.file.size)}</div>
            </div>
            <a href="${message.file.url}" download="${message.file.name}" class="file-download">
              <i class="fas fa-download"></i>
            </a>
          </div>
        `;
      }
    }

    let encryptionIndicators = '';
    if (message.rsaEncrypted) {
      encryptionIndicators += '<i class="fas fa-shield-alt" title="RSA Encrypted"></i> ';
    }
    if (message.manuallyEncrypted) {
      encryptionIndicators += '<i class="fas fa-key" title="Manually Encrypted"></i> ';
    }

    // Storage indicator
    const storageIndicator = message.source === 'blockchain' 
      ? '<span class="storage-badge blockchain"><i class="fas fa-cube"></i> On-chain</span>'
      : '<span class="storage-badge backend"><i class="fas fa-server"></i> Backend</span>';

    messageEl.innerHTML = `
      <div class="message-header">
        <div class="message-sender-info">
          <span class="message-sender">${message.senderName || message.sender}</span>
          ${receiverInfo}
        </div>
        <div class="message-meta">
          ${storageIndicator}
          ${encryptionIndicators}
          ${typeIcon}
          <span class="message-time">${time}</span>
        </div>
      </div>
      <div class="message-content ${message.messageType} ${messageClass}">
        ${contentHtml}
      </div>
      ${fileHtml}
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Handle self-destruct
    if (message.messageType === 'self-destruct' && !isOwnMessage && message.source === 'backend') {
      this.displayedSelfDestructMessages.add(message.id);
      
      // Mark as read on backend
      try {
        await BackendService.markAsRead(message.id, this.currentUser.username);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
      
      const countdownTime = 5000;
      const destructTime = 2000;
      
      setTimeout(() => {
        messageEl.classList.add('self-destructing');
        
        setTimeout(() => {
          messageEl.remove();
          this.messages = this.messages.filter(m => m.id !== message.id);
          
          console.log(`Self-destruct message ${message.id} destroyed`);
        }, destructTime);
      }, countdownTime);
    }
  }

  refreshMessages() {
    const messagesContainer = this.container.querySelector('#chatMessages');
    messagesContainer.innerHTML = '';
    
    if (this.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <i class="fas fa-comments fa-3x"></i>
          <h3>Welcome to 4Word Chat!</h3>
          <p>Start a conversation by typing a message below.</p>
          <div class="storage-info">
            <div class="storage-item">
              <i class="fas fa-save"></i>
              <strong>Permanent:</strong> Stored on Base blockchain
            </div>
            <div class="storage-item">
              <i class="fas fa-clock"></i>
              <strong>Temporary:</strong> Stored on backend (24h)
            </div>
            <div class="storage-item">
              <i class="fas fa-bomb"></i>
              <strong>Self-Destruct:</strong> Deleted after read
            </div>
          </div>
        </div>
      `;
      return;
    }

    const filteredMessages = this.messages.filter(msg => {
      if (!msg.receiver || msg.receiver === '') return true;
      if (msg.sender === this.currentUser.username) return true;
      if (msg.receiver === this.currentUser.username) return true;
      return false;
    });

    filteredMessages.forEach(msg => this.displayMessage(msg));
  }

  async loadMessages() {
    console.log('Loading messages from all sources...');
    
    // Load from blockchain (permanent messages)
    if (Web3Service.isConnected) {
      try {
        const blockchainMessages = await Web3Service.getMessages(this.currentUser.username);
        this.messages.push(...blockchainMessages);
        console.log(`Loaded ${blockchainMessages.length} messages from blockchain`);
      } catch (error) {
        console.error('Failed to load blockchain messages:', error);
      }
    }

    // Load from backend (temporary & self-destruct)
    try {
      const backendMessages = await BackendService.getMessages(this.currentUser.username);
      this.messages.push(...backendMessages.map(msg => ({
        ...msg,
        source: 'backend'
      })));
      console.log(`Loaded ${backendMessages.length} messages from backend`);
    } catch (error) {
      console.error('Failed to load backend messages:', error);
    }

    // Sort by timestamp
    this.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Display all messages
    if (this.messages.length > 0) {
      this.messages.forEach(msg => this.displayMessage(msg));
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
    
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
