import '../styles/main.scss';
import { App } from './App.js';
import { StateManager } from './managers/StateManager.js';

console.log('4Word Client Loading...');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, initializing app...');
  
  // Create and render app
  const app = new App();
  const appElement = app.render();
  document.body.appendChild(appElement);
  
  console.log('4Word App initialized successfully!');
});

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Set user offline if logged in
  const currentUser = StateManager.getCurrentUser();
  if (currentUser) {
    console.log('User logging out on page close');
    StateManager.clear();
  }
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('App hidden (tab switched)');
  } else {
    console.log('App visible (tab active)');
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
