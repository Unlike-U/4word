import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import MessageManager from '../managers/MessageManager.js';
import Web3Service from '../services/Web3Service.js';
import BackendService from '../services/BackendService.js';
import { StateManager } from '../managers/StateManager.js';

export class TerminalView {
  constructor(currentUser) {
    this.container = null;
    this.currentUser = currentUser;
    this.messages = [];
    this.selectedReceiver = '@everyone';
    this.encryptionKey = '';
    this.messageType = 'temporary';
    this.selectedFile = null;
    this.emojiPickerVisible = false;
    this.documentClickHandler = null; // Store reference for cleanup
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'chat-view';

    this.container.innerHTML = `
      <div class="chat-header">
            <h2>
          <i class="fas fa-terminal"></i>
          Terminal
        </h2>
        
        <div class="chat-controls">
          <div class="receiver-select-container">
            <label>
              <i class="fas fa-user-shield"></i>
              Send to
            </label>
            <select class="receiver-select" id="receiverSelect">
              <option value="@everyone">@everyone</option>
              ${this.getOnlineUsers().map(user => `
                <option value="${user.username}">${user.displayName}</option>
              `).join('')}
            </select>
          </div>

          <div class="encryption-key-container">
            <label>
              <i class="fas fa-key"></i>
              Encryption Key
            </label>
            <div style="display: flex; gap: 8px;">
              <input 
                type="password" 
                class="encryption-key-input" 
                id="encryptionKeyInput" 
                placeholder="Optional manual encryption key"
              />
              <button class="toggle-key-btn" id="toggleKeyBtn">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="filter-info">
          <i class="fas fa-info-circle"></i>
          Messages are filtered by selected recipient
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="welcome-message">
          <i class="fas fa-comments fa-3x"></i>
          <h3>Welcome to 4Word</h3>
          <p>Start a secure conversation</p>
          
          <div class="storage-info">
            <div class="storage-item">
              <i class="fas fa-cube"></i>
              <div>
                <strong>Permanent Messages</strong>
                <p>Stored on blockchain forever</p>
              </div>
            </div>
            <div class="storage-item">
              <i class="fas fa-server"></i>
              <div>
                <strong>Temporary Messages</strong>
                <p>Stored on backend server until read</p>
              </div>
            </div>
            <div class="storage-item">
              <i class="fas fa-bomb"></i>
              <div>
                <strong>Self-Destruct Messages</strong>
                <p>Deleted immediately after reading</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <div class="message-type-selector">
          <button class="message-type-btn" data-type="permanent">
            <i class="fas fa-save"></i>
            <span>Permanent</span>
            <small>Blockchain</small>
          </button>
          <button class="message-type-btn active" data-type="temporary">
            <i class="fas fa-clock"></i>
            <span>Temporary</span>
            <small>Backend</small>
          </button>
          <button class="message-type-btn" data-type="self-destruct">
            <i class="fas fa-bomb"></i>
            <span>Self-Destruct</span>
            <small>Read Once</small>
          </button>
        </div>

        <div class="file-preview-container" id="filePreview" style="display: none;">
          <div class="file-preview">
            <img id="filePreviewImage" style="display: none;">
            <div class="file-info" id="fileInfo">
              <i class="fas fa-file"></i>
              <span id="fileName"></span>
            </div>
            <button class="remove-file-btn" id="removeFileBtn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form class="chat-input-form" id="chatForm">
          <button type="button" class="attach-btn" id="attachBtn">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="file" id="fileInput" style="display: none;" accept="image/*,video/*,application/*">
          
          <textarea 
            class="chat-input" 
            id="messageInput" 
            placeholder="Type a message..."
            rows="1"
          ></textarea>
          
          <button type="button" class="emoji-btn" id="emojiBtn">
            <i class="fas fa-smile"></i>
          </button>
          
          <button type="submit" class="send-btn" id="sendBtn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>

        <div class="emoji-picker" id="emojiPicker" style="display: none;">
          <div class="emoji-picker-tabs">
            <button class="emoji-tab active" data-tab="emoji">
              <i class="fas fa-smile"></i>
              <span>Emoji</span>
            </button>
            <button class="emoji-tab" data-tab="gif">
              <i class="fas fa-images"></i>
              <span>GIF</span>
            </button>
          </div>
          
          <div class="emoji-content">
            <div class="emoji-panel active" data-panel="emoji">
              <div class="emoji-grid" id="emojiGrid">
                ${this.getEmojis().map(emoji => `
                  <button class="emoji-item" data-emoji="${emoji}">${emoji}</button>
                `).join('')}
              </div>
            </div>
            
            <div class="emoji-panel" data-panel="gif">
              <div class="gif-search">
                <input type="text" class="gif-search-input" id="gifSearchInput" placeholder="Search GIFs...">
                <button class="gif-search-btn" id="gifSearchBtn">
                  <i class="fas fa-search"></i>
                </button>
              </div>
              <div class="gif-grid" id="gifGrid">
                <div class="gif-placeholder">Search for GIFs above</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadMessages();

    return this.container;
  }

  attachEventListeners() {
    // Receiver select
    const receiverSelect = this.container.querySelector('#receiverSelect');
    receiverSelect.addEventListener('change', (e) => {
      this.selectedReceiver = e.target.value;
      this.displayMessages();
    });

    // Encryption key toggle
    const toggleKeyBtn = this.container.querySelector('#toggleKeyBtn');
    const keyInput = this.container.querySelector('#encryptionKeyInput');
    
    toggleKeyBtn.addEventListener('click', () => {
      const isPassword = keyInput.type === 'password';
      keyInput.type = isPassword ? 'text' : 'password';
      toggleKeyBtn.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
    });

    keyInput.addEventListener('input', (e) => {
      this.encryptionKey = e.target.value;
    });

    // Message type selector
    const typeButtons = this.container.querySelectorAll('.message-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        typeButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.messageType = e.currentTarget.dataset.type;
      });
    });

    // File attachment
    const attachBtn = this.container.querySelector('#attachBtn');
    const fileInput = this.container.querySelector('#fileInput');
    
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    const removeFileBtn = this.container.querySelector('#removeFileBtn');
    removeFileBtn.addEventListener('click', () => this.removeFile());

    // Emoji picker
    const emojiBtn = this.container.querySelector('#emojiBtn');
    emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());

    const emojiTabs = this.container.querySelectorAll('.emoji-tab');
    emojiTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        emojiTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        const panels = this.container.querySelectorAll('.emoji-panel');
        panels.forEach(p => p.classList.remove('active'));
        
        const targetPanel = this.container.querySelector(`.emoji-panel[data-panel="${e.currentTarget.dataset.tab}"]`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    const emojiItems = this.container.querySelectorAll('.emoji-item');
    emojiItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const emoji = e.currentTarget.dataset.emoji;
        this.insertEmoji(emoji);
      });
    });

    // Form submit
    const chatForm = this.container.querySelector('#chatForm');
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Auto-resize textarea
    const messageInput = this.container.querySelector('#messageInput');
    messageInput.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    // Close emoji picker when clicking outside - FIXED
    this.documentClickHandler = (e) => {
      // Safety check: ensure container exists
      if (!this.container) {
        return;
      }
      
      const emojiPicker = this.container.querySelector('#emojiPicker');
      const emojiBtn = this.container.querySelector('#emojiBtn');
      
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
        emojiPicker.style.display = 'none';
        this.emojiPickerVisible = false;
      }
    };
    
    document.addEventListener('click', this.documentClickHandler);
  }

  getOnlineUsers() {
    return StateManager.getUsers();
  }

  getEmojis() {
    return ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'];
  }

  toggleEmojiPicker() {
    const emojiPicker = this.container.querySelector('#emojiPicker');
    this.emojiPickerVisible = !this.emojiPickerVisible;
    emojiPicker.style.display = this.emojiPickerVisible ? 'block' : 'none';
  }

  insertEmoji(emoji) {
    const messageInput = this.container.querySelector('#messageInput');
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const text = messageInput.value;
    
    messageInput.value = text.substring(0, start) + emoji + text.substring(end);
    messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
    messageInput.focus();
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    
    const filePreview = this.container.querySelector('#filePreview');
    const filePreviewImage = this.container.querySelector('#filePreviewImage');
    const fileInfo = this.container.querySelector('#fileInfo');
    const fileName = this.container.querySelector('#fileName');

    filePreview.style.display = 'block';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreviewImage.src = e.target.result;
        filePreviewImage.style.display = 'block';
        fileInfo.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      filePreviewImage.style.display = 'none';
      fileInfo.style.display = 'flex';
      fileName.textContent = file.name;
    }
  }

  removeFile() {
    this.selectedFile = null;
    const filePreview = this.container.querySelector('#filePreview');
    const fileInput = this.container.querySelector('#fileInput');
    
    filePreview.style.display = 'none';
    fileInput.value = '';
  }

  async sendMessage() {
    const messageInput = this.container.querySelector('#messageInput');
    const message = messageInput.value.trim();

    if (!message && !this.selectedFile) {
      this.showMessage('Please enter a message or select a file', 'error');
      return;
    }

    try {
      const messageData = {
        id: this.generateMessageId(),
        sender: this.currentUser.username,
        senderName: this.currentUser.displayName,
        receiver: this.selectedReceiver,
        content: message,
        timestamp: Date.now(),
        type: this.messageType,
        encrypted: !!this.encryptionKey,
        encryptionKey: this.encryptionKey,
        file: this.selectedFile ? {
          name: this.selectedFile.name,
          type: this.selectedFile.type,
          size: this.selectedFile.size,
        } : null,
      };

      // Store message based on type
      if (this.messageType === 'permanent') {
        // Store on blockchain
        if (Web3Service.isConnected) {
          await this.sendToBlockchain(messageData);
        } else {
          this.showMessage('Connect wallet to send permanent messages', 'warning');
          // Fallback to localStorage
          this.saveToLocalStorage(messageData);
        }
      } else if (this.messageType === 'temporary') {
        // Store on backend
        await this.sendToBackend(messageData);
      } else if (this.messageType === 'self-destruct') {
        // Store on backend with self-destruct flag
        await this.sendSelfDestructToBackend(messageData);
      }

      // Add to local messages
      this.messages.push(messageData);
      this.displayMessages();

      // Clear input
      messageInput.value = '';
      messageInput.style.height = 'auto';
      this.removeFile();
      
      this.showMessage('Message sent!', 'success');

    } catch (error) {
      console.error('Error sending message:', error);
      this.showMessage('Failed to send message', 'error');
    }
  }

  async sendToBlockchain(messageData) {
    try {
      await Web3Service.sendMessage(messageData);
      this.showMessage('Message stored on blockchain', 'success');
    } catch (error) {
      console.error('Blockchain error:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(messageData);
      this.showMessage('Message saved locally (blockchain unavailable)', 'warning');
    }
  }

  async sendToBackend(messageData) {
    try {
      await BackendService.sendTemporaryMessage(messageData);
      this.showMessage('Temporary message sent', 'success');
    } catch (error) {
      console.error('Backend error:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(messageData);
      this.showMessage('Message saved locally (backend unavailable)', 'warning');
    }
  }

  async sendSelfDestructToBackend(messageData) {
    try {
      await BackendService.sendSelfDestructMessage(messageData);
      this.showMessage('Self-destruct message sent', 'success');
    } catch (error) {
      console.error('Backend error:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(messageData);
      this.showMessage('Message saved locally (backend unavailable)', 'warning');
    }
  }

  saveToLocalStorage(messageData) {
    const messages = this.loadLocalMessages();
    messages.push(messageData);
    localStorage.setItem('4word_messages', JSON.stringify(messages));
  }

  loadLocalMessages() {
    try {
      const stored = localStorage.getItem('4word_messages');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading local messages:', error);
      return [];
    }
  }

  async loadMessages() {
    console.log('Loading messages from all sources...');
    
    try {
      let allMessages = [];

      // Load from backend
      try {
        const backendResponse = await BackendService.getMessages(this.currentUser.username);
        const backendMessages = backendResponse.messages || [];
        allMessages = allMessages.concat(backendMessages.map(msg => ({
          ...msg,
          source: 'backend'
        })));
      } catch (error) {
        console.warn('Failed to load backend messages:', error);
      }

      // Load from blockchain
      try {
        if (Web3Service.isConnected) {
          const blockchainMessages = await Web3Service.getMessages(this.currentUser.username);
          allMessages = allMessages.concat(blockchainMessages.map(msg => ({
            ...msg,
            source: 'blockchain'
          })));
        }
      } catch (error) {
        console.warn('Failed to load blockchain messages:', error);
      }

      // Load from localStorage
      const localMessages = this.loadLocalMessages();
      allMessages = allMessages.concat(localMessages);

      // Sort by timestamp
      allMessages.sort((a, b) => a.timestamp - b.timestamp);

      this.messages = allMessages;
      this.displayMessages();

    } catch (error) {
      console.error('Error loading messages:', error);
      this.showMessage('Failed to load messages', 'error');
    }
  }

  displayMessages() {
    const chatMessages = this.container.querySelector('#chatMessages');
    
    // Filter messages based on selected receiver
    const filteredMessages = this.messages.filter(msg => {
      if (this.selectedReceiver === '@everyone') {
        return msg.receiver === '@everyone' || msg.sender === this.currentUser.username;
      } else {
        return (msg.sender === this.currentUser.username && msg.receiver === this.selectedReceiver) ||
               (msg.sender === this.selectedReceiver && msg.receiver === this.currentUser.username) ||
               (msg.receiver === '@everyone');
      }
    });

    if (filteredMessages.length === 0) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <i class="fas fa-comments fa-3x"></i>
          <h3>No messages yet</h3>
          <p>Start a conversation by sending a message</p>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = filteredMessages.map(msg => this.renderMessage(msg)).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  renderMessage(msg) {
    const isOwnMessage = msg.sender === this.currentUser.username;
    const messageClass = isOwnMessage ? 'chat-message own-message' : 'chat-message';
    const typeIcon = this.getTypeIcon(msg.type);
    const sourceIcon = this.getSourceIcon(msg.source);

    return `
      <div class="${messageClass}">
        <div class="message-header">
          <div class="message-sender-info">
            <span class="message-sender">${msg.senderName || msg.sender}</span>
            ${msg.receiver !== '@everyone' ? `
              <span class="message-receiver">
                <i class="fas fa-arrow-right"></i>
                ${msg.receiver}
              </span>
            ` : ''}
          </div>
          <div class="message-meta">
            ${typeIcon}
            ${sourceIcon}
            <span class="message-time">${this.formatTime(msg.timestamp)}</span>
          </div>
        </div>
        <div class="message-content ${msg.type}">
          <p>${this.escapeHtml(msg.content)}</p>
          ${msg.file ? this.renderAttachment(msg.file) : ''}
        </div>
      </div>
    `;
  }

  getTypeIcon(type) {
    const icons = {
      'permanent': '<i class="fas fa-save" title="Permanent"></i>',
      'temporary': '<i class="fas fa-clock" title="Temporary"></i>',
      'self-destruct': '<i class="fas fa-bomb" title="Self-Destruct"></i>',
    };
    return icons[type] || '';
  }

  getSourceIcon(source) {
    const icons = {
      'blockchain': '<span class="storage-badge blockchain"><i class="fas fa-cube"></i></span>',
      'backend': '<span class="storage-badge backend"><i class="fas fa-server"></i></span>',
    };
    return icons[source] || '';
  }

  renderAttachment(file) {
    return `
      <div class="message-attachment">
        <i class="fas fa-file"></i>
        <span>${this.escapeHtml(file.name)}</span>
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showMessage(text, type) {
    const event = new CustomEvent('show-message', {
      detail: { text, type }
    });
    window.dispatchEvent(event);
  }

  destroy() {
    // Remove document event listener to prevent memory leaks and errors
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
    
    // Remove container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
