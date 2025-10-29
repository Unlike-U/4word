import { LoginForm } from './components/LoginForm.js';
import { MainApp } from './components/MainApp.js';
import { StateManager } from './managers/StateManager.js';
import EventBus from './utils/EventBus.js';
import { EVENTS } from './constants/events.js';
import MessageManager from './managers/MessageManager.js';
import KeyPairManager from './services/KeyPairManager.js';

export class App {
  constructor() {
    this.container = null;
    this.currentView = null;
    this.stateManager = StateManager;
    this.currentUser = null;

    this.setupEventListeners();
    
    // Check crypto support on init
    if (!KeyPairManager.isSupported) {
      console.warn('⚠️ Web Crypto API not available - RSA encryption disabled');
      console.warn('Please ensure you are using HTTPS or localhost');
    }
  }

  setupEventListeners() {
    EventBus.on(EVENTS.USER.LOGIN_ATTEMPT, (data) => {
      this.handleLogin(data);
    });

    EventBus.on(EVENTS.USER.LOGOUT, () => {
      this.handleLogout();
    });
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'app-container';

    const savedUser = this.stateManager.getCurrentUser();
    
    if (savedUser) {
      this.currentUser = savedUser;
      this.showMainApp();
    } else {
      this.showLogin();
    }

    return this.container;
  }

  showLogin() {
    if (this.currentView) {
      this.currentView.destroy?.();
    }

    const loginForm = new LoginForm();
    this.currentView = loginForm;
    
    this.container.innerHTML = '';
    this.container.appendChild(loginForm.render());
  }

  showMainApp() {
    if (this.currentView) {
      this.currentView.destroy?.();
    }

    const mainApp = new MainApp(this.currentUser);
    this.currentView = mainApp;
    
    this.container.innerHTML = '';
    this.container.appendChild(mainApp.render());
  }

  async handleLogin(credentials) {
    const { username, password } = credentials;

    try {
      const users = this.stateManager.getUsers();
      
      if (!Array.isArray(users)) {
        console.error('Users is not an array:', users);
        MessageManager.showError('System error: Invalid user data');
        return;
      }

      const user = users.find(u => u.username === username);

      if (!user) {
        MessageManager.showError('Invalid username or password');
        EventBus.emit(EVENTS.USER.LOGIN_FAILURE, { error: 'User not found' });
        return;
      }

      if (user.password !== password) {
        MessageManager.showError('Invalid username or password');
        EventBus.emit(EVENTS.USER.LOGIN_FAILURE, { error: 'Invalid password' });
        return;
      }

      // Try to ensure user has keypair (only if crypto is supported)
      if (KeyPairManager.isSupported) {
        await this.ensureUserHasKeyPair(username, password);
      } else {
        console.warn('Skipping keypair generation - Web Crypto API not available');
        MessageManager.showWarning('RSA encryption unavailable. Using manual encryption only.');
      }

      this.currentUser = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        status: 'online'
      };

      this.stateManager.setCurrentUser(this.currentUser);
      
      const encryptionStatus = KeyPairManager.isSupported 
        ? '🔐 E2E Encryption active' 
        : '⚠️ Manual encryption only';
      
      MessageManager.showSuccess(`Welcome back, ${this.currentUser.displayName}! ${encryptionStatus}`);
      EventBus.emit(EVENTS.USER.LOGIN_SUCCESS, this.currentUser);
      
      this.showMainApp();
    } catch (error) {
      console.error('Login error:', error);
      MessageManager.showError('Login failed: ' + error.message);
      EventBus.emit(EVENTS.USER.LOGIN_FAILURE, { error: error.message });
    }
  }

  async ensureUserHasKeyPair(username, password) {
    const existingKeyPair = this.stateManager.getUserKeyPair(username);
    
    if (!existingKeyPair) {
      console.log(`Generating new RSA keypair for ${username}...`);
      MessageManager.showInfo('Generating encryption keys... (first login)');
      
      try {
        const keyPair = await KeyPairManager.generateKeyPair(username);
        
        const publicKey = await KeyPairManager.exportPublicKey(keyPair.publicKey);
        
        const encryptedPrivateKey = await KeyPairManager.exportPrivateKey(keyPair.privateKey, password);
        
        this.stateManager.saveUserKeyPair(username, publicKey, encryptedPrivateKey);
        
        KeyPairManager.cacheKeyPair(username, keyPair);
        
        console.log(`✅ Keypair generated and saved for ${username}`);
      } catch (error) {
        console.error('Failed to generate keypair:', error);
        throw new Error('Keypair generation failed: ' + error.message);
      }
    } else {
      console.log(`Loading existing keypair for ${username}...`);
      
      try {
        const publicKey = await KeyPairManager.importPublicKey(existingKeyPair.publicKey);
        
        const privateKey = await KeyPairManager.importPrivateKey(existingKeyPair.privateKey, password);
        
        KeyPairManager.cacheKeyPair(username, { publicKey, privateKey });
        
        console.log(`✅ Keypair loaded for ${username}`);
      } catch (error) {
        console.error('Failed to load keypair:', error);
        throw new Error('Failed to load encryption keys. Wrong password?');
      }
    }
  }

  handleLogout() {
    this.currentUser = null;
    this.stateManager.clearCurrentUser();
    KeyPairManager.clearCache();
    MessageManager.showInfo('Logged out successfully');
    this.showLogin();
  }
}
