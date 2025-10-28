import { formatTimestamp, formatTime } from '../utils/helpers.js';
import { EncryptionService } from '../services/encryption.js';

export class InboxView {
  constructor(container, stateManager, messages) {
    this.container = container;
    this.state = stateManager;
    this.messages = messages;
    this.selectedMsg = null;
    this.decryptKey = '';
    this.decryptKey2 = '';
    this.viewingDestruct = null;
    this.countdown = null;
    this.countdownInterval = null;
    
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="inbox-terminal">
        <div class="inbox-list-terminal">
          ${this.renderMessagesList()}
        </div>
        <div class="inbox-details-terminal">
          ${this.renderMessageDetails()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderMessagesList() {
    if (this.messages.length === 0) {
      return `
        <div class="inbox-empty-terminal">
          <pre class="empty-icon">
  ╔══════════╗
  ║  EMPTY   ║
  ╚══════════╝
          </pre>
          <p>NO MESSAGES</p>
        </div>
      `;
    }

    return `
      <div class="message-list-scroll">
        ${this.messages.map((msg, idx) => `
          <div class="msg-list-item ${this.selectedMsg?.id === msg.id ? 'active' : ''}" data-msg-id="${msg.id}">
            <div class="msg-list-header">
              <span class="msg-from">${msg.from}</span>
              <span class="msg-time">${formatTime(msg.timestamp)}</span>
            </div>
            <div class="msg-list-preview">
              ${msg.destructed ? '💥 DESTROYED' : 
                msg.selfDestruct ? '💣 SELF-DESTRUCT' : 
                msg.message.slice(0, 40) + '...'}
            </div>
            <div class="msg-list-badges">
              ${!msg.read ? '<span class="badge-mini unread">NEW</span>' : ''}
              ${msg.selfDestruct && !msg.destructed ? '<span class="badge-mini destruct">💣</span>' : ''}
              ${msg.encrypted ? '<span class="badge-mini encrypted">🔒</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderMessageDetails() {
    if (!this.selectedMsg) {
      return `
        <div class="details-empty-terminal">
          <pre class="select-icon">
  ┌─────────┐
  │ SELECT  │
  │ MESSAGE │
  └─────────┘
          </pre>
          <p>SELECT A MESSAGE TO VIEW</p>
        </div>
      `;
    }

    const msg = this.selectedMsg;
    const currentUser = this.state.getState('currentUser');

    if (msg.destructed && this.viewingDestruct !== msg.id) {
      return `
        <div class="msg-destroyed-terminal">
          <pre class="destroyed-icon">
  ╔═══════════╗
  ║  💥 BOOM  ║
  ╚═══════════╝
          </pre>
          <div class="destroyed-title">MESSAGE DESTROYED</div>
          <div class="destroyed-text">This transmission has been permanently erased</div>
        </div>
      `;
    }

    return `
      <div class="msg-details-terminal">
        <div class="details-header">MESSAGE DETAILS</div>
        
        <div class="details-meta-grid">
          <div class="meta-row">
            <span class="meta-key">FROM:</span>
            <span class="meta-val">${msg.from}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">TO:</span>
            <span class="meta-val">${msg.to}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">TIME:</span>
            <span class="meta-val">${formatTimestamp(msg.timestamp)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-key">SEC:</span>
            <span class="meta-val">${msg.security.toUpperCase()}</span>
          </div>
        </div>

        ${msg.encrypted ? `
          <div class="decrypt-section-terminal">
            <label class="decrypt-label">DECRYPTION KEY:</label>
            <input 
              type="password" 
              id="decryptKeyInput" 
              class="decrypt-input" 
              placeholder="enter.key"
              value="${this.decryptKey}"
              ${this.viewingDestruct === msg.id ? 'disabled' : ''}
            />
            ${msg.doubleEncrypted ? `
              <label class="decrypt-label">SECONDARY KEY:</label>
              <input 
                type="password" 
                id="decryptKey2Input" 
                class="decrypt-input" 
                placeholder="enter.key2"
                value="${this.decryptKey2}"
                ${this.viewingDestruct === msg.id ? 'disabled' : ''}
              />
            ` : ''}
          </div>
        ` : ''}

        ${msg.selfDestruct && !msg.destructed && this.viewingDestruct !== msg.id ? `
          <div class="self-destruct-box">
            <div class="destruct-warning">⚠ SELF-DESTRUCT MESSAGE ⚠</div>
            <div class="destruct-text">This message will auto-erase 30 seconds after viewing</div>
            ${msg.encrypted && (!this.decryptKey || (msg.doubleEncrypted && !this.decryptKey2)) ? 
              '<div class="destruct-notice">⚠ ENTER DECRYPTION KEY(S) FIRST</div>' : ''}
            <button 
              class="btn-destruct" 
              id="viewDestructBtn"
              ${msg.encrypted && (!this.decryptKey || (msg.doubleEncrypted && !this.decryptKey2)) ? 'disabled' : ''}
            >
              👁 VIEW & START COUNTDOWN
            </button>
          </div>
        ` : ''}

        ${this.viewingDestruct === msg.id || !msg.selfDestruct ? `
          ${this.viewingDestruct === msg.id && this.countdown !== null ? `
            <div class="countdown-box">
              <div class="countdown-timer">⏱ ${this.countdown}s</div>
              <div class="countdown-label">SELF-DESTRUCTING...</div>
              <button class="btn-destroy-now" id="destroyNowBtn">DESTROY NOW</button>
            </div>
          ` : ''}

          ${msg.attachedFileData ? this.renderAttachment(msg.attachedFileData) : ''}

          <div class="msg-content-box">
            <div class="content-header">MESSAGE CONTENT:</div>
            <div class="content-body">
              ${this.getDecryptedMessage(msg, currentUser)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getDecryptedMessage(msg, currentUser) {
    if (!msg.encrypted) {
      return msg.message;
    }

    if (msg.doubleEncrypted && this.decryptKey && this.decryptKey2) {
      return EncryptionService.decrypt2DE(msg.message, this.decryptKey, this.decryptKey2);
    }

    if (msg.keypairEncrypted && currentUser.privateKey) {
      return EncryptionService.decryptWithPrivateKey(msg.message, currentUser.privateKey);
    }

    if (this.decryptKey) {
      return EncryptionService.decryptMessage(msg.message, this.decryptKey);
    }

    return '🔒 ENCRYPTED - ENTER KEY TO DECRYPT';
  }

  renderAttachment(fileData) {
    if (fileData.type.startsWith('image/')) {
      return `
        <div class="attachment-box">
          <div class="attachment-header">ATTACHMENT: IMAGE</div>
          <div class="attachment-image-wrap">
            <img 
              src="${fileData.data}" 
              alt="${fileData.name}" 
              class="attachment-image-terminal"
            />
          </div>
          <div class="attachment-name">${fileData.name}</div>
        </div>
      `;
    } else if (fileData.type.startsWith('audio/')) {
      return `
        <div class="attachment-box">
          <div class="attachment-header">ATTACHMENT: AUDIO</div>
          <div class="attachment-audio-wrap">
            <div class="audio-icon-terminal">🎤</div>
            <div class="audio-name-terminal">${fileData.name}</div>
            <audio controls src="${fileData.data}" class="audio-player-terminal">
              Audio not supported
            </audio>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="attachment-box">
          <div class="attachment-header">ATTACHMENT: FILE</div>
          <div class="attachment-file-wrap">
            <div class="file-icon-terminal">📄</div>
            <div class="file-details">
              <div class="file-name-terminal">${fileData.name}</div>
              <div class="file-size-terminal">${(fileData.size / 1024).toFixed(1)} KB</div>
            </div>
            <a 
              href="${fileData.data}" 
              download="${fileData.name}" 
              class="btn-download-terminal"
            >
              DOWNLOAD
            </a>
          </div>
        </div>
      `;
    }
  }

  attachEventListeners() {
    // Message item clicks
    this.container.querySelectorAll('.msg-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const msgId = item.dataset.msgId;
        this.selectedMsg = this.messages.find(m => m.id === msgId);
        this.decryptKey = '';
        this.decryptKey2 = '';
        this.viewingDestruct = null;
        this.countdown = null;
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        this.render();
      });
    });

    // Decrypt key inputs
    const decryptInput = this.container.querySelector('#decryptKeyInput');
    if (decryptInput) {
      decryptInput.addEventListener('input', (e) => {
        this.decryptKey = e.target.value;
        this.render();
      });
    }

    const decryptKey2Input = this.container.querySelector('#decryptKey2Input');
    if (decryptKey2Input) {
      decryptKey2Input.addEventListener('input', (e) => {
        this.decryptKey2 = e.target.value;
        this.render();
      });
    }

    // View destruct button
    const viewDestructBtn = this.container.querySelector('#viewDestructBtn');
    if (viewDestructBtn) {
      viewDestructBtn.addEventListener('click', () => {
        this.handleViewDestruct(this.selectedMsg);
      });
    }

    // Destroy now button
    const destroyNowBtn = this.container.querySelector('#destroyNowBtn');
    if (destroyNowBtn) {
      destroyNowBtn.addEventListener('click', () => {
        this.destroyMessage(this.selectedMsg);
      });
    }
  }

  handleViewDestruct(msg) {
    this.viewingDestruct = msg.id;
    this.countdown = 30;
    let timeLeft = 30;

    this.render();

    this.countdownInterval = setInterval(() => {
      timeLeft -= 1;
      this.countdown = timeLeft;
      this.render();

      if (timeLeft <= 0) {
        this.destroyMessage(msg);
      }
    }, 1000);
  }

  destroyMessage(msg) {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdown = null;

    const currentUser = this.state.getState('currentUser');
    const users = this.state.getState('users');

    const updatedMessages = currentUser.messages.map(m => 
      m.id === msg.id ? { 
        ...m, 
        destructed: true, 
        message: '[DESTROYED]', 
        read: true 
      } : m
    );

    const updatedUser = { ...currentUser, messages: updatedMessages };
    this.state.setState('currentUser', updatedUser);
    
    users[currentUser.username] = updatedUser;
    this.state.setState('users', users);
    this.state.persist();

    this.selectedMsg = { ...msg, destructed: true, message: '[DESTROYED]' };
    this.viewingDestruct = null;
    
    this.messages = this.messages.map(m => 
      m.id === msg.id ? this.selectedMsg : m
    );

    this.render();
  }
}
