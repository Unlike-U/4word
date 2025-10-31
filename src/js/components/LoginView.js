import EventBus from '../utils/EventBus.js';
import { EVENTS } from '../constants/events.js';
import { EncryptionService } from '../services/encryption.js';
import SecureCrypto from '../crypto/webCrypto.js';
import BackendService from '../services/BackendService.js';

export class LoginView {
  constructor() {
    this.container = null;
    this.currentMode = 'login';
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'login-container';

    this.container.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">4Word</h1>
          <p class="login-subtitle">Secure, Private, Decentralized Messaging</p>
        </div>

        <div class="auth-method-toggle">
          <button class="auth-method-btn active" data-mode="login">
            <i class="fas fa-sign-in-alt"></i>
            <span>Login</span>
          </button>
          <button class="auth-method-btn" data-mode="airlink">
            <i class="fas fa-qrcode"></i>
            <span>Air Link</span>
          </button>
          <button class="auth-method-btn" data-mode="signup">
            <i class="fas fa-user-plus"></i>
            <span>Sign Up</span>
          </button>
        </div>

        <div class="auth-content">
          <!-- LOGIN PANEL -->
          <div class="auth-panel active" data-panel="login">
            <form id="loginForm" autocomplete="on">
              <div class="form-group">
                <label for="loginUsername">
                  <i class="fas fa-user"></i>
                  Username
                </label>
                <input
                  type="text"
                  id="loginUsername"
                  name="username"
                  placeholder="Enter your username"
                  autocomplete="username"
                  required
                  autofocus
                />
              </div>

              <div class="form-group">
                <label for="loginPassword">
                  <i class="fas fa-lock"></i>
                  Password
                </label>
                <div class="password-input-group">
                  <input
                    type="password"
                    id="loginPassword"
                    name="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                  />
                  <button type="button" class="toggle-password-btn" data-target="loginPassword">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="form-options">
                <label class="remember-me">
                  <input type="checkbox" id="rememberMe" name="remember">
                  <span>Remember me</span>
                </label>
              </div>

              <button type="submit" class="login-btn" id="loginBtn">
                <i class="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </button>
            </form>
          </div>

          <!-- AIRLOG PANEL -->
          <div class="auth-panel active" data-panel="airlog">
            <form id="airLogger" autocomplete="on">
              
            </form>
          </div>

          <!-- SIGNUP PANEL -->
          <div class="auth-panel" data-panel="signup">
            <form id="signupForm" autocomplete="off">
              <div class="form-group">
                <label for="signupUsername">
                  <i class="fas fa-user"></i>
                  Username
                </label>
                <input
                  type="text"
                  id="signupUsername"
                  name="username"
                  placeholder="Choose a username"
                  autocomplete="off"
                  required
                  minlength="3"
                  maxlength="20"
                  pattern="[a-zA-Z0-9_]+"
                />
                <span class="input-hint">3-20 characters, letters, numbers, and underscores only</span>
              </div>

              <div class="form-group">
                <label for="signupDisplayName">
                  <i class="fas fa-id-card"></i>
                  Display Name
                </label>
                <input
                  type="text"
                  id="signupDisplayName"
                  name="displayName"
                  placeholder="Your display name"
                  autocomplete="off"
                  required
                  maxlength="50"
                />
              </div>

              <div class="form-group">
                <label for="signupPassword">
                  <i class="fas fa-lock"></i>
                  Password
                </label>
                <div class="password-input-group">
                  <input
                    type="password"
                    id="signupPassword"
                    name="password"
                    placeholder="Create a strong password"
                    autocomplete="new-password"
                    required
                    minlength="8"
                  />
                  <button type="button" class="toggle-password-btn" data-target="signupPassword">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <div class="password-strength" id="passwordStrength">
                  <div class="strength-bar">
                    <div class="strength-bar-fill" id="strengthBarFill"></div>
                  </div>
                  <span class="strength-text" id="strengthText">Password strength</span>
                </div>
              </div>

              <div class="form-group">
                <label for="signupConfirmPassword">
                  <i class="fas fa-check-circle"></i>
                  Confirm Password
                </label>
                <div class="password-input-group">
                  <input
                    type="password"
                    id="signupConfirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    autocomplete="new-password"
                    required
                  />
                  <button type="button" class="toggle-password-btn" data-target="signupConfirmPassword">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <span class="input-validation" id="passwordMatch"></span>
              </div>

              <button type="submit" class="login-btn" id="signupBtn">
                <i class="fas fa-user-plus"></i>
                <span>Create Account</span>
              </button>
            </form>
          </div>
        </div>

        <div class="login-footer">
          <p class="footer-text">
            <i class="fas fa-shield-alt"></i>
            End-to-end encrypted • Blockchain powered
          </p>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return this.container;
  }

  attachEventListeners() {
    // Tab switching
    const modeBtns = this.container.querySelectorAll('.auth-method-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Password visibility toggles
    const toggleBtns = this.container.querySelectorAll('.toggle-password-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.togglePasswordVisibility(e.currentTarget);
      });
    });

    // Login form
    const loginForm = this.container.querySelector('#loginForm');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(e);
    });

    // Signup form
    const signupForm = this.container.querySelector('#signupForm');
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup(e);
    });

    // Password strength checker
    const signupPassword = this.container.querySelector('#signupPassword');
    signupPassword.addEventListener('input', (e) => {
      this.checkPasswordStrength(e.target.value);
    });

    // Password match checker
    const confirmPassword = this.container.querySelector('#signupConfirmPassword');
    confirmPassword.addEventListener('input', () => {
      this.checkPasswordMatch();
    });

    // Username validation
    const signupUsername = this.container.querySelector('#signupUsername');
    signupUsername.addEventListener('input', (e) => {
      this.validateUsername(e.target);
    });
  }

  switchMode(mode) {
    this.currentMode = mode;

    // Update buttons
    const modeBtns = this.container.querySelectorAll('.auth-method-btn');
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update panels
    const panels = this.container.querySelectorAll('.auth-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === mode);
    });

    // Focus first input
    setTimeout(() => {
      const firstInput = this.container.querySelector(`.auth-panel[data-panel="${mode}"] input:first-of-type`);
      if (firstInput) firstInput.focus();
    }, 100);
  }

  togglePasswordVisibility(button) {
    const targetId = button.dataset.target;
    const input = this.container.querySelector(`#${targetId}`);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }

  validateUsername(input) {
    const username = input.value;
    const pattern = /^[a-zA-Z0-9_]+$/;

    if (username.length > 0 && !pattern.test(username)) {
      input.setCustomValidity('Only letters, numbers, and underscores allowed');
    } else if (username.length > 0 && username.length < 3) {
      input.setCustomValidity('Username must be at least 3 characters');
    } else {
      input.setCustomValidity('');
    }
  }

  checkPasswordStrength(password) {
    const strengthBar = this.container.querySelector('#strengthBarFill');
    const strengthText = this.container.querySelector('#strengthText');

    let strength = 0;
    let text = '';
    let color = '';

    if (password.length === 0) {
      strength = 0;
      text = 'Password strength';
      color = '#e2e8f0';
    } else if (password.length < 8) {
      strength = 25;
      text = 'Weak';
      color = '#ef4444';
    } else {
      // Base strength from length
      strength = Math.min(password.length * 3, 40);

      // Add points for complexity
      if (/[a-z]/.test(password)) strength += 10;
      if (/[A-Z]/.test(password)) strength += 15;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

      if (strength < 50) {
        text = 'Weak';
        color = '#ef4444';
      } else if (strength < 75) {
        text = 'Medium';
        color = '#f59e0b';
      } else {
        text = 'Strong';
        color = '#10b981';
      }
    }

    strengthBar.style.width = `${strength}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
  }

  checkPasswordMatch() {
    const password = this.container.querySelector('#signupPassword').value;
    const confirmPassword = this.container.querySelector('#signupConfirmPassword').value;
    const matchIndicator = this.container.querySelector('#passwordMatch');

    if (confirmPassword.length === 0) {
      matchIndicator.textContent = '';
      matchIndicator.className = 'input-validation';
    } else if (password === confirmPassword) {
      matchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
      matchIndicator.className = 'input-validation match';
    } else {
      matchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
      matchIndicator.className = 'input-validation no-match';
    }
  }

  async handleLogin(e) {
    const loginBtn = this.container.querySelector('#loginBtn');
    const username = this.container.querySelector('#loginUsername').value.trim();
    const password = this.container.querySelector('#loginPassword').value;
    const rememberMe = this.container.querySelector('#rememberMe').checked;

    if (!username || !password) {
      this.showMessage('Please enter username and password', 'error');
      return;
    }

    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging in...</span>';

    try {
      // Get stored users
      const users = this.getStoredUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Verify password
      const passwordMatch = await EncryptionService.verifyPassword(password, user.passwordHash);

      if (!passwordMatch) {
        throw new Error('Invalid username or password');
      }

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem('4word_remember_user', username);
      } else {
        localStorage.removeItem('4word_remember_user');
      }

      // Update last login
      user.lastLogin = Date.now();
      this.updateUser(user);

      // Ensure user is registered on backend (sync local user to backend)
      try {
        await BackendService.registerUser({
          username: user.username,
          displayName: user.displayName,
          publicKey: user.publicKey,
          avatar: user.avatar,
        });
        console.log('✅ User synced to backend');
      } catch (error) {
        // User might already exist on backend (409 conflict), that's OK
        if (error.response && error.response.status === 409) {
          console.log('✅ User already exists on backend');
        } else {
          console.warn('⚠️ Could not sync user to backend (offline mode):', error.message);
        }
      }

      // Set user online on backend
      try {
        await BackendService.setUserOnline(username, true);
        console.log('✅ User set to online on backend');
      } catch (error) {
        console.warn('⚠️ Could not set online status on server:', error.message);
      }

      this.showMessage('Login successful!', 'success');

      // Emit login event
      setTimeout(() => {
        EventBus.emit(EVENTS.USER.LOGIN, user);
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      this.showMessage(error.message || 'Login failed', 'error');
      
      // Reset button
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
    }
  }

  async handleSignup(e) {
    const signupBtn = this.container.querySelector('#signupBtn');
    const username = this.container.querySelector('#signupUsername').value.trim();
    const displayName = this.container.querySelector('#signupDisplayName').value.trim();
    const password = this.container.querySelector('#signupPassword').value;
    const confirmPassword = this.container.querySelector('#signupConfirmPassword').value;

    // Validation
    if (!username || !displayName || !password || !confirmPassword) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    if (username.length < 3) {
      this.showMessage('Username must be at least 3 characters', 'error');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showMessage('Username can only contain letters, numbers, and underscores', 'error');
      return;
    }

    if (password.length < 8) {
      this.showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showMessage('Passwords do not match', 'error');
      return;
    }

    // Disable button and show loading
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creating account...</span>';

    try {
      // Check if username exists locally
      const users = this.getStoredUsers();
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password (stored locally only - NEVER sent to server)
      const passwordHash = await EncryptionService.hashPassword(password);

      // Generate RSA key pair for the user
      this.showMessage('Generating encryption keys...', 'info');
      const keyPair = await SecureCrypto.generateRSAKeyPair();

      // Create new user
      const newUser = {
        id: this.generateUserId(),
        username: username,
        displayName: displayName,
        passwordHash: passwordHash, // NEVER send this to server
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey, // NEVER send this to server
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };

      // Save user locally (with password hash and private key)
      users.push(newUser);
      this.saveUsers(users);

      // Register user on backend (public data only)
      try {
        await BackendService.registerUser({
          username: newUser.username,
          displayName: newUser.displayName,
          publicKey: newUser.publicKey,
          avatar: newUser.avatar,
        });
        this.showMessage('Account registered on server', 'success');
      } catch (error) {
        console.warn('Could not register on server (offline mode):', error);
        this.showMessage('Account created (offline mode)', 'warning');
      }

      // Add to online users cache
      this.addToOnlineUsers(newUser);

      this.showMessage('Account created successfully!', 'success');

      // Auto-login after signup
      setTimeout(() => {
        EventBus.emit(EVENTS.USER.LOGIN, newUser);
      }, 500);

    } catch (error) {
      console.error('Signup error:', error);
      this.showMessage(error.message || 'Signup failed', 'error');
      
      // Reset button
      signupBtn.disabled = false;
      signupBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Create Account</span>';
    }
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getStoredUsers() {
    const stored = localStorage.getItem('4word_users');
    if (stored) {
      return JSON.parse(stored);
    }

    // Return empty array - no demo users
    return [];
  }

  saveUsers(users) {
    localStorage.setItem('4word_users', JSON.stringify(users));
  }

  updateUser(user) {
    const users = this.getStoredUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      this.saveUsers(users);
    }
  }

  addToOnlineUsers(user) {
    const onlineUsers = localStorage.getItem('4word_online_users');
    let users = onlineUsers ? JSON.parse(onlineUsers) : [];
    
    // Add if not already present
    if (!users.find(u => u.username === user.username)) {
      users.push({
        username: user.username,
        displayName: user.displayName,
        publicKey: user.publicKey,
        avatar: user.avatar,
      });
      localStorage.setItem('4word_online_users', JSON.stringify(users));
    }
  }

  showMessage(text, type) {
    const event = new CustomEvent('show-message', {
      detail: { text, type }
    });
    window.dispatchEvent(event);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
