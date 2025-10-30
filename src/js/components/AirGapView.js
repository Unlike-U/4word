import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import CryptoJS from 'crypto-js';
import SecureCrypto from '../crypto/webCrypto.js';

export class AirGapView {
  constructor(currentUser) {
    this.container = null;
    this.currentMode = 'encode';
    this.html5QrCode = null;
    this.isScanning = false;
    this.currentUser = currentUser;
    this.users = [];
  }

  async render() {
    this.container = document.createElement('div');
    this.container.className = 'airgap-view';

    await this.loadUsers();

    this.container.innerHTML = `
      <div class="airgap-header">
        <h2>
          <i class="fas fa-plane-slash"></i>
          Air Gap Security
        </h2>
        <p class="airgap-subtitle">Offline data transfer via QR codes with end-to-end encryption</p>
      </div>

      <div class="airgap-mode-toggle">
        <button class="airgap-mode-btn active" data-mode="encode">
          <i class="fas fa-qrcode"></i>
          <span>Encode to QR</span>
        </button>
        <button class="airgap-mode-btn" data-mode="decode">
          <i class="fas fa-camera"></i>
          <span>Decode QR</span>
        </button>
      </div>

      <div class="airgap-content">
        <!-- ENCODE PANEL -->
        <div class="airgap-panel active" data-panel="encode">
          <div class="airgap-section">
            <h3>Recipient</h3>
            <div class="recipient-selector">
              <label>
                <i class="fas fa-user-shield"></i>
                Send to
              </label>
              <select class="airgap-select" id="recipientSelect">
                <option value="@everyone">@everyone (Public)</option>
                ${this.users.map(user => `
                  <option value="${user.username}" ${user.username === this.currentUser.username ? 'disabled' : ''}>
                    ${user.displayName || user.username} ${user.username === this.currentUser.username ? '(You)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="recipient-info">
              <i class="fas fa-info-circle"></i>
              <span id="recipientInfo">Public message - anyone can decode this QR code</span>
            </div>
          </div>

          <div class="airgap-section">
            <h3>Data to Encode</h3>
            <textarea 
              class="airgap-textarea" 
              id="encodeData" 
              rows="6" 
              placeholder="Enter text, JSON, or any data you want to encode into a QR code..."
            ></textarea>
            <div class="message-stats">
              <span id="encodeDataLength">0 characters</span>
              <span class="capacity-warning" id="encodeWarning" style="display: none;">
                <i class="fas fa-exclamation-triangle"></i>
                Large data may result in dense QR codes
              </span>
            </div>
          </div>

          <div class="airgap-section">
            <h3>Encryption</h3>
            <div class="encryption-info" id="encryptionInfo">
              <i class="fas fa-shield-alt"></i>
              <span>Messages to specific users are automatically RSA encrypted</span>
            </div>
            <div class="encryption-toggle">
              <label class="toggle-switch">
                <input type="checkbox" id="encodeEncryptToggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Add additional password layer</span>
              </label>
            </div>
            <div class="encryption-key-group" id="encodeKeyGroup" style="display: none;">
              <div class="encryption-key-container">
                <label>
                  <i class="fas fa-key"></i>
                  Encryption Password
                </label>
                <div style="display: flex; gap: 8px;">
                  <input 
                    type="password" 
                    class="encryption-key-input" 
                    id="encodeKey" 
                    placeholder="Enter encryption password..."
                  />
                  <button class="toggle-key-btn" id="toggleEncodeKey">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              <p class="encryption-hint">
                <i class="fas fa-info-circle"></i>
                This adds an extra AES layer on top of RSA encryption
              </p>
            </div>
          </div>

          <div class="airgap-section">
            <h3>QR Code Options</h3>
            <div class="qr-options">
              <div class="qr-option">
                <label for="qrSize">Size</label>
                <select class="airgap-select" id="qrSize">
                  <option value="256">Small (256px)</option>
                  <option value="512" selected>Medium (512px)</option>
                  <option value="1024">Large (1024px)</option>
                </select>
              </div>
              <div class="qr-option">
                <label for="qrErrorLevel">Error Correction</label>
                <select class="airgap-select" id="qrErrorLevel">
                  <option value="L">Low (7%)</option>
                  <option value="M" selected>Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
            </div>
          </div>

          <button class="airgap-btn airgap-btn-primary" id="generateQrBtn">
            <i class="fas fa-qrcode"></i>
            Generate QR Code
          </button>

          <div class="qr-result" id="qrResult" style="display: none;">
            <div class="airgap-section">
              <h3>Generated QR Code</h3>
              <div class="qr-display">
                <canvas id="qrCanvas"></canvas>
              </div>
              <div class="qr-actions">
                <button class="airgap-btn airgap-btn-secondary" id="downloadQrBtn">
                  <i class="fas fa-download"></i>
                  Download QR Code
                </button>
                <button class="airgap-btn airgap-btn-secondary" id="printQrBtn">
                  <i class="fas fa-print"></i>
                  Print QR Code
                </button>
              </div>
              <div class="qr-info">
                <i class="fas fa-info-circle"></i>
                <span id="qrInfo"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- DECODE PANEL -->
        <div class="airgap-panel" data-panel="decode">
          <div class="airgap-section">
            <h3>Scan QR Code</h3>
            <div class="qr-scan-methods">
              <button class="scan-method-btn active" data-method="camera">
                <i class="fas fa-camera"></i>
                <span>Use Camera</span>
              </button>
              <button class="scan-method-btn" data-method="upload">
                <i class="fas fa-upload"></i>
                <span>Upload Image</span>
              </button>
            </div>
          </div>

          <!-- Camera Scan -->
          <div class="scan-area" id="cameraScanner" style="display: block;">
            <div class="camera-container">
              <div id="qrReader" style="display: none;"></div>
              <div class="camera-placeholder" id="cameraPlaceholder">
                <i class="fas fa-camera"></i>
                <p>Click "Start Scanner" to begin scanning</p>
              </div>
            </div>
            <div class="scanner-controls">
              <button class="airgap-btn airgap-btn-primary" id="startScanBtn">
                <i class="fas fa-play"></i>
                Start Scanner
              </button>
              <button class="airgap-btn airgap-btn-secondary" id="stopScanBtn" style="display: none;">
                <i class="fas fa-stop"></i>
                Stop Scanner
              </button>
            </div>
          </div>

          <!-- Upload Scan -->
          <div class="scan-area" id="uploadScanner" style="display: none;">
            <div class="upload-zone" id="qrUploadZone">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Drop QR code image here</p>
              <span class="upload-hint">or click to browse</span>
              <input type="file" id="qrFileInput" accept="image/*" style="display: none;">
            </div>
            <div class="uploaded-preview" id="uploadedPreview" style="display: none;">
              <img id="uploadedImage" alt="Uploaded QR Code">
              <button class="remove-upload-btn" id="removeUploadBtn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Decryption Section -->
          <div class="airgap-section" id="decryptSection" style="display: none;">
            <h3>Additional Decryption Required</h3>
            <p class="decrypt-message">This message has an additional password layer</p>
            <div class="encryption-key-container">
              <label>
                <i class="fas fa-key"></i>
                Decryption Password
              </label>
              <div style="display: flex; gap: 8px;">
                <input 
                  type="password" 
                  class="encryption-key-input" 
                  id="decodeKey" 
                  placeholder="Enter decryption password..."
                />
                <button class="toggle-key-btn" id="toggleDecodeKey">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button class="airgap-btn airgap-btn-primary" id="decryptBtn">
              <i class="fas fa-unlock"></i>
              Decrypt Data
            </button>
          </div>

          <!-- Decoded Result -->
          <div class="airgap-section" id="decodeResult" style="display: none;">
            <h3>Decoded Data</h3>
            <div class="decoded-data">
              <pre id="decodedContent"></pre>
            </div>
            <div class="decode-actions">
              <button class="airgap-btn airgap-btn-secondary" id="copyDecodedBtn">
                <i class="fas fa-copy"></i>
                Copy to Clipboard
              </button>
              <button class="airgap-btn airgap-btn-secondary" id="clearDecodeBtn">
                <i class="fas fa-trash"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return this.container;
  }

  async loadUsers() {
    try {
      // Get users from localStorage or global state
      const storedUsers = localStorage.getItem('4word_online_users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = [];
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  attachEventListeners() {
    // Mode toggle
    const modeButtons = this.container.querySelectorAll('.airgap-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Recipient select
    const recipientSelect = this.container.querySelector('#recipientSelect');
    recipientSelect?.addEventListener('change', (e) => {
      this.updateRecipientInfo(e.target.value);
    });

    // Data input
    const encodeData = this.container.querySelector('#encodeData');
    const encodeDataLength = this.container.querySelector('#encodeDataLength');
    const encodeWarning = this.container.querySelector('#encodeWarning');

    encodeData?.addEventListener('input', (e) => {
      const length = e.target.value.length;
      encodeDataLength.textContent = `${length} characters`;
      encodeWarning.style.display = length > 500 ? 'flex' : 'none';
    });

    // Encryption toggle
    const encryptToggle = this.container.querySelector('#encodeEncryptToggle');
    const encodeKeyGroup = this.container.querySelector('#encodeKeyGroup');

    encryptToggle?.addEventListener('change', (e) => {
      encodeKeyGroup.style.display = e.target.checked ? 'block' : 'none';
    });

    // Toggle key visibility
    const toggleEncodeKey = this.container.querySelector('#toggleEncodeKey');
    const encodeKeyInput = this.container.querySelector('#encodeKey');

    toggleEncodeKey?.addEventListener('click', () => {
      const isPassword = encodeKeyInput.type === 'password';
      encodeKeyInput.type = isPassword ? 'text' : 'password';
      toggleEncodeKey.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
    });

    // Generate QR
    const generateQrBtn = this.container.querySelector('#generateQrBtn');
    generateQrBtn?.addEventListener('click', () => this.generateQRCode());

    // Download & Print
    const downloadQrBtn = this.container.querySelector('#downloadQrBtn');
    downloadQrBtn?.addEventListener('click', () => this.downloadQRCode());

    const printQrBtn = this.container.querySelector('#printQrBtn');
    printQrBtn?.addEventListener('click', () => this.printQRCode());

    // Scan methods
    const scanMethodBtns = this.container.querySelectorAll('.scan-method-btn');
    scanMethodBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const method = e.currentTarget.dataset.method;
        this.switchScanMethod(method);
      });
    });

    // Camera controls
    const startScanBtn = this.container.querySelector('#startScanBtn');
    const stopScanBtn = this.container.querySelector('#stopScanBtn');

    startScanBtn?.addEventListener('click', () => this.startCameraScanner());
    stopScanBtn?.addEventListener('click', () => this.stopCameraScanner());

    // Upload
    const qrUploadZone = this.container.querySelector('#qrUploadZone');
    const qrFileInput = this.container.querySelector('#qrFileInput');

    qrUploadZone?.addEventListener('click', () => qrFileInput.click());
    qrFileInput?.addEventListener('change', (e) => this.handleFileUpload(e));

    qrUploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      qrUploadZone.classList.add('drag-over');
    });

    qrUploadZone?.addEventListener('dragleave', () => {
      qrUploadZone.classList.remove('drag-over');
    });

    qrUploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      qrUploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.processUploadedImage(file);
      }
    });

    const removeUploadBtn = this.container.querySelector('#removeUploadBtn');
    removeUploadBtn?.addEventListener('click', () => this.clearUpload());

    // Decode key toggle
    const toggleDecodeKey = this.container.querySelector('#toggleDecodeKey');
    const decodeKeyInput = this.container.querySelector('#decodeKey');

    toggleDecodeKey?.addEventListener('click', () => {
      const isPassword = decodeKeyInput.type === 'password';
      decodeKeyInput.type = isPassword ? 'text' : 'password';
      toggleDecodeKey.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
    });

    // Decrypt
    const decryptBtn = this.container.querySelector('#decryptBtn');
    decryptBtn?.addEventListener('click', () => this.decryptData());

    // Copy & Clear
    const copyDecodedBtn = this.container.querySelector('#copyDecodedBtn');
    copyDecodedBtn?.addEventListener('click', () => this.copyDecoded());

    const clearDecodeBtn = this.container.querySelector('#clearDecodeBtn');
    clearDecodeBtn?.addEventListener('click', () => this.clearDecode());

    // Initialize
    this.updateRecipientInfo('@everyone');
  }

  updateRecipientInfo(recipient) {
    const recipientInfo = this.container.querySelector('#recipientInfo');
    const encryptionInfo = this.container.querySelector('#encryptionInfo');

    if (recipient === '@everyone') {
      recipientInfo.innerHTML = '<i class="fas fa-globe"></i> Public message - anyone can decode this QR code';
      encryptionInfo.innerHTML = '<i class="fas fa-unlock"></i><span>No automatic encryption for public messages</span>';
    } else {
      const user = this.users.find(u => u.username === recipient);
      recipientInfo.innerHTML = `<i class="fas fa-lock"></i> Encrypted for ${user?.displayName || recipient} - only they can decode`;
      encryptionInfo.innerHTML = '<i class="fas fa-shield-alt"></i><span>Message will be RSA encrypted for recipient</span>';
    }
  }

  async generateQRCode() {
    const encodeData = this.container.querySelector('#encodeData').value.trim();
    const recipient = this.container.querySelector('#recipientSelect').value;
    const addAES = this.container.querySelector('#encodeEncryptToggle').checked;
    const aesKey = this.container.querySelector('#encodeKey').value;
    const qrSize = parseInt(this.container.querySelector('#qrSize').value);
    const errorLevel = this.container.querySelector('#qrErrorLevel').value;

    if (!encodeData) {
      this.showMessage('Please enter data to encode', 'error');
      return;
    }

    if (addAES && !aesKey) {
      this.showMessage('Please enter an encryption password', 'error');
      return;
    }

    try {
      let dataToEncode = encodeData;
      const metadata = {
        sender: this.currentUser.username,
        senderName: this.currentUser.displayName || this.currentUser.username,
        recipient: recipient,
        timestamp: Date.now(),
        layers: []
      };

      // Layer 1: RSA Encryption (if specific recipient)
      if (recipient !== '@everyone') {
        const recipientUser = this.users.find(u => u.username === recipient);
        if (!recipientUser?.publicKey) {
          this.showMessage('Recipient public key not found', 'error');
          return;
        }

        try {
          dataToEncode = await SecureCrypto.encryptWithPublicKey(dataToEncode, recipientUser.publicKey);
          metadata.layers.push('RSA');
          this.showMessage('RSA encryption applied', 'success');
        } catch (error) {
          console.error('RSA encryption error:', error);
          this.showMessage('RSA encryption failed: ' + error.message, 'error');
          return;
        }
      }

      // Layer 2: AES Encryption (optional)
      if (addAES) {
        const encrypted = await SecureCrypto.encrypt(dataToEncode, aesKey);
        dataToEncode = encrypted.encrypted;
        metadata.layers.push('AES');
        this.showMessage('AES encryption applied', 'success');
      }

      // Create payload
      const payload = {
        v: 1,
        m: metadata,
        d: dataToEncode
      };

      const finalData = JSON.stringify(payload);

      // Generate QR
      const canvas = this.container.querySelector('#qrCanvas');
      await QRCode.toCanvas(canvas, finalData, {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Show result
      const qrResult = this.container.querySelector('#qrResult');
      const qrInfo = this.container.querySelector('#qrInfo');
      qrResult.style.display = 'block';

      const encLayers = metadata.layers.length > 0 ? metadata.layers.join(' + ') : 'none';
      qrInfo.textContent = `QR Code generated (${qrSize}x${qrSize}px, encryption: ${encLayers})`;

      this.showMessage('QR Code generated successfully', 'success');
      qrResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error('QR generation error:', error);
      this.showMessage('Failed to generate QR code: ' + error.message, 'error');
    }
  }

  downloadQRCode() {
    const canvas = this.container.querySelector('#qrCanvas');
    const link = document.createElement('a');
    link.download = `airgap-qr-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    this.showMessage('QR Code downloaded', 'success');
  }

  printQRCode() {
    const canvas = this.container.querySelector('#qrCanvas');
    const dataUrl = canvas.toDataURL();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close()">
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  switchScanMethod(method) {
    const scanMethodBtns = this.container.querySelectorAll('.scan-method-btn');
    scanMethodBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.method === method);
    });

    const cameraScanner = this.container.querySelector('#cameraScanner');
    const uploadScanner = this.container.querySelector('#uploadScanner');

    if (method === 'camera') {
      cameraScanner.style.display = 'block';
      uploadScanner.style.display = 'none';
    } else {
      cameraScanner.style.display = 'none';
      uploadScanner.style.display = 'block';
    }
  }

  async startCameraScanner() {
    const qrReader = this.container.querySelector('#qrReader');
    const cameraPlaceholder = this.container.querySelector('#cameraPlaceholder');
    const startBtn = this.container.querySelector('#startScanBtn');
    const stopBtn = this.container.querySelector('#stopScanBtn');

    try {
      this.html5QrCode = new Html5Qrcode("qrReader");

      await this.html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          this.handleDecodedQR(decodedText);
          this.stopCameraScanner();
        },
        () => {}
      );

      this.isScanning = true;
      qrReader.style.display = 'block';
      cameraPlaceholder.style.display = 'none';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
    } catch (error) {
      console.error('Camera error:', error);
      this.showMessage('Failed to access camera', 'error');
    }
  }

  async stopCameraScanner() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    this.isScanning = false;
    const qrReader = this.container.querySelector('#qrReader');
    const cameraPlaceholder = this.container.querySelector('#cameraPlaceholder');
    const startBtn = this.container.querySelector('#startScanBtn');
    const stopBtn = this.container.querySelector('#stopScanBtn');

    if (qrReader) qrReader.style.display = 'none';
    if (cameraPlaceholder) cameraPlaceholder.style.display = 'flex';
    if (startBtn) startBtn.style.display = 'flex';
    if (stopBtn) stopBtn.style.display = 'none';
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processUploadedImage(file);
    }
  }

  async processUploadedImage(file) {
    const uploadedPreview = this.container.querySelector('#uploadedPreview');
    const uploadedImage = this.container.querySelector('#uploadedImage');
    const qrUploadZone = this.container.querySelector('#qrUploadZone');

    const reader = new FileReader();
    reader.onload = async (e) => {
      uploadedImage.src = e.target.result;
      qrUploadZone.style.display = 'none';
      uploadedPreview.style.display = 'block';

      try {
        if (!this.html5QrCode) {
          this.html5QrCode = new Html5Qrcode("qrReader");
        }

        const decodedText = await this.html5QrCode.scanFile(file, true);
        this.handleDecodedQR(decodedText);
      } catch (error) {
        console.error('QR decode error:', error);
        this.showMessage('No QR code found in image', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  clearUpload() {
    const uploadedPreview = this.container.querySelector('#uploadedPreview');
    const qrUploadZone = this.container.querySelector('#qrUploadZone');
    const qrFileInput = this.container.querySelector('#qrFileInput');

    uploadedPreview.style.display = 'none';
    qrUploadZone.style.display = 'flex';
    qrFileInput.value = '';
    this.clearDecode();
  }

  async handleDecodedQR(decodedText) {
    try {
      const payload = JSON.parse(decodedText);
      const { m: metadata, d: data } = payload;

      let decryptedData = data;

      // Layer 1: RSA Decryption
      if (metadata.layers && metadata.layers.includes('RSA')) {
        if (metadata.recipient !== this.currentUser.username) {
          this.showMessage(`This message is for @${metadata.recipient}`, 'error');
          return;
        }

        try {
          decryptedData = await SecureCrypto.decryptWithPrivateKey(decryptedData, this.currentUser.privateKey);
          this.showMessage('RSA decryption successful', 'success');
        } catch (error) {
          console.error('RSA decryption error:', error);
          this.showMessage('Failed to decrypt - invalid private key', 'error');
          return;
        }
      }

      // Layer 2: AES Decryption
      if (metadata.layers && metadata.layers.includes('AES')) {
        this.encryptedData = decryptedData;
        this.metadata = metadata;
        const decryptSection = this.container.querySelector('#decryptSection');
        decryptSection.style.display = 'block';
        this.showMessage('Password required for final decryption', 'info');
        return;
      }

      // No more layers
      this.displayDecodedData(decryptedData, metadata);
    } catch (error) {
      console.error('Decode error:', error);
      this.showMessage('Invalid QR code format', 'error');
    }
  }

  async decryptData() {
    const decodeKey = this.container.querySelector('#decodeKey').value;

    if (!decodeKey) {
      this.showMessage('Please enter decryption password', 'error');
      return;
    }

    try {
      const decrypted = await SecureCrypto.decrypt(this.encryptedData, decodeKey);

      const decryptSection = this.container.querySelector('#decryptSection');
      decryptSection.style.display = 'none';
      this.displayDecodedData(decrypted, this.metadata);
      this.showMessage('AES decryption successful', 'success');
    } catch (error) {
      console.error('AES decryption error:', error);
      this.showMessage('Failed to decrypt - invalid password', 'error');
    }
  }

  displayDecodedData(data, metadata) {
    const decodeResult = this.container.querySelector('#decodeResult');
    const decodedContent = this.container.querySelector('#decodedContent');

    decodedContent.textContent = data;
    decodeResult.style.display = 'block';

    decodeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  copyDecoded() {
    const decodedContent = this.container.querySelector('#decodedContent').textContent;
    navigator.clipboard.writeText(decodedContent)
      .then(() => this.showMessage('Copied to clipboard', 'success'))
      .catch(() => this.showMessage('Failed to copy', 'error'));
  }

  clearDecode() {
    const decryptSection = this.container.querySelector('#decryptSection');
    const decodeResult = this.container.querySelector('#decodeResult');
    const decodeKey = this.container.querySelector('#decodeKey');

    if (decryptSection) decryptSection.style.display = 'none';
    if (decodeResult) decodeResult.style.display = 'none';
    if (decodeKey) decodeKey.value = '';
    this.encryptedData = null;
    this.metadata = null;
  }

  switchMode(mode) {
    this.currentMode = mode;

    const modeButtons = this.container.querySelectorAll('.airgap-mode-btn');
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const panels = this.container.querySelectorAll('.airgap-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === mode);
    });

    if (mode !== 'decode' && this.isScanning) {
      this.stopCameraScanner();
    }
  }

  showMessage(text, type) {
    const event = new CustomEvent('show-message', {
      detail: { text, type }
    });
    window.dispatchEvent(event);
  }

  destroy() {
    if (this.isScanning) {
      this.stopCameraScanner();
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
