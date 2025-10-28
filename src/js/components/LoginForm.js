import { createElement, icons } from '../utils/helpers.js';
import { EncryptionService } from '../services/encryption.js';

export class LoginForm {
  constructor(container, stateManager) {
    this.container = container;
    this.state = stateManager;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="login-terminal">
        <div class="terminal-window">
          <div class="terminal-header-bar">
            <span class="terminal-dot red"></span>
            <span class="terminal-dot yellow"></span>
            <span class="terminal-dot green"></span>
          </div>
          
          <div class="terminal-body">
            <div class="boot-sequence">
              <div class="boot-line">INITIALIZING SECURE COMMUNICATION PROTOCOL...</div>
              <div class="boot-line">LOADING ENCRYPTION MODULES... <span class="success">OK</span></div>
              <div class="boot-line">ESTABLISHING SECURE CONNECTION... <span class="success">OK</span></div>
              <div class="boot-line blink-slow">READY FOR AUTHENTICATION</div>
            </div>

            <div class="login-branding">
              <pre class="ascii-logo">
 ██╗  ██╗██╗    ██╗ ██████╗ ██████╗ ██████╗ 
 ██║  ██║██║    ██║██╔═══██╗██╔══██╗██╔══██╗
 ███████║██║ █╗ ██║██║   ██║██████╔╝██║  ██║
 ╚════██║██║███╗██║██║   ██║██╔══██╗██║  ██║
      ██║╚███╔███╔╝╚██████╔╝██║  ██║██████╔╝
      ╚═╝ ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ 
              </pre>
              <div class="login-subtitle">SECURE.ENCRYPTED.UNTRACEABLE</div>
              <div class="login-version">v2.0.0-UNDERGROUND</div>
            </div>

            <form class="login-form-terminal" id="loginForm">
              <div class="terminal-prompt-line">
                <span class="prompt">root@4word:~$</span>
                <span class="command-text">authenticate</span>
              </div>

              <div class="form-field-terminal">
                <label class="field-label">
                  <span class="bracket">[</span>USERNAME<span class="bracket">]</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-prefix">@</span>
                  <input 
                    type="text" 
                    id="username" 
                    class="terminal-input-field" 
                    placeholder="username"
                    autocomplete="username"
                    autocapitalize="off"
                  />
                </div>
              </div>

              <div class="form-field-terminal">
                <label class="field-label">
                  <span class="bracket">[</span>PASSPHRASE<span class="bracket">]</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-prefix">🔑</span>
                  <input 
                    type="password" 
                    id="passphrase" 
                    class="terminal-input-field" 
                    placeholder="••••••••"
                    autocomplete="current-password"
                  />
                </div>
              </div>

              <div class="action-buttons-terminal">
                <button type="submit" class="btn-terminal-action primary">
                  <span class="btn-icon">▶</span> LOGIN
                </button>
                <button type="button" class="btn-terminal-action secondary" id="registerBtn">
                  <span class="btn-icon">+</span> REGISTER
                </button>
              </div>

              <div class="demo-info">
                <div class="info-header">[ DEMO ACCOUNTS ]</div>
                <div class="demo-account">@alice : password123</div>
                <div class="demo-account">@bob : password123</div>
              </div>
            </form>

            <div class="security-notice">
              <div class="notice-line">⚠ AES-256 ENCRYPTION ENABLED</div>
              <div class="notice-line">⚠ ZERO-KNOWLEDGE ARCHITECTURE</div>
              <div class="notice-line">⚠ END-TO-END ENCRYPTED</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    registerBtn.addEventListener('click', () => {
      this.handleRegister();
    });
  }

  async handleLogin() {
    const username = document.getElementById('username').value.trim();
    const passphrase = document.getElementById('passphrase').value;

    // Add @ if missing
    const formattedUsername = username.startsWith('@') ? username : '@' + username;

    const users = this.state.getState('users');
    const userData = users[formattedUsername];

    if (!userData) {
      this.showError('USER NOT FOUND IN DATABASE');
      return;
    }

    if (!EncryptionService.verifyPassword(passphrase, userData.passphraseHash)) {
      this.showError('AUTHENTICATION FAILED: INVALID PASSPHRASE');
      return;
    }

    this.showSuccess('AUTHENTICATION SUCCESSFUL');
    
    setTimeout(() => {
      this.state.setState('currentUser', userData);
    }, 500);
  }

  async handleRegister() {
    const username = document.getElementById('username').value.trim();
    const passphrase = document.getElementById('passphrase').value;

    // Add @ if missing
    const formattedUsername = username.startsWith('@') ? username : '@' + username;

    if (formattedUsername.length < 3) {
      this.showError('USERNAME TOO SHORT (MIN 3 CHARS)');
      return;
    }

    if (passphrase.length < 6) {
      this.showError('PASSPHRASE TOO WEAK (MIN 6 CHARS)');
      return;
    }

    const users = this.state.getState('users');

    if (users[formattedUsername]) {
      this.showError('USERNAME ALREADY EXISTS IN DATABASE');
      return;
    }

    this.showSuccess('GENERATING KEYPAIR...');

    // Generate keypair
    const keyPair = await EncryptionService.generateSimpleKeyPair();

    // Hash password
    const passwordHash = EncryptionService.hashPassword(passphrase);

    const newUser = {
      username: formattedUsername,
      passphraseHash: passwordHash.combined,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      friends: [],
      groups: [],
      messages: [],
      friendRequests: [],
      groupInvites: [],
      deadDrops: [],
      createdAt: new Date().toISOString()
    };

    users[formattedUsername] = newUser;
    this.state.setState('users', users);
    this.state.persist();

    this.showSuccess(`ACCOUNT CREATED: ${formattedUsername}`);
    
    // Clear form
    setTimeout(() => {
      document.getElementById('username').value = '';
      document.getElementById('passphrase').value = '';
    }, 1500);
  }

  showError(message) {
    const errorDiv = createElement('div', 'terminal-alert error');
    errorDiv.innerHTML = `
      <div class="alert-icon">✗</div>
      <div class="alert-message">${message}</div>
    `;
    
    const form = document.getElementById('loginForm');
    const existing = form.querySelector('.terminal-alert');
    if (existing) existing.remove();
    
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => errorDiv.remove(), 3000);
  }

  showSuccess(message) {
    const successDiv = createElement('div', 'terminal-alert success');
    successDiv.innerHTML = `
      <div class="alert-icon">✓</div>
      <div class="alert-message">${message}</div>
    `;
    
    const form = document.getElementById('loginForm');
    const existing = form.querySelector('.terminal-alert');
    if (existing) existing.remove();
    
    form.insertBefore(successDiv, form.firstChild);

    setTimeout(() => successDiv.remove(), 3000);
  }
}
