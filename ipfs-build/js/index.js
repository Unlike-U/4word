import '../styles/main.scss';
import stateManager from './state/stateManager.js';
import { LoginForm } from './components/LoginForm.js';
import { MainApp } from './components/MainApp.js';
import { ThreeBackground } from './services/threeBackground.js';
import initialUsersData from '../data/initialUsers.json';

class FourWordApp {
  constructor() {
    this.state = stateManager;
    this.currentView = null;
    this.threeBackground = null;
    
    this.init();
  }

  init() {
    // Initialize users from JSON
    const existingUsers = this.state.getState('users');
    const mergedUsers = { ...initialUsersData, ...existingUsers };
    this.state.setState('users', mergedUsers);

    // Try to restore from localStorage (with error handling)
    this.state.restore();

    // Initialize Three.js background
    setTimeout(() => {
      const canvas = document.getElementById('three-bg');
      if (canvas) {
        this.threeBackground = new ThreeBackground(canvas);
      }
    }, 500);

    // Subscribe to state changes
    this.state.subscribe((change) => {
      if (change.path === 'currentUser') {
        this.renderApp();
      }
    });

    // Initial render
    this.renderApp();

    // Initialize security features
    this.initSecurityFeatures();
  }

  initSecurityFeatures() {
    // Auto-clear sensitive data on page unload
    window.addEventListener('beforeunload', () => {
      // Clear any sensitive data from memory
      this.state.setState('ui.encryptKey', '');
      this.state.setState('ui.encryptKey2', '');
    });

    // Add visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App hidden - session paused');
      } else {
        console.log('App visible - session resumed');
      }
    });

    // Disable text selection for sensitive areas (optional)
    document.addEventListener('selectstart', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('no-select')) {
        e.preventDefault();
      }
    });

    // Prevent context menu on sensitive elements (optional)
    document.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('no-context')) {
        e.preventDefault();
      }
    });
  }

  renderApp() {
    const appContainer = document.getElementById('app');
    const currentUser = this.state.getState('currentUser');

    if (!appContainer) {
      console.error('App container not found');
      return;
    }

    if (!currentUser) {
      this.currentView = new LoginForm(appContainer, this.state);
    } else {
      this.currentView = new MainApp(appContainer, this.state);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    new FourWordApp();
    console.log('4WORD App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // Show error to user
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; text-align: center;">
            <h1 style="color: #ff3b30; margin-bottom: 1rem;">⚠️ Initialization Error</h1>
            <p style="color: #1c1e21; margin-bottom: 1rem;">Failed to start the application. Please try:</p>
            <ul style="text-align: left; color: #65676b; margin-bottom: 1rem;">
              <li>Clear browser cache and cookies</li>
              <li>Refresh the page</li>
              <li>Try in incognito/private mode</li>
            </ul>
            <button onclick="localStorage.clear(); location.reload();" style="background: #0088cc; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Clear Data & Reload
            </button>
            <p style="font-size: 12px; color: #8a8d91; margin-top: 1rem;">Error: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }
});

// Export for debugging (remove in production)
if (typeof window !== 'undefined') {
  window.__4WORD_DEBUG__ = {
    version: '2.0.0',
    clearData: () => {
      localStorage.clear();
      location.reload();
    },
    getState: () => {
      console.log('Current state available in console');
      return stateManager.getState();
    }
  };
}
