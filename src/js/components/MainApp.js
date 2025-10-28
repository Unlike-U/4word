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
    this.activeTab = 'feed';
    
    this.render();
  }

  render() {
    const currentUser = this.state.getState('currentUser');
    const ui = this.state.getState('ui');
    
    this.container.innerHTML = `
      <div class="app-container" id="appContainer">
        <!-- Header -->
        <header class="terminal-header">
          <div class="terminal-bar">
            <div class="terminal-title">
              <span class="terminal-prompt">4WORD</span>
              <span class="terminal-user">${currentUser.username}</span>
            </div>
            <div class="terminal-controls">
              <button class="terminal-btn ${ui.networkEnabled ? 'online' : 'offline'}" id="networkToggle">
                <span class="status-dot"></span>
                ${ui.networkEnabled ? 'ONLINE' : 'OFFLINE'}
              </button>
              <button class="terminal-btn logout" id="logoutBtn">
                EXIT
              </button>
            </div>
          </div>
        </header>

        <!-- Mobile Tab Navigation -->
        <nav class="mobile-nav">
          <button class="nav-tab ${this.activeTab === 'feed' ? 'active' : ''}" id="tabFeed">
            <span class="nav-icon">📡</span>
            <span class="nav-label">FEED</span>
          </button>
          <button class="nav-tab ${this.activeTab === 'compose' ? 'active' : ''}" id="tabCompose">
            <span class="nav-icon">✉️</span>
            <span class="nav-label">COMPOSE</span>
          </button>
          <button class="nav-tab ${this.activeTab === 'commands' ? 'active' : ''}" id="tabCommands">
            <span class="nav-icon">⚡</span>
            <span class="nav-label">CMD</span>
          </button>
        </nav>

        <!-- Main Content -->
        <main class="terminal-content">
          <section class="content-tab ${this.activeTab === 'feed' ? 'active' : ''}" id="feedTab">
            ${this.renderFeed()}
          </section>

          <section class="content-tab ${this.activeTab === 'compose' ? 'active' : ''}" id="composeTab">
            ${this.renderCompose()}
          </section>

          <section class="content-tab ${this.activeTab === 'commands' ? 'active' : ''}" id="commandsTab">
            ${this.renderCommands()}
          </section>
        </main>
      </div>
    `;

    // Render dynamic content
    this.renderConversationsList();
    
    // Attach all event listeners AFTER render
    this.attachAllListeners();
  }

  attachAllListeners() {
    // Tab navigation
    this.attachListener('tabFeed', 'click', () => {
      console.log('Feed tab clicked');
      this.activeTab = 'feed';
      this.render();
    });

    this.attachListener('tabCompose', 'click', () => {
      console.log('Compose tab clicked');
      this.activeTab = 'compose';
      this.render();
    });

    this.attachListener('tabCommands', 'click', () => {
      console.log('Commands tab clicked');
      this.activeTab = 'commands';
      this.render();
    });

    // Header buttons
    this.attachListener('networkToggle', 'click', () => {
      console.log('Network toggle clicked');
      const ui = this.state.getState('ui');
      this.state.setState('ui.networkEnabled', !ui.networkEnabled);
      this.render();
    });

    this.attachListener('logoutBtn', 'click', () => {
      console.log('Logout clicked');
      if (confirm('Exit secure session?')) {
        this.state.setState('currentUser', null);
      }
    });

    // Settings buttons - Security
    this.attachListener('securityOpen', 'click', () => {
      console.log('Security Open clicked');
      this.state.setState('ui.securityLevel', 'open');
      this.render();
    });

    this.attachListener('securityEncrypted', 'click', () => {
      console.log('Security Encrypted clicked');
      this.state.setState('ui.securityLevel', 'encrypted');
      this.render();
    });

    this.attachListener('security2DE', 'click', () => {
      console.log('Security 2DE clicked');
      this.state.setState('ui.securityLevel', '2DE');
      this.render();
    });

    // Settings buttons - Privacy
    this.attachListener('privacyPublic', 'click', () => {
      console.log('Privacy Public clicked');
      this.state.setState('ui.privacyLevel', 'public');
      this.state.setState('ui.recipient', '@everyone');
      this.render();
    });

    this.attachListener('privacyGroups', 'click', () => {
      console.log('Privacy Groups clicked');
      this.state.setState('ui.privacyLevel', 'groups');
      this.render();
    });

    this.attachListener('privacyPrivate', 'click', () => {
      console.log('Privacy Private clicked');
      this.state.setState('ui.privacyLevel', 'private');
      this.render();
    });

    // Settings buttons - Persistence
    this.attachListener('persistencePermanent', 'click', () => {
      console.log('Persistence Permanent clicked');
      this.state.setState('ui.persistenceLevel', 'permanent');
      this.render();
    });

    this.attachListener('persistenceUndetermined', 'click', () => {
      console.log('Persistence Undetermined clicked');
      this.state.setState('ui.persistenceLevel', 'undetermined');
      this.render();
    });

    this.attachListener('persistenceSelfDestruct', 'click', () => {
      console.log('Persistence Self-Destruct clicked');
      this.state.setState('ui.persistenceLevel', 'self-destruct');
      this.render();
    });

    // Input fields
    this.attachListener('recipient', 'input', (e) => {
      this.state.setState('ui.recipient', e.target.value);
    });

    this.attachListener('encryptKey', 'input', (e) => {
      this.state.setState('ui.encryptKey', e.target.value);
    });

    this.attachListener('encryptKey2', 'input', (e) => {
      this.state.setState('ui.encryptKey2', e.target.value);
    });

    this.attachListener('messageText', 'input', (e) => {
      this.state.setState('ui.messageText', e.target.value);
    });

    // Action buttons
    this.attachListener('sendBtn', 'click', () => {
      console.log('Send button clicked');
      this.sendMessage();
    });

    this.attachListener('inboxBtn', 'click', () => {
      console.log('Inbox button clicked');
      this.viewInbox();
    });

    this.attachListener('fileInput', 'change', (e) => {
      console.log('File input changed');
      this.handleFileAttach(e);
    });

    this.attachListener('removeFile', 'click', () => {
      console.log('Remove file clicked');
      this.state.setState('ui.attachedFile', null);
      this.render();
    });

    this.attachListener('locationBtn', 'click', () => {
      console.log('Location button clicked');
      this.shareLocation();
    });

    this.attachListener('qrBtn', 'click', () => {
      console.log('QR button clicked');
      this.generate2DEQR();
    });

    this.attachListener('stegoBtn', 'click', () => {
      console.log('Stego button clicked');
      this.openSteganography();
    });

    // Voice button (special handling)
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('mousedown', () => {
        console.log('Voice recording started');
        this.startVoiceRecording();
      });
      voiceBtn.addEventListener('mouseup', () => {
        console.log('Voice recording stopped');
        this.stopVoiceRecording();
      });
      voiceBtn.addEventListener('mouseleave', () => {
        this.stopVoiceRecording();
      });
    }

    // Commands
    this.attachListener('commandInput', 'input', (e) => {
      this.state.setState('ui.commandInput', e.target.value);
    });

    this.attachListener('commandInput', 'keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.executeCommand();
      }
    });

    this.attachListener('executeCmd', 'click', () => {
      console.log('Execute command clicked');
      this.executeCommand();
    });

    this.attachListener('clearResult', 'click', () => {
      console.log('Clear result clicked');
      this.state.setState('ui.commandResult', '');
      this.render();
    });
  }

  attachListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(eventType, handler);
    }
  }

  renderFeed() {
    return `
      <div class="feed-container">
        <div class="feed-header">
          <h2 class="feed-title">TRANSMISSION FEED</h2>
          <button class="btn-terminal btn-sm" id="inboxBtn">
            📬 INBOX
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
          <h2 class="compose-title">NEW TRANSMISSION</h2>
        </div>

        <div class="compose-form">
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

          <div class="settings-compact">
            <div class="setting-row">
              <label class="setting-label">SECURITY:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.securityLevel === 'open' ? 'active' : ''}" id="securityOpen">OPEN</button>
                <button class="btn-mini ${ui.securityLevel === 'encrypted' ? 'active' : ''}" id="securityEncrypted">ENC</button>
                <button class="btn-mini ${ui.securityLevel === '2DE' ? 'active' : ''}" id="security2DE">2DE</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">PRIVACY:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.privacyLevel === 'public' ? 'active' : ''}" id="privacyPublic">PUB</button>
                <button class="btn-mini ${ui.privacyLevel === 'groups' ? 'active' : ''}" id="privacyGroups">GRP</button>
                <button class="btn-mini ${ui.privacyLevel === 'private' ? 'active' : ''}" id="privacyPrivate">PVT</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">PERSIST:</label>
              <div class="btn-group-mini">
                <button class="btn-mini ${ui.persistenceLevel === 'permanent' ? 'active' : ''}" id="persistencePermanent">PERM</button>
                <button class="btn-mini ${ui.persistenceLevel === 'undetermined' ? 'active' : ''}" id="persistenceUndetermined">UNDET</button>
                <button class="btn-mini ${ui.persistenceLevel === 'self-destruct' ? 'active' : ''}" id="persistenceSelfDestruct">💣</button>
              </div>
            </div>
          </div>

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

          <div class="terminal-input-group">
            <label class="terminal-label">MESSAGE:</label>
            <textarea 
              id="messageText" 
              class="terminal-textarea" 
              placeholder="type.your.message..."
            >${ui.messageText}</textarea>
          </div>

          ${ui.attachedFile ? `
            <div class="attached-file-terminal">
              <span class="file-indicator">📎 ${ui.attachedFile.name}</span>
              <button class="btn-remove-terminal" id="removeFile">×</button>
            </div>
          ` : ''}

          <div class="compose-actions-grid">
            <button class="btn-terminal btn-primary" id="sendBtn">
              ▶ SEND
            </button>

            <label class="btn-terminal">
              📎 FILE
              <input type="file" id="fileInput" style="display: none;" />
            </label>

            <button class="btn-terminal ${ui.isRecording ? 'recording' : ''}" id="voiceBtn">
              🎤 ${ui.isRecording ? 'REC...' : 'VOICE'}
            </button>

            <button class="btn-terminal" id="locationBtn">
              📍 LOC
            </button>

            <button class="btn-terminal" id="qrBtn">
              📱 QR
            </button>

            <button class="btn-terminal" id="stegoBtn">
              🖼️ STEGO
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
          <h2 class="commands-title">TERMINAL</h2>
        </div>

        <div class="terminal-input-group">
          <input 
            type="text" 
            id="commandInput" 
            class="command-input" 
            placeholder="help | users | status | showFriends"
            value="${ui.commandInput}"
          />
          <button class="btn-execute" id="executeCmd">⏎</button>
        </div>

        ${ui.commandResult ? `
          <div class="command-output">
            <div class="output-header">
              <span class="output-label">OUTPUT:</span>
              <button class="btn-close-terminal" id="clearResult">×</button>
            </div>
            <pre class="output-content">${ui.commandResult}</pre>
          </div>
        ` : ''}

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
      container.innerHTML = '<div class="no-conversations"><p>No transmissions detected</p></div>';
      return;
    }

    container.innerHTML = conversations.slice(0, 20).map((convo, idx) => `
      <div class="conversation-card" id="conv_${idx}">
        <div class="conversation-header-row">
          <div class="conversation-from">
            <span class="user-indicator">@</span>${convo.user.replace('@', '')}
          </div>
          <div class="conversation-time">${formatTime(convo.lastMessage.timestamp)}</div>
        </div>
        <div class="conversation-preview-text">
          ${convo.lastMessage.destructed ? '<span class="destroyed-indicator">💥 DESTROYED</span>' : 
            convo.lastMessage.selfDestruct ? '<span class="destruct-indicator">💣 SELF-DESTRUCT</span>' : 
            this.truncateMessage(convo.lastMessage.message, 50)}
        </div>
        <div class="conversation-meta">
          ${convo.lastMessage.encrypted ? '<span class="badge-terminal">🔒</span>' : ''}
          ${convo.unreadCount > 0 ? `<span class="badge-terminal unread">${convo.unreadCount} NEW</span>` : ''}
        </div>
      </div>
    `).join('');

    // Attach conversation click listeners
    conversations.forEach((convo, idx) => {
      const card = document.getElementById(`conv_${idx}`);
      if (card) {
        card.addEventListener('click', () => {
          console.log('Conversation clicked:', convo.user);
          this.openConversation(convo.user);
        });
      }
    });
  }

  truncateMessage(msg, length) {
    if (!msg || msg.length <= length) return msg || '';
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

  sendMessage() {
    console.log('sendMessage() called');
    
    const ui = this.state.getState('ui');
    const currentUser = this.state.getState('currentUser');
    
    if (!ui.recipient || !ui.messageText) {
      alert('⚠ Enter recipient and message');
      return;
    }

    const msgId = generateId();
    const msgData = {
      id: msgId,
      from: currentUser.username,
      to: ui.recipient,
      message: ui.messageText,
      security: ui.securityLevel,
      privacy: ui.privacyLevel,
      persistence: ui.persistenceLevel,
      timestamp: new Date().toISOString(),
      read: false,
      destructed: false,
      attachedFile: ui.attachedFile ? ui.attachedFile.name : null,
      attachedFileData: ui.attachedFile,
      encrypted: false
    };

    // Apply encryption
    if (ui.securityLevel === 'encrypted' && ui.encryptKey) {
      msgData.message = EncryptionService.encryptMessage(ui.messageText, ui.encryptKey);
      msgData.encrypted = true;
    } else if (ui.securityLevel === '2DE' && ui.encryptKey && ui.encryptKey2) {
      msgData.message = EncryptionService.encrypt2DE(ui.messageText, ui.encryptKey, ui.encryptKey2);
      msgData.encrypted = true;
      msgData.doubleEncrypted = true;
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
      alert('✓ Message sent!');
    }

    this.state.setState('users', users);
    this.state.setState('currentUser', updatedSender);
    this.state.setState('ui.messageText', '');
    this.state.setState('ui.attachedFile', null);
    this.state.persist();
    
    this.render();
  }

  async handleFileAttach(e) {
    const file = e.target.files[0];
    if (!file) return;

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
      alert(`✓ File attached: ${file.name}`);
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
          alert('✓ Voice message recorded');
          this.render();
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.state.setState('ui.isRecording', true);
      this.render();
    } catch (err) {
      alert('⚠ Microphone access denied');
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

    alert('Getting location...');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        const locationText = `\n📍 Location: ${lat}, ${lon}\nhttps://maps.google.com/?q=${lat},${lon}`;
        
        const ui = this.state.getState('ui');
        this.state.setState('ui.messageText', ui.messageText + locationText);
        alert('✓ Location added to message');
        this.render();
      },
      (err) => {
        alert('✗ Location unavailable: ' + err.message);
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

    if (!ui.encryptKey) {
      alert('⚠ Enter encryption key first');
      return;
    }

    let encrypted;
    
    if (ui.securityLevel === '2DE' && ui.encryptKey2) {
      encrypted = EncryptionService.encrypt2DE(ui.messageText, ui.encryptKey, ui.encryptKey2);
    } else {
      encrypted = EncryptionService.encryptMessage(ui.messageText, ui.encryptKey);
    }

    if (!encrypted) {
      alert('⚠ Encryption failed');
      return;
    }

    const qrDataUrl = await QRGenerator.generate(encrypted, {
      color: {
        dark: '#0088cc',
        light: '#ffffff'
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
          <p class="qr-description">Scan with compatible device to decrypt</p>
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
        alert('✓ Stego image attached');
        this.closeModal();
        this.render();
      });
    }

    modal.appendChild(content);
    modalRoot.appendChild(overlay);

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
          </div>
        `;
      }).join('');

    container.innerHTML = `
      <div class="conversation-view">
        ${messages || '<p>No messages</p>'}
      </div>
    `;
  }

  closeModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = '';
  }
}
