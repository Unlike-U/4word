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
    // Show loading screen
    this.showBootSequence();

    // Initialize users from JSON
    const existingUsers = this.state.getState('users');
    const mergedUsers = { ...initialUsersData, ...existingUsers };
    this.state.setState('users', mergedUsers);

    // Try to restore from localStorage
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

    // Initial render after boot
    setTimeout(() => {
      this.renderApp();
    }, 2000);

    // Security: Clear clipboard after 30 seconds
    this.initSecurityFeatures();
  }

  showBootSequence() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
      <div class="boot-screen">
        <div class="boot-container">
          <pre class="boot-logo">
 ██╗  ██╗██╗    ██╗ ██████╗ ██████╗ ██████╗ 
 ██║  ██║██║    ██║██╔═══██╗██╔══██╗██╔══██╗
 ███████║██║ █╗ ██║██║   ██║██████╔╝██║  ██║
 ╚════██║██║███╗██║██║   ██║██╔══██╗██║  ██║
      ██║╚███╔███╔╝╚██████╔╝██║  ██║██████╔╝
      ╚═╝ ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ 
          </pre>
          <div class="boot-text">
            <div class="boot-line">[<span class="boot-ok">OK</span>] Loading encryption modules...</div>
            <div class="boot-line">[<span class="boot-ok">OK</span>] Initializing keypair system...</div>
            <div class="boot-line">[<span class="boot-ok">OK</span>] Starting secure session...</div>
            <div class="boot-line blink-slow">System ready. Awaiting authentication...</div>
          </div>
        </div>
      </div>
    `;
  }

  initSecurityFeatures() {
    // Auto-clear sensitive data on page unload
    window.addEventListener('beforeunload', () => {
      // Clear any sensitive data from memory
      this.state.setState('ui.encryptKey', '');
      this.state.setState('ui.encryptKey2', '');
    });

    // Prevent right-click context menu (optional)
    // document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Disable text selection for sensitive areas (optional)
    document.addEventListener('selectstart', (e) => {
      if (e.target.classList.contains('no-select')) {
        e.preventDefault();
      }
    });

    // Add visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App hidden - session paused');
      } else {
        console.log('App visible - session resumed');
      }
    });
  }

  renderApp() {
    const appContainer = document.getElementById('app');
    const currentUser = this.state.getState('currentUser');

    if (!currentUser) {
      this.currentView = new LoginForm(appContainer, this.state);
    } else {
      this.currentView = new MainApp(appContainer, this.state);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FourWordApp();
});

// Export for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  window.__4WORD__ = {
    version: '2.0.0',
    mode: 'underground'
  };
}
