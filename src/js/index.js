import '../styles/main.scss';
import { App } from './App.js';
import { StateManager } from './managers/StateManager.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, initializing app...');
  
  // Clean up any read self-destruct messages on app start
  StateManager.cleanupSelfDestructMessages();
  
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('App container not found!');
    return;
  }

  try {
    const app = new App();
    const appElement = app.render();
    appContainer.appendChild(appElement);
    console.log('4WORD App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    appContainer.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error Loading App</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
});

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
