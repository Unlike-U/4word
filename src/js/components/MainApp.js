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
            4Word
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
          <button class="nav-item" data-view="encryption">
            <i class="fas fa-lock"></i>
            <span>Encryption</span>
          </button>
          <button class="nav-item" data-view="settings">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
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
      
      case 'encryption':
        contentContainer.innerHTML = `
          <div class="view-placeholder">
            <i class="fas fa-lock fa-3x"></i>
            <h2>Encryption Tools</h2>
            <p>Advanced encryption utilities</p>
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
                <i class="fas fa-image"></i>
                <span>Steganography (Available)</span>
              </div>
            </div>
          </div>
        `;
        break;
      
      case 'settings':
        contentContainer.innerHTML = `
          <div class="view-placeholder">
            <i class="fas fa-cog fa-3x"></i>
            <h2>Settings</h2>
            <div class="settings-panel">
              <h3>Storage Configuration</h3>
              <div class="setting-item">
                <i class="fas fa-cube"></i>
                <div>
                  <strong>Blockchain (Base)</strong>
                  <p>Permanent messages stored on-chain</p>
                  <span class="status-badge ${Web3Service.isConnected ? 'connected' : 'disconnected'}">
                    ${Web3Service.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div class="setting-item">
                <i class="fas fa-server"></i>
                <div>
                  <strong>Backend Server</strong>
                  <p>Temporary & self-destruct messages</p>
                  <span class="status-badge">VNC Server</span>
                </div>
              </div>
              <div class="setting-item">
                <i class="fas fa-database"></i>
                <div>
                  <strong>Local Storage</strong>
                  <p>Encryption keys & cache</p>
                  <span class="status-badge connected">Active</span>
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
