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
    <div class="chat-view">
      <div class="stego-header">
            <h2>
          <i class="fas fa-terminal"></i>
          Terminal
        </h2>
        <p class="stego-subtitle">Terminal Messages for Ultra Grade Privacy</p>
        </div>
      <div class="terminal-output" id="terminalOutput">
              <div class="terminal-line command">help</div>
              <div class="terminal-line output">$commands - List of Commands</div>
              <div class="terminal-line output">$help - help or $help [CommandName]</div>
              <div class="terminal-line output">$clr - clear terminal screen</div>
              <div class="terminal-line output"></div>
            </div>
        <form class="terminal-input-container" id="terminalForm">
              <input 
                type="text" 
                class="terminal-input" 
                id="terminalInput" 
                placeholder="Enter command..."
                autocomplete="off"
              />
              <button class="terminal-submit" id="terminalSubmit">
                <i class="fas fa-play"></i>
              </button>
            </form>
      </div>
    `;

    this.attachEventListeners();
    this.loadMessages();

    return this.container;
  }

  attachEventListeners() {


    // Form submit
    const terminalForm = this.container.querySelector('#terminalForm');
    terminalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Auto-resize textarea
    const terminalInput = this.container.querySelector('#terminalInput');
    terminalInput.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    // Close emoji picker when clicking outside - FIXED
    this.documentClickHandler = (e) => {
      // Safety check: ensure container exists
      if (!this.container) {
        return;
      }
      
      
    };
    
    document.addEventListener('click', this.documentClickHandler);
  }

  getOnlineUsers() {
    return StateManager.getUsers();
  }

  async sendMessage() {
    const terminalInput = this.container.querySelector('#terminalInput');
    const message = terminalInput.value.trim();

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
      terminalInput.value = '';
      terminalInput.style.height = 'auto';
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
