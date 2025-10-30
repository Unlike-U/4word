import Web3Service from '../services/Web3Service.js';
import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import MessageManager from '../managers/MessageManager.js';

export class WalletConnector {
  constructor(currentUser) {
    this.container = null;
    this.currentUser = currentUser;
    this.isConnected = false;
    this.account = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'wallet-connector';
    
    this.updateUI();
    this.attachEventListeners();
    
    return this.container;
  }

  updateUI() {
    const status = Web3Service.getConnectionStatus();
    this.isConnected = status.isConnected;
    this.account = status.account;

    if (this.isConnected) {
      this.container.innerHTML = `
        <div class="wallet-status connected">
          <div class="wallet-info">
            <i class="fas fa-wallet"></i>
            <span class="wallet-address">${Web3Service.formatAddress(this.account)}</span>
            <span class="wallet-network">${status.network}</span>
          </div>
          <button class="wallet-disconnect-btn" id="disconnectWalletBtn">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <button class="wallet-connect-btn" id="connectWalletBtn">
          <i class="fab fa-ethereum"></i>
        </button>
      `;
    }

    this.attachEventListeners();
  }

  attachEventListeners() {
    const connectBtn = this.container.querySelector('#connectWalletBtn');
    const disconnectBtn = this.container.querySelector('#disconnectWalletBtn');

    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.handleConnect());
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.handleDisconnect());
    }

    // Listen for Web3 events
    EventBus.on(EVENTS.WEB3.CONNECTED, () => this.updateUI());
    EventBus.on(EVENTS.WEB3.DISCONNECTED, () => this.updateUI());
    EventBus.on(EVENTS.WEB3.ACCOUNT_CHANGED, () => this.updateUI());
  }

  async handleConnect() {
    const account = await Web3Service.connectWallet();
    
    if (account) {
      // Check if username is registered
      const isRegistered = await Web3Service.isUsernameRegistered(this.currentUser.username);
      
      if (!isRegistered) {
        MessageManager.showInfo('Registering your username on blockchain...');
        try {
          await Web3Service.registerUsername(this.currentUser.username);
        } catch (error) {
          console.error('Failed to register username:', error);
        }
      }
    }
  }

  handleDisconnect() {
    Web3Service.disconnect();
  }

  destroy() {
    EventBus.off(EVENTS.WEB3.CONNECTED);
    EventBus.off(EVENTS.WEB3.DISCONNECTED);
    EventBus.off(EVENTS.WEB3.ACCOUNT_CHANGED);
    
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
