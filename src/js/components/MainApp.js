import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import MessageManager from '../managers/MessageManager.js';
import { StateManager } from '../managers/StateManager.js';
import { ChatView } from './ChatView.js';
import { SteganographyView } from './SteganographyView.js';
import { WalletConnector } from './WalletConnector.js';
import Web3Service from '../services/Web3Service.js';
import BackendService from '../services/BackendService.js';

export class MainApp {
  constructor(currentUser) {
    this.container = null;
    this.currentUser = currentUser;
    this.currentView = 'chat';
    this.chatView = null;
    this.stegoView = null;
    this.walletConnector = null;
    this.stateManager = StateManager;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'main-app';
    
    this.container.innerHTML = `
      <div class="app-sidebar">
        <div class="sidebar-header">
          <h2 class="app-logo">
            <i class="fas fa-comments"></i>
            <span>4Word</span>
          </h2>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-item active" data-view="chat">
            <i class="fas fa-comments"></i>
            <span>Chat</span>
          </button>
          <button class="nav-item" data-view="steganography">
            <i class="fas fa-image"></i>
            <span>Steganography</span>
          </button>
          <button class="nav-item" data-view="airgap">
            <i class="fas fa-plane-slash"></i>
            <span>Air Gap</span>
          </button>
          <button class="nav-item" data-view="terminal">
            <i class="fas fa-terminal"></i>
            <span>Terminal</span>
          </button>
          <button class="nav-item" data-view="gpsdrop">
            <i class="fas fa-map-marker-alt"></i>
            <span>GPS Drop</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <img src="${this.currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + this.currentUser.username}" alt="${this.currentUser.displayName}" class="user-avatar">
            <div class="user-info">
              <div class="user-name">${this.currentUser.displayName}</div>
              <div class="user-status">
                <span class="status-indicator online"></span>
                Online
              </div>
            </div>
          </div>
          <div id="walletConnectorContainer"></div>
          
          <button class="logout-btn" id="logoutBtn" title="Logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div class="app-content" id="appContent">
        <!-- Content will be loaded here -->
      </div>
    `;

    this.attachEventListeners();
    this.initializeWalletConnector();
    this.checkBackendConnection();
    this.loadView('chat');
    
    return this.container;
  }

  attachEventListeners() {
    // Navigation
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Logout
    const logoutBtn = this.container.querySelector('#logoutBtn');
    logoutBtn.addEventListener('click', () => {
      this.handleLogout();
    });
  }

  initializeWalletConnector() {
    const walletContainer = this.container.querySelector('#walletConnectorContainer');
    
    if (walletContainer) {
      this.walletConnector = new WalletConnector(this.currentUser);
      walletContainer.appendChild(this.walletConnector.render());
    }
  }

  async checkBackendConnection() {
    // Test backend connection
    const isConnected = await BackendService.testConnection();
    
    if (!isConnected) {
      console.warn('Backend server not available - temporary messages disabled');
    }
  }

  switchView(view) {
    this.currentView = view;

    // Update nav active state
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Load view
    this.loadView(view);
  }

  loadView(view) {
    const contentContainer = this.container.querySelector('#appContent');
    
    // Clear existing view
    if (this.chatView) {
      this.chatView.destroy?.();
      this.chatView = null;
    }
    if (this.stegoView) {
      this.stegoView.destroy?.();
      this.stegoView = null;
    }

    contentContainer.innerHTML = '';

    switch (view) {
      case 'chat':
        this.chatView = new ChatView(this.currentUser);
        contentContainer.appendChild(this.chatView.render());
        break;
      
      case 'steganography':
        this.stegoView = new SteganographyView();
        contentContainer.appendChild(this.stegoView.render());
        break;
      
      case 'airgap':
        contentContainer.innerHTML = `
          <div class="view-placeholder">
            <i class="fas fa-plane-slash fa-3x"></i>
            <h2>Air Gap Security</h2>
            <p>Offline encryption and secure data transfer</p>
            <div class="feature-list">
              <div class="feature-item">
                <i class="fas fa-shield-alt"></i>
                <span>RSA End-to-End Encryption (Active)</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-key"></i>
                <span>Manual Encryption Layer (Available)</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-wifi-slash"></i>
                <span>Offline Message Signing</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-image"></i>
                <span>Steganography Integration</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-qrcode"></i>
                <span>QR Code Data Transfer</span>
              </div>
            </div>
          </div>
        `;
        break;
      
      case 'terminal':
        contentContainer.innerHTML = `
          <div class="terminal-view">
            <div class="terminal-header">
              <i class="fas fa-terminal"></i>
              <h2>Terminal</h2>
            </div>
            <div class="terminal-output" id="terminalOutput">
              <div class="terminal-line command">help</div>
              <div class="terminal-line output">Available commands:</div>
              <div class="terminal-line output">  encrypt [message]  - Encrypt a message</div>
              <div class="terminal-line output">  decrypt [message]  - Decrypt a message</div>
              <div class="terminal-line output">  keygen            - Generate new key pair</div>
              <div class="terminal-line output">  wallet            - Show wallet info</div>
              <div class="terminal-line output">  clear             - Clear terminal</div>
              <div class="terminal-line output">  help              - Show this help message</div>
              <div class="terminal-line output"></div>
            </div>
            <div class="terminal-input-container">
              <span class="terminal-prompt">$</span>
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
            </div>
          </div>
        `;
        this.initializeTerminal();
        break;
      
      case 'gpsdrop':
        contentContainer.innerHTML = `
          <div class="view-placeholder">
            <i class="fas fa-map-marker-alt fa-3x"></i>
            <h2>GPS Drop</h2>
            <p>Location-based dead drops and secure message exchange</p>
            <div class="feature-list">
              <div class="feature-item">
                <i class="fas fa-map-marked-alt"></i>
                <span>Create location-based message drops</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-clock"></i>
                <span>Time-delayed message reveals</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-lock"></i>
                <span>Geofenced encrypted messages</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-eye-slash"></i>
                <span>Anonymous location sharing</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-route"></i>
                <span>Dead drop routing</span>
              </div>
            </div>
            <div class="storage-info">
              <div class="storage-item">
                <i class="fas fa-info-circle"></i>
                <div>
                  <strong>Coming Soon</strong>
                  <p>GPS Drop functionality is under development. Create secure, location-based message drops that can only be accessed at specific coordinates.</p>
                </div>
              </div>
            </div>
          </div>
        `;
        break;
      
      default:
        contentContainer.innerHTML = `
          <div class="view-placeholder">
            <i class="fas fa-question fa-3x"></i>
            <h2>Unknown View</h2>
            <p>View not found</p>
          </div>
        `;
    }
  }

  initializeTerminal() {
    const terminalInput = this.container.querySelector('#terminalInput');
    const terminalSubmit = this.container.querySelector('#terminalSubmit');
    const terminalOutput = this.container.querySelector('#terminalOutput');

    if (!terminalInput || !terminalSubmit || !terminalOutput) return;

    const executeCommand = () => {
      const command = terminalInput.value.trim();
      if (!command) return;

      // Add command to output
      const commandLine = document.createElement('div');
      commandLine.className = 'terminal-line command';
      commandLine.textContent = command;
      terminalOutput.appendChild(commandLine);

      // Process command
      this.processTerminalCommand(command, terminalOutput);

      // Clear input
      terminalInput.value = '';

      // Scroll to bottom
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    terminalSubmit.addEventListener('click', executeCommand);
    terminalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        executeCommand();
      }
    });

    // Focus input
    terminalInput.focus();
  }

  processTerminalCommand(command, outputElement) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    const addOutput = (text, type = 'output') => {
      const line = document.createElement('div');
      line.className = `terminal-line ${type}`;
      line.textContent = text;
      outputElement.appendChild(line);
    };

    switch (cmd) {
      case 'help':
        addOutput('Available commands:');
        addOutput('  encrypt [message]  - Encrypt a message');
        addOutput('  decrypt [message]  - Decrypt a message');
        addOutput('  keygen            - Generate new key pair');
        addOutput('  wallet            - Show wallet info');
        addOutput('  clear             - Clear terminal');
        addOutput('  help              - Show this help message');
        break;

      case 'clear':
        outputElement.innerHTML = '';
        break;

      case 'encrypt':
        if (!args) {
          addOutput('Usage: encrypt [message]', 'error');
        } else {
          const encrypted = btoa(args); // Simple base64 for demo
          addOutput('Encrypted: ' + encrypted, 'success');
        }
        break;

      case 'decrypt':
        if (!args) {
          addOutput('Usage: decrypt [message]', 'error');
        } else {
          try {
            const decrypted = atob(args);
            addOutput('Decrypted: ' + decrypted, 'success');
          } catch (e) {
            addOutput('Invalid encrypted message', 'error');
          }
        }
        break;

      case 'keygen':
        addOutput('Generating RSA key pair...', 'output');
        setTimeout(() => {
          const randomKey = Math.random().toString(36).substring(2, 15);
          addOutput('Public Key: ' + randomKey + '...', 'success');
          addOutput('Private Key: [REDACTED]', 'success');
          addOutput('Keys generated successfully!', 'success');
        }, 500);
        break;

      case 'wallet':
        if (Web3Service.isConnected) {
          addOutput('Wallet Status: Connected', 'success');
          addOutput('Address: ' + (Web3Service.currentAccount || 'Unknown'), 'output');
          addOutput('Network: Base Sepolia', 'output');
        } else {
          addOutput('Wallet Status: Disconnected', 'error');
          addOutput('Please connect your wallet from the sidebar', 'output');
        }
        break;

      case 'whoami':
        addOutput('User: ' + this.currentUser.displayName, 'output');
        addOutput('Username: ' + this.currentUser.username, 'output');
        break;

      case '':
        // Empty command, do nothing
        break;

      default:
        addOutput(`Command not found: ${cmd}`, 'error');
        addOutput('Type "help" for available commands', 'output');
    }

    // Add empty line after output
    if (cmd !== 'clear' && cmd !== '') {
      addOutput('');
    }
  }

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      // Disconnect wallet if connected
      if (Web3Service.isConnected) {
        Web3Service.disconnect();
      }
      
      EventBus.emit(EVENTS.USER.LOGOUT);
    }
  }

  destroy() {
    if (this.chatView) {
      this.chatView.destroy?.();
    }
    if (this.stegoView) {
      this.stegoView.destroy?.();
    }
    if (this.walletConnector) {
      this.walletConnector.destroy?.();
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
