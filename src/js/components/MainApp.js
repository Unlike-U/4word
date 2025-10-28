import { icons, createElement, formatTime, generateId } from '../utils/helpers.js';
import { EncryptionService } from '../services/encryption.js';
import { CommandService } from '../services/commands.js';
import { QRGenerator } from './QRGenerator.js';
import { InboxView } from './InboxView.js';
import { SteganographyView } from './SteganographyView.js';

export class MainApp {
  constructor(container, stateManager) {
    this.container = container;
    this.state = stateManager;
    this.commandService = new CommandService(stateManager);
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.activeTab = 'feed'; // feed, compose, commands
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    const currentUser = this.state.getState('currentUser');
    const ui = this.state.getState('ui');
    
    this.container.innerHTML = `
      <div class="app-container">
        <!-- Terminal Header -->
        <header class="terminal-header">
          <div class="terminal-bar">
            <div class="terminal-title">
              <span class="terminal-prompt">root@4word:~$</span>
              <span class="terminal-user">${currentUser.username}</span>
            </div>
            <div class="terminal-controls">
              <button class="terminal-btn ${ui.networkEnabled ? 'online' : 'offline'}" id="networkToggle">
                <span class="status-dot"></span>
                ${ui.networkEnabled ? 'ONLINE' : 'OFFLINE'}
              </button>
              <button class="terminal-btn logout" id="logoutBtn">EXIT</button>
            </div>
          </div>
        </header>

        <!-- Mobile Tab Navigation -->
        <nav class="mobile-nav">
          <button class="nav-tab ${this.activeTab === 'feed' ? 'active' : ''}" data-tab="feed">
            <span class="nav-icon">📡</span>
            <span class="nav-label">FEED</span>
          </button>
          <button class="nav-tab ${this.activeTab === 'compose' ? 'active' : ''}" data-tab="compose">
            <span class="nav-icon">✉️</span>
            <span class="nav-label">COMPOSE</span>
          </button>
          <button class="nav-tab ${this.activeTab === 'commands' ? 'active' : ''}" data-tab="commands">
            <span class="nav-icon">⚡</span>
            <span class="nav-label">CMD</span>
          </button>
        </nav>

        <!-- Main Content -->
        <main class="terminal-content">
          <!-- Feed Tab -->
          <section class="content-tab ${this.activeTab === 'feed' ? 'active' : ''}" data-tab-content="feed">
            ${this.renderFeed()}
          </section>

          <!-- Compose Tab -->
          <section class="content-tab ${this.activeTab === 'compose' ? 'active' : ''}" data-tab-content="compose">
            ${this.renderCompose()}
          </section>

          <!-- Commands Tab -->
          <section class="content-tab ${this.activeTab === 'commands' ? 'active' : ''}" data-tab-content="commands">
            ${this.renderCommands()}
          </section>
        </main>
      </div>
    `;

    // Render dynamic content
    this.renderConversationsList();
  }

  renderFeed() {
    return `
      <div class="feed-container">
        <div class="feed-header">
          <h2 class="feed-title">
            <span class="blink">›</span> TRANSMISSION FEED
          </h2>
          <button class="btn-terminal btn-sm" id="inboxBtn">
            ${icons.inbox} INBOX
          </button>
        </div>
        <div class="conversations-list" id="conversationsList">
          <div id="conversationsContainer"></div>
        </div>
      </div>
    `;
  }

  renderCompose() {
    const ui = this.state.getState('ui');
    
    return `
      <div class="compose-container">
        <div class="compose-header">
          <h2 class="compose-title">
            <span class="blink">›</span> NEW TRANSMISSION
          </h2>
        </div>

        <div class="compose-form">
          <!-- Recipient -->
          <div class="terminal-input-group">
            <label class="terminal-label">TO:</label>
            <input 
              type="text" 
              id="recipient" 
              class="terminal-input" 
              placeholder="@username or @everyone"
              value="${ui.recipient}"
            />
          </div>

          <!-- Security Settings (Compact) -->
          <div class="settings-compact">
            <div class="setting-row">
              <label class="setting-label">SEC:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.securityLevel === 'open' ? 'active' : ''}" data-security="open">OPEN</button>
                <button class="btn-mini ${ui.securityLevel === 'encrypted' ? 'active' : ''}" data-security="encrypted">ENC</button>
                <button class="btn-mini ${ui.securityLevel === '2DE' ? 'active' : ''}" data-security="2DE">2DE</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">PRV:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.privacyLevel === 'public' ? 'active' : ''}" data-privacy="public">PUB</button>
                <button class="btn-mini ${ui.privacyLevel === 'groups' ? 'active' : ''}" data-privacy="groups">GRP</button>
                <button class="btn-mini ${ui.privacyLevel === 'private' ? 'active' : ''}" data-privacy="private">PVT</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">PST:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.persistenceLevel === 'permanent' ? 'active' : ''}" data-persistence="permanent">PERM</button>
                <button class="btn-mini ${ui.persistenceLevel === 'undetermined' ? 'active' : ''}" data-persistence="undetermined">UNDET</button>
                <button class="btn-mini ${ui.persistenceLevel === 'self-destruct' ? 'active' : ''}" data-persistence="self-destruct">💣</button>
              </div>
            </div>
          </div>

          <!-- Encryption Key (if needed) -->
          ${ui.securityLevel === 'encrypted' || ui.securityLevel === '2DE' ? `
            <div class="terminal-input-group">
              <label class="terminal-label">KEY:</label>
              <input 
                type="password" 
                id="encryptKey" 
                class="terminal-input" 
                placeholder="encryption.key"
                value="${ui.encryptKey}"
              />
            </div>
          ` : ''}

          ${ui.securityLevel === '2DE' ? `
            <div class="terminal-input-group">
              <label class="terminal-label">KEY2:</label>
              <input 
                type="password" 
                id="encryptKey2" 
                class="terminal-input" 
                placeholder="secondary.key"
                value="${ui.encryptKey2 || ''}"
              />
            </div>
          ` : ''}

          <!-- Message Text -->
          <div class="terminal-input-group">
            <label class="terminal-label">MSG:</label>
            <textarea 
              id="messageText" 
              class="terminal-textarea" 
              placeholder="type.your.message..."
            >${ui.messageText}</textarea>
          </div>

          <!-- Attached File -->
          ${ui.attachedFile ? `
            <div class="attached-file-terminal">
              <span class="file-indicator">📎 ${ui.attachedFile.name}</span>
              <button class="btn-remove-terminal" id="removeFile">×</button>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="compose-actions-grid">
            <button class="btn-terminal btn-primary" id="sendBtn">
              ${icons.send} SEND
            </button>

            <label class="btn-terminal">
              ${icons.paperclip} FILE
              <input type="file" id="fileInput" style="display: none;" />
            </label>

            <button class="btn-terminal ${ui.isRecording ? 'recording' : ''}" id="voiceBtn">
              ${icons.mic} ${ui.isRecording ? 'REC...' : 'VOICE'}
            </button>

            <button class="btn-terminal" id="locationBtn">
              ${icons.mapPin} LOC
            </button>

            <button class="btn-terminal" id="qrBtn">
              ${icons.qrCode} QR
            </button>

            <button class="btn-terminal" id="stegoBtn">
              ${icons.image} STEGO
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderCommands() {
    const ui = this.state.getState('ui');
    const currentUser = this.state.getState('currentUser');
    const unread = currentUser.messages.filter(
      m => !m.read && (m.to === currentUser.username || m.to === '@everyone')
    ).length;
    
    return `
      <div class="commands-container">
        <div class="commands-header">
          <h2 class="commands-title">
            <span class="blink">›</span> TERMINAL
          </h2>
        </div>

        <!-- Command Input -->
        <div class="terminal-input-group">
          <span class="command-prompt">$</span>
          <input 
            type="text" 
            id="commandInput" 
            class="command-input" 
            placeholder="help | users | status | showFriends"
            value="${ui.commandInput}"
          />
          <button class="btn-execute" id="executeCmd">⏎</button>
        </div>

        <!-- Command Output -->
        ${ui.commandResult ? `
          <div class="command-output">
            <div class="output-header">
              <span class="output-label">OUTPUT:</span>
              <button class="btn-close-terminal" id="clearResult">×</button>
            </div>
            <pre class="output-content">${ui.commandResult}</pre>
          </div>
        ` : ''}

        <!-- System Stats -->
        <div class="system-stats">
          <div class="stat-line">
            <span class="stat-label">FRIENDS:</span>
            <span class="stat-value">${currentUser.friends.length}</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">MESSAGES:</span>
            <span class="stat-value">${currentUser.messages.length}</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">UNREAD:</span>
            <span class="stat-value ${unread > 0 ? 'highlight' : ''}">${unread}</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">PUBKEY:</span>
            <span class="stat-value-small">${currentUser.publicKey ? currentUser.publicKey.slice(0, 16) + '...' : 'N/A'}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderConversationsList() {
    const container = document.getElementById('conversationsContainer');
    if (!container) return;

    const conversations = this.getConversations();
    
    if (conversations.length === 0) {
      container.innerHTML = `
        <div class="no-conversations">
          <div class="ascii-art">
            ┌─────────────┐<br>
            │  NO SIGNAL  │<br>
            └─────────────┘
          </div>
          <p>No transmissions detected</p>
        </div>
      `;
      return;
    }

    container.innerHTML = conversations.slice(0, 20).map(convo => `
      <div class="conversation-card" data-user="${convo.user}">
        <div class="conversation-header-row">
          <div class="conversation-from">
            <span class="user-indicator">@</span>${convo.user.replace('@', '')}
          </div>
          <div class="conversation-time">${formatTime(convo.lastMessage.timestamp)}</div>
        </div>
        <div class="conversation-preview-text">
          ${convo.lastMessage.destructed ? 
            '<span class="destroyed-indicator">💥 DESTROYED</span>' : 
            convo.lastMessage.selfDestruct ? 
            '<span class="destruct-indicator">💣 SELF-DESTRUCT</span>' : 
            this.truncateMessage(convo.lastMessage.message, 50)}
        </div>
        <div class="conversation-meta">
          ${convo.lastMessage.encrypted ? '<span class="badge-terminal">🔒</span>' : ''}
          ${convo.unreadCount > 0 ? 
            `<span class="badge-terminal unread">${convo.unreadCount} NEW</span>` : ''}
        </div>
      </div>
    `).join('');

    // Attach click handlers
    container.querySelectorAll('.conversation-card').forEach(card => {
      card.addEventListener('click', () => {
        const user = card.dataset.user;
        this.openConversation(user);
      });
    });
  }

  truncateMessage(msg, length) {
    if (msg.length <= length) return msg;
    return msg.slice(0, length) + '...';
  }

  getConversations() {
    const currentUser = this.state.getState('currentUser');
    const convos = {};

    currentUser.messages.forEach(msg => {
      const otherUser = msg.from === currentUser.username ? msg.to : msg.from;
      if (otherUser === '@everyone') return;

      if (!convos[otherUser]) {
        convos[otherUser] = {
          user: otherUser,
          messages: [],
          lastMessage: msg,
          unreadCount: 0
        };
      }

      convos[otherUser].messages.push(msg);
      
      if (!msg.read && msg.to === currentUser.username) {
        convos[otherUser].unreadCount++;
      }

      if (new Date(msg.timestamp) > new Date(convos[otherUser].lastMessage.timestamp)) {
        convos[otherUser].lastMessage = msg;
      }
    });

    return Object.values(convos).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
  }

setupEventListeners() {
  // Tab navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      this.activeTab = tabName;
      this.render();
    });
  });

  // Header buttons
  const networkToggle = document.getElementById('networkToggle');
  if (networkToggle) {
    networkToggle.addEventListener('click', () => {
      const ui = this.state.getState('ui');
      this.state.setState('ui.networkEnabled', !ui.networkEnabled);
      this.render();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Exit secure session?')) {
        this.state.setState('currentUser', null);
        this.state.setState('ui.networkEnabled', false);
      }
    });
  }

  // Settings buttons
  document.querySelectorAll('[data-security]').forEach(btn => {
    btn.addEventListener('click', () => {
      this.state.setState('ui.securityLevel', btn.dataset.security);
      this.render();
    });
  });

  document.querySelectorAll('[data-privacy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.privacy;
      this.state.setState('ui.privacyLevel', level);
      if (level === 'public') {
        this.state.setState('ui.recipient', '@everyone');
      } else {
        const ui = this.state.getState('ui');
        if (ui.recipient === '@everyone') {
          this.state.setState('ui.recipient', '');
        }
      }
      this.render();
    });
  });

  document.querySelectorAll('[data-persistence]').forEach(btn => {
    btn.addEventListener('click', () => {
      this.state.setState('ui.persistenceLevel', btn.dataset.persistence);
      this.render();
    });
  });

  // Compose inputs
  const recipientInput = document.getElementById('recipient');
  if (recipientInput) {
    recipientInput.addEventListener('input', (e) => {
      this.state.setState('ui.recipient', e.target.value);
    });
  }

  const encryptKeyInput = document.getElementById('encryptKey');
  if (encryptKeyInput) {
    encryptKeyInput.addEventListener('input', (e) => {
      this.state.setState('ui.encryptKey', e.target.value);
    });
  }

  const encryptKey2Input = document.getElementById('encryptKey2');
  if (encryptKey2Input) {
    encryptKey2Input.addEventListener('input', (e) => {
      this.state.setState('ui.encryptKey2', e.target.value);
    });
  }

  const messageTextInput = document.getElementById('messageText');
  if (messageTextInput) {
    messageTextInput.addEventListener('input', (e) => {
      this.state.setState('ui.messageText', e.target.value);
    });
  }

  // Action buttons
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => this.sendMessage());
  }

  const inboxBtn = document.getElementById('inboxBtn');
  if (inboxBtn) {
    inboxBtn.addEventListener('click', () => this.viewInbox());
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => this.handleFileAttach(e));
  }

  const removeFileBtn = document.getElementById('removeFile');
  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', () => {
      this.state.setState('ui.attachedFile', null);
      this.render();
    });
  }

  // Voice recording
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.addEventListener('mousedown', () => this.startVoiceRecording());
    voiceBtn.addEventListener('mouseup', () => this.stopVoiceRecording());
    voiceBtn.addEventListener('mouseleave', () => this.stopVoiceRecording());
    voiceBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startVoiceRecording();
    });
    voiceBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopVoiceRecording();
    });
  }

  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.addEventListener('click', () => this.shareLocation());
  }

  const qrBtn = document.getElementById('qrBtn');
  if (qrBtn) {
    qrBtn.addEventListener('click', () => this.generate2DEQR());
  }

  const stegoBtn = document.getElementById('stegoBtn');
  if (stegoBtn) {
    stegoBtn.addEventListener('click', () => this.openSteganography());
  }

  // Commands
  const commandInput = document.getElementById('commandInput');
  if (commandInput) {
    commandInput.addEventListener('input', (e) => {
      this.state.setState('ui.commandInput', e.target.value);
    });

    commandInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.executeCommand();
      }
    });
  }

  const executeCmdBtn = document.getElementById('executeCmd');
  if (executeCmdBtn) {
    executeCmdBtn.addEventListener('click', () => this.executeCommand());
  }

  const clearResultBtn = document.getElementById('clearResult');
  if (clearResultBtn) {
    clearResultBtn.addEventListener('click', () => {
      this.state.setState('ui.commandResult', '');
      this.render();
    });
  }
}

  async sendMessage() {
    const ui = this.state.getState('ui');
    const currentUser = this.state.getState('currentUser');
    
    if (!ui.recipient || !ui.messageText) {
      alert('⚠ Enter recipient and message');
      return;
    }

    const msgId = generateId();
    let messageContent = ui.messageText;

    const msgData = {
      id: msgId,
      from: currentUser.username,
      to: ui.recipient,
      message: messageContent,
      security: ui.securityLevel,
      privacy: ui.privacyLevel,
      persistence: ui.persistenceLevel,
      timestamp: new Date().toISOString(),
      read: false,
      destructed: false,
      attachedFile: ui.attachedFile ? ui.attachedFile.name : null,
      attachedFileData: ui.attachedFile,
      signature: null
    };

    // Encryption based on security level
    if (ui.securityLevel === 'encrypted' && ui.encryptKey) {
      msgData.message = EncryptionService.encryptMessage(messageContent, ui.encryptKey);
      msgData.encrypted = true;
    } else if (ui.securityLevel === '2DE' && ui.encryptKey && ui.encryptKey2) {
      msgData.message = EncryptionService.encrypt2DE(messageContent, ui.encryptKey, ui.encryptKey2);
      msgData.encrypted = true;
      msgData.doubleEncrypted = true;
    } else if (ui.securityLevel !== 'open') {
      // Use keypair encryption
      const users = this.state.getState('users');
      const recipient = users[ui.recipient];
      
      if (recipient && recipient.publicKey) {
        msgData.message = await EncryptionService.encryptWithPublicKey(
          messageContent, 
          recipient.publicKey
        );
        msgData.encrypted = true;
        msgData.keypairEncrypted = true;
      }
    }

    // Sign message
    if (currentUser.privateKey) {
      msgData.signature = EncryptionService.signMessage(msgData.message, currentUser.privateKey);
    }

    if (ui.persistenceLevel === 'self-destruct') {
      msgData.selfDestruct = true;
      if (!confirm('💣 This message will self-destruct after reading. Continue?')) {
        return;
      }
    }

    this.completeSendMessage(msgData);
  }

  completeSendMessage(msgData) {
    const users = this.state.getState('users');
    const currentUser = this.state.getState('currentUser');

    const updatedSender = {
      ...currentUser,
      messages: [...currentUser.messages, msgData]
    };

    users[currentUser.username] = updatedSender;

    if (msgData.to === '@everyone') {
      Object.keys(users).forEach(username => {
        if (username !== currentUser.username) {
          users[username] = {
            ...users[username],
            messages: [...users[username].messages, msgData]
          };
        }
      });
      alert('✓ Broadcast transmitted');
    } else {
      if (!users[msgData.to]) {
        alert('✗ Recipient not found');
        return;
      }
      users[msgData.to] = {
        ...users[msgData.to],
        messages: [...users[msgData.to].messages, msgData]
      };
      alert('✓ Message transmitted');
    }

    this.state.setState('users', users);
    this.state.setState('currentUser', updatedSender);
    this.state.setState('ui.messageText', '');
    this.state.setState('ui.attachedFile', null);
    this.state.setState('ui.encryptKey', '');
    this.state.setState('ui.encryptKey2', '');
    this.state.persist();
    
    this.render();
  }

  async handleFileAttach(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB for mobile)
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠ File too large. Max 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result
      };
      
      this.state.setState('ui.attachedFile', fileData);
      const ui = this.state.getState('ui');
      this.state.setState('ui.messageText', ui.messageText + `\n[📎 ${file.name}]`);
      this.render();
    };
    reader.readAsDataURL(file);
  }

  async startVoiceRecording() {
    const ui = this.state.getState('ui');
    if (ui.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileData = {
            name: `voice_${Date.now()}.webm`,
            type: 'audio/webm',
            size: blob.size,
            data: event.target.result
          };
          
          this.state.setState('ui.attachedFile', fileData);
          const ui = this.state.getState('ui');
          this.state.setState('ui.messageText', ui.messageText + '\n[🎤 Voice message]');
          this.render();
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.state.setState('ui.isRecording', true);
      this.render();
    } catch (err) {
      alert(`⚠ Microphone access denied`);
    }
  }

  stopVoiceRecording() {
    const ui = this.state.getState('ui');
    if (!ui.isRecording) return;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    this.state.setState('ui.isRecording', false);
    this.render();
  }

  shareLocation() {
    if (!navigator.geolocation) {
      alert('⚠ Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        const locationText = `\n📍 ${lat}, ${lon}\nhttps://maps.google.com/?q=${lat},${lon}`;
        
        const ui = this.state.getState('ui');
        this.state.setState('ui.messageText', ui.messageText + locationText);
        this.render();
      },
      (err) => {
        alert(`⚠ Location unavailable`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async generate2DEQR() {
    const ui = this.state.getState('ui');
    
    if (!ui.messageText) {
      alert('⚠ Enter message first');
      return;
    }

    let encrypted;
    
    if (ui.securityLevel === '2DE' && ui.encryptKey && ui.encryptKey2) {
      encrypted = EncryptionService.encrypt2DE(ui.messageText, ui.encryptKey, ui.encryptKey2);
    } else if (ui.encryptKey) {
      encrypted = EncryptionService.encryptMessage(ui.messageText, ui.encryptKey);
    } else {
      alert('⚠ Enter encryption key(s) first');
      return;
    }

    if (!encrypted) {
      alert('⚠ Encryption failed');
      return;
    }

    // Generate QR code
    const qrDataUrl = await QRGenerator.generate(encrypted, {
      color: {
        dark: '#00ff00',
        light: '#000000'
      },
      width: 300
    });

    if (qrDataUrl) {
      this.showModal('qr', { data: encrypted, qrImage: qrDataUrl });
    } else {
      alert('⚠ QR generation failed');
    }
  }

  openSteganography() {
    this.showModal('steganography');
  }

  viewInbox() {
    const currentUser = this.state.getState('currentUser');
    const inbox = currentUser.messages.filter(
      m => m.to === currentUser.username || m.to === '@everyone'
    );
    this.showModal('inbox', { messages: inbox });
  }

  openConversation(otherUser) {
    const conversations = this.getConversations();
    const convo = conversations.find(c => c.user === otherUser);
    if (convo) {
      this.showModal('conversation', { conversation: convo });
    }
  }

  executeCommand() {
    const ui = this.state.getState('ui');
    
    if (!ui.commandInput) {
      this.state.setState('ui.commandResult', 'Enter a command. Try: help, users, status');
      this.render();
      return;
    }

    const result = this.commandService.execute('$' + ui.commandInput.replace(/^\$/, ''));
    this.state.setState('ui.commandResult', result);
    this.state.setState('ui.commandInput', '');
    this.render();
  }

  showModal(type, data = {}) {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = '';

    const overlay = createElement('div', 'modal-overlay-terminal');
    const modal = createElement('div', 'modal-terminal');

    overlay.appendChild(modal);
    
    const header = createElement('div', 'modal-header-terminal');
    const title = createElement('h3', 'modal-title-terminal');
    const closeBtn = createElement('button', 'btn-close-modal', '× CLOSE');

    let titleText = '';
    if (type === 'inbox') titleText = '📬 INBOX';
    if (type === 'qr') titleText = '📱 QR CODE';
    if (type === 'conversation') titleText = `💬 ${data.conversation.user}`;
    if (type === 'steganography') titleText = '🖼️ STEGANOGRAPHY';

    title.textContent = titleText;
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const content = createElement('div', 'modal-content-terminal');

    if (type === 'inbox') {
      const inboxView = new InboxView(content, this.state, data.messages);
    } else if (type === 'qr') {
      content.innerHTML = `
        <div class="qr-view-terminal">
          <div class="qr-container">
            <img src="${data.qrImage}" alt="QR Code" class="qr-image" />
          </div>
          <p class="qr-description">Scan with compatible device</p>
          <div class="qr-data-box">
            <div class="data-header">ENCRYPTED DATA:</div>
            <pre class="data-content">${data.data.slice(0, 200)}${data.data.length > 200 ? '...' : ''}</pre>
          </div>
        </div>
      `;
    } else if (type === 'conversation') {
      this.renderConversationModal(content, data.conversation);
    } else if (type === 'steganography') {
      new SteganographyView(content, this.state, (fileData) => {
        this.state.setState('ui.attachedFile', fileData);
        const ui = this.state.getState('ui');
        this.state.setState('ui.messageText', ui.messageText + `\n[🖼️ ${fileData.name}]`);
        this.closeModal();
        this.render();
      });
    }

    modal.appendChild(content);
    modalRoot.appendChild(overlay);

    // Close handlers
    closeBtn.addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });
  }

  renderConversationModal(container, conversation) {
    const currentUser = this.state.getState('currentUser');
    
    const messages = conversation.messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => {
        const isFromMe = msg.from === currentUser.username;
        return `
          <div class="msg-bubble ${isFromMe ? 'sent' : 'received'}">
            <div class="msg-meta">
              ${isFromMe ? 'YOU' : msg.from} › ${formatTime(msg.timestamp)}
            </div>
            <div class="msg-text">
              ${msg.destructed ? '💥 DESTROYED' : 
                msg.selfDestruct ? '💣 SELF-DESTRUCT' : 
                msg.encrypted ? '🔒 ENCRYPTED' : msg.message}
            </div>
            ${msg.attachedFileData ? `
              <div class="msg-attachment">
                ${msg.attachedFileData.type.startsWith('image/') ? 
                  `<img src="${msg.attachedFileData.data}" alt="${msg.attachedFileData.name}" class="attachment-img" />` :
                  msg.attachedFileData.type.startsWith('audio/') ?
                  `<audio controls src="${msg.attachedFileData.data}" class="attachment-audio"></audio>` :
                  `<div class="attachment-file-info">📎 ${msg.attachedFileData.name}</div>`
                }
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

    container.innerHTML = `
      <div class="conversation-view">
        ${messages}
      </div>
    `;
  }

  closeModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = '';
  }
}
