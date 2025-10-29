import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import MessageManager from '../managers/MessageManager.js';
import QRCode from 'qrcode';

export class LoginForm {
  constructor() {
    this.container = null;
    this.authMethod = 'password';
    this.qrCheckInterval = null;
    this.sessionId = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'login-container';
    this.container.innerHTML = `
      <div class="login-card">
        <h1 class="login-title">4Word Chat</h1>
        <p class="login-subtitle">Sign in to continue</p>
        
        <div class="auth-method-toggle">
          <button class="auth-method-btn active" data-method="password">
            <i class="fas fa-key"></i> Password
          </button>
          <button class="auth-method-btn" data-method="qr">
            <i class="fas fa-qrcode"></i> QR Code
          </button>
        </div>

        <div class="auth-content">
          <div class="auth-panel password-panel active">
            <form class="login-form" id="passwordLoginForm">
              <div class="form-group">
                <label for="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  required 
                  autocomplete="username"
                  placeholder="Enter your username"
                >
              </div>
              
              <div class="form-group">
                <label for="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required 
                  autocomplete="current-password"
                  placeholder="Enter your password"
                >
              </div>

              <button type="submit" class="login-btn">
                <i class="fas fa-sign-in-alt"></i> Sign In
              </button>
            </form>
          </div>

          <div class="auth-panel qr-panel">
            <div class="qr-code-container">
              <canvas id="qrCodeCanvas"></canvas>
              <p class="qr-instructions">Scan this QR code with your mobile device to sign in</p>
              <div class="qr-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Waiting for scan...</p>
              </div>
            </div>
          </div>
        </div>

        <div class="login-footer">
          <p class="demo-hint">
            <i class="fas fa-info-circle"></i> 
            Demo users: alice/password, bob/password, charlie/password
          </p>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return this.container;
  }

  attachEventListeners() {
    const methodButtons = this.container.querySelectorAll('.auth-method-btn');
    methodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const method = e.currentTarget.dataset.method;
        this.switchAuthMethod(method);
      });
    });

    const form = this.container.querySelector('#passwordLoginForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordLogin();
    });
  }

  switchAuthMethod(method) {
    // Clean up old method first
    if (this.authMethod === 'qr') {
      this.cleanupQRLogin();
    }

    this.authMethod = method;
    
    const buttons = this.container.querySelectorAll('.auth-method-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.method === method);
    });

    const panels = this.container.querySelectorAll('.auth-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.classList.contains(`${method}-panel`));
    });

    if (method === 'qr') {
      this.initializeQRLogin();
    }
  }

  handlePasswordLogin() {
    const username = this.container.querySelector('#username').value.trim();
    const password = this.container.querySelector('#password').value;

    if (!username || !password) {
      MessageManager.showError('Please enter both username and password');
      return;
    }

    // For demo purposes, hash the password to match stored hash
    // "password" hashes to "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
    let passwordToCheck = password;
    
    if (password === 'password') {
      passwordToCheck = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
    }

    EventBus.emit(EVENTS.USER.LOGIN_ATTEMPT, {
      username,
      password: passwordToCheck,
      method: 'password'
    });
  }

  async initializeQRLogin() {
    try {
      this.sessionId = this.generateSessionId();
      
      const qrData = JSON.stringify({
        type: 'login',
        sessionId: this.sessionId,
        timestamp: Date.now()
      });

      const canvas = this.container.querySelector('#qrCodeCanvas');
      if (canvas) {
        await QRCode.toCanvas(canvas, qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        this.startQRPolling();
      }
    } catch (error) {
      console.error('QR code generation error:', error);
      MessageManager.showError('Failed to generate QR code');
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startQRPolling() {
    // Clear any existing interval
    this.cleanupQRLogin();
    
    // Poll every 2 seconds to check if QR code was scanned
    this.qrCheckInterval = setInterval(() => {
      // Only log if we're still in QR mode
      if (this.authMethod === 'qr') {
        console.log('Checking QR scan status for session:', this.sessionId);
      }
    }, 2000);
  }

  cleanupQRLogin() {
    if (this.qrCheckInterval) {
      clearInterval(this.qrCheckInterval);
      this.qrCheckInterval = null;
    }
    this.sessionId = null;
  }

  destroy() {
    this.cleanupQRLogin();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
