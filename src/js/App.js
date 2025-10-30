import EventBus from './utils/EventBus.js';
import { EVENTS } from './constants/events.js';
import { LoginView } from './components/LoginView.js';
import { MainApp } from './components/MainApp.js';
import MessageNotification from './components/MessageNotification.js';

export class App {
  constructor() {
    this.container = null;
    this.loginView = null;
    this.mainApp = null;
    this.currentUser = null;
    this.messageNotification = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on(EVENTS.USER.LOGIN, (user) => {
      this.handleLogin(user);
    });

    EventBus.on(EVENTS.USER.LOGOUT, () => {
      this.handleLogout();
    });

    // Listen for show-message events
    window.addEventListener('show-message', (event) => {
      const { text, type } = event.detail;
      this.messageNotification.show(text, type);
    });
  }

  render() {
    this.container = document.createElement('div');
    this.container.id = 'app';

    // Create message notification system
    this.messageNotification = new MessageNotification();
    document.body.appendChild(this.messageNotification.render());

    // Check if user is logged in
    const savedUser = this.getSavedUser();
    
    if (savedUser) {
      this.handleLogin(savedUser);
    } else {
      this.showLogin();
    }

    return this.container;
  }

  showLogin() {
    this.clearContainer();
    this.loginView = new LoginView();
    this.container.appendChild(this.loginView.render());
  }

  async handleLogin(user) {
    console.log('User logged in:', user);
    this.currentUser = user;
    
    // Save user to sessionStorage
    this.saveUser(user);
    
    // Clear login view
    this.clearContainer();
    
    // Show main app (await the async render)
    this.mainApp = new MainApp(user);
    const mainAppElement = await this.mainApp.render();
    this.container.appendChild(mainAppElement);
  }

  handleLogout() {
    console.log('User logged out');
    
    // Clear saved user
    this.clearSavedUser();
    
    // Destroy main app
    if (this.mainApp) {
      this.mainApp.destroy();
      this.mainApp = null;
    }
    
    // Show login
    this.currentUser = null;
    this.showLogin();
  }

  clearContainer() {
    if (this.loginView) {
      this.loginView.destroy?.();
      this.loginView = null;
    }
    
    this.container.innerHTML = '';
  }

  saveUser(user) {
    // Don't save password hash to session
    const userToSave = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      publicKey: user.publicKey,
      privateKey: user.privateKey,
      avatar: user.avatar,
    };
    
    sessionStorage.setItem('4word_current_user', JSON.stringify(userToSave));
  }

  getSavedUser() {
    const saved = sessionStorage.getItem('4word_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        return null;
      }
    }
    return null;
  }

  clearSavedUser() {
    sessionStorage.removeItem('4word_current_user');
  }

  destroy() {
    if (this.mainApp) {
      this.mainApp.destroy();
    }
    
    if (this.loginView) {
      this.loginView.destroy?.();
    }
    
    if (this.messageNotification) {
      this.messageNotification.destroy?.();
    }
    
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    EventBus.off(EVENTS.USER.LOGIN);
    EventBus.off(EVENTS.USER.LOGOUT);
  }
}
