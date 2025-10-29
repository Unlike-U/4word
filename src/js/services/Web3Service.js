import { ethers } from 'ethers';
import { CONTRACTS, CURRENT_NETWORK } from '../config/contracts.js';
import MessageManager from '../managers/MessageManager.js';
import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';

class Web3ServiceClass {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.isConnected = false;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      MessageManager.showError('Please install MetaMask to use permanent messages');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];

      // Check network
      await this.checkNetwork();

      // Initialize provider and contract
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      this.contract = new ethers.Contract(
        CONTRACTS.MESSAGE_STORAGE.address,
        CONTRACTS.MESSAGE_STORAGE.abi,
        this.signer
      );

      this.isConnected = true;

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
          EventBus.emit(EVENTS.WEB3.ACCOUNT_CHANGED, accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      MessageManager.showSuccess(`Wallet connected: ${this.formatAddress(this.account)}`);
      EventBus.emit(EVENTS.WEB3.CONNECTED, this.account);

      return this.account;

    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        MessageManager.showWarning('Wallet connection rejected');
      } else {
        MessageManager.showError('Failed to connect wallet: ' + error.message);
      }
      
      return null;
    }
  }

  /**
   * Check and switch to correct network
   */
  async checkNetwork() {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (chainId !== CURRENT_NETWORK.chainId) {
        MessageManager.showInfo(`Switching to ${CURRENT_NETWORK.chainName}...`);
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CURRENT_NETWORK.chainId }],
          });
        } catch (switchError) {
          // Network not added, try to add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CURRENT_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('Network check error:', error);
      throw new Error('Failed to switch network');
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.isConnected = false;
    
    EventBus.emit(EVENTS.WEB3.DISCONNECTED);
    MessageManager.showInfo('Wallet disconnected');
  }

  /**
   * Register username to wallet address
   */
  async registerUsername(username) {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      MessageManager.showInfo('Registering username on blockchain...');
      
      const tx = await this.contract.registerUsername(username);
      
      MessageManager.showInfo('Transaction submitted. Waiting for confirmation...');
      await tx.wait();

      MessageManager.showSuccess('Username registered on blockchain!');
      
      return tx.hash;

    } catch (error) {
      console.error('Username registration error:', error);
      
      if (error.message.includes('Username already taken')) {
        MessageManager.showError('Username already registered on blockchain');
      } else if (error.code === 'ACTION_REJECTED') {
        MessageManager.showWarning('Transaction rejected');
      } else {
        MessageManager.showError('Failed to register username: ' + error.message);
      }
      
      throw error;
    }
  }

  /**
   * Store permanent message on blockchain
   */
  async storeMessage(messageData) {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const { senderUsername, receiver, text, rsaEncrypted, manuallyEncrypted } = messageData;

      MessageManager.showInfo('Storing message on blockchain...');

      const tx = await this.contract.storeMessage(
        senderUsername,
        receiver || '', // empty string for public
        text,
        rsaEncrypted || false,
        manuallyEncrypted || false
      );

      MessageManager.showInfo('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();

      // Parse event to get message ID
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log)?.name === 'MessageStored';
        } catch {
          return false;
        }
      });

      let messageId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        messageId = parsed.args.messageId.toString();
      }

      MessageManager.showSuccess('Message stored on blockchain! 🎉');

      return {
        txHash: tx.hash,
        messageId,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Store message error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        MessageManager.showWarning('Transaction rejected');
      } else if (error.message.includes('insufficient funds')) {
        MessageManager.showError('Insufficient funds for gas fees');
      } else {
        MessageManager.showError('Failed to store message: ' + error.message);
      }
      
      throw error;
    }
  }

  /**
   * Get messages from blockchain
   */
  async getMessages(username) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Get messages for this username
      const messageIds = await this.contract.getMessagesForReceiver(username || '');
      
      const messages = [];

      for (const id of messageIds) {
        const msg = await this.contract.getMessage(id);
        
        messages.push({
          id: id.toString(),
          sender: msg.sender,
          senderName: msg.senderUsername,
          receiver: msg.receiver,
          text: msg.encryptedContent,
          timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
          rsaEncrypted: msg.rsaEncrypted,
          manuallyEncrypted: msg.manuallyEncrypted,
          messageType: 'permanent',
          source: 'blockchain'
        });
      }

      console.log(`Loaded ${messages.length} messages from blockchain`);
      return messages;

    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  /**
   * Get public messages from blockchain
   */
  async getPublicMessages() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const messageIds = await this.contract.getPublicMessages();
      
      const messages = [];

      for (const id of messageIds) {
        const msg = await this.contract.getMessage(id);
        
        messages.push({
          id: id.toString(),
          sender: msg.sender,
          senderName: msg.senderUsername,
          receiver: '',
          text: msg.encryptedContent,
          timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
          rsaEncrypted: msg.rsaEncrypted,
          manuallyEncrypted: msg.manuallyEncrypted,
          messageType: 'permanent',
          source: 'blockchain'
        });
      }

      return messages;

    } catch (error) {
      console.error('Get public messages error:', error);
      return [];
    }
  }

  /**
   * Check if username is registered
   */
  async isUsernameRegistered(username) {
    if (!this.contract) return false;

    try {
      const address = await this.contract.usernameToAddress(username);
      return address !== ethers.ZeroAddress;
    } catch {
      return false;
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get current account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      network: CURRENT_NETWORK.chainName
    };
  }
}

export const Web3Service = new Web3ServiceClass();
export default Web3Service;
