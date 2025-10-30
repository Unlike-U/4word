import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import CryptoJS from 'crypto-js';

export class AirGapView {
  constructor() {
    this.container = null;
    this.currentMode = 'encode';
    this.html5QrCode = null;
    this.isScanning = false;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'airgap-view';

    this.container.innerHTML = `
      <div class="airgap-header">
        <h2>
          <i class="fas fa-plane-slash"></i>
          Air Gap Security
        </h2>
        <p class="airgap-subtitle">Offline data transfer via QR codes with optional encryption</p>
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
            <h3>Optional Encryption</h3>
            <div class="encryption-toggle">
              <label class="toggle-switch">
                <input type="checkbox" id="encodeEncryptToggle">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Encrypt data before encoding</span>
              </label>
            </div>
            <div class="encryption-key-group" id="encodeKeyGroup" style="display: none;">
              <div class="encryption-key-container">
                <label>
                  <i class="fas fa-key"></i>
                  Encryption Key
                </label>
                <div style="display: flex; gap: 8px;">
                  <input 
                    type="password" 
                    class="encryption-key-input" 
                    id="encodeKey" 
                    placeholder="Enter encryption key..."
                  />
                  <button class="toggle-key-btn" id="toggleEncodeKey">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              <p class="encryption-hint">
                <i class="fas fa-info-circle"></i>
                Remember this key - you'll need it to decrypt the data
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
            <h3>Decryption Required</h3>
            <div class="encryption-key-container">
              <label>
                <i class="fas fa-key"></i>
                Decryption Key
              </label>
              <div style="display: flex; gap: 8px;">
                <input 
                  type="password" 
                  class="encryption-key-input" 
                  id="decodeKey" 
                  placeholder="Enter decryption key..."
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

  attachEventListeners() {
    // Mode toggle
    const modeButtons = this.container.querySelectorAll('.airgap-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });

    // ENCODE PANEL
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

    // Download QR
    const downloadQrBtn = this.container.querySelector('#downloadQrBtn');
    downloadQrBtn?.addEventListener('click', () => this.downloadQRCode());

    // Print QR
    const printQrBtn = this.container.querySelector('#printQrBtn');
    printQrBtn?.addEventListener('click', () => this.printQRCode());

    // DECODE PANEL
    const scanMethodBtns = this.container.querySelectorAll('.scan-method-btn');
    scanMethodBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const method = e.currentTarget.dataset.method;
        this.switchScanMethod(method);
      });
    });

    // Camera scanner
    const startScanBtn = this.container.querySelector('#startScanBtn');
    const stopScanBtn = this.container.querySelector('#stopScanBtn');

    startScanBtn?.addEventListener('click', () => this.startCameraScanner());
    stopScanBtn?.addEventListener('click', () => this.stopCameraScanner());

    // Upload scanner
    const qrUploadZone = this.container.querySelector('#qrUploadZone');
    const qrFileInput = this.container.querySelector('#qrFileInput');

    qrUploadZone?.addEventListener('click', () => qrFileInput.click());
    qrFileInput?.addEventListener('change', (e) => this.handleFileUpload(e));

    // Drag and drop
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

    // Remove upload
    const removeUploadBtn = this.container.querySelector('#removeUploadBtn');
    removeUploadBtn?.addEventListener('click', () => this.clearUpload());

    // Toggle decode key visibility
    const toggleDecodeKey = this.container.querySelector('#toggleDecodeKey');
    const decodeKeyInput = this.container.querySelector('#decodeKey');

    toggleDecodeKey?.addEventListener('click', () => {
      const isPassword = decodeKeyInput.type === 'password';
      decodeKeyInput.type = isPassword ? 'text' : 'password';
      toggleDecodeKey.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
    });

    // Decrypt button
    const decryptBtn = this.container.querySelector('#decryptBtn');
    decryptBtn?.addEventListener('click', () => this.decryptData());

    // Copy decoded
    const copyDecodedBtn = this.container.querySelector('#copyDecodedBtn');
    copyDecodedBtn?.addEventListener('click', () => this.copyDecoded());

    // Clear decode
    const clearDecodeBtn = this.container.querySelector('#clearDecodeBtn');
    clearDecodeBtn?.addEventListener('click', () => this.clearDecode());
  }

  switchMode(mode) {
    this.currentMode = mode;

    // Update buttons
    const modeButtons = this.container.querySelectorAll('.airgap-mode-btn');
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update panels
    const panels = this.container.querySelectorAll('.airgap-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === mode);
    });

    // Stop scanner if switching away from decode
    if (mode !== 'decode' && this.isScanning) {
      this.stopCameraScanner();
    }
  }

  async generateQRCode() {
    const encodeData = this.container.querySelector('#encodeData').value.trim();
    const encryptToggle = this.container.querySelector('#encodeEncryptToggle').checked;
    const encodeKey = this.container.querySelector('#encodeKey').value;
    const qrSize = parseInt(this.container.querySelector('#qrSize').value);
    const errorLevel = this.container.querySelector('#qrErrorLevel').value;

    if (!encodeData) {
      this.showMessage('Please enter data to encode', 'error');
      return;
    }

    if (encryptToggle && !encodeKey) {
      this.showMessage('Please enter an encryption key', 'error');
      return;
    }

    try {
      let dataToEncode = encodeData;

      // Encrypt if enabled
      if (encryptToggle) {
        const encrypted = CryptoJS.AES.encrypt(encodeData, encodeKey).toString();
        dataToEncode = `ENCRYPTED:${encrypted}`;
        this.showMessage('Data encrypted successfully', 'success');
      }

      // Generate QR code
      const canvas = this.container.querySelector('#qrCanvas');
      await QRCode.toCanvas(canvas, dataToEncode, {
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
      qrInfo.textContent = `QR Code generated (${qrSize}x${qrSize}px, ${encryptToggle ? 'encrypted' : 'unencrypted'})`;

      this.showMessage('QR Code generated successfully', 'success');

      // Scroll to result
      qrResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error('QR generation error:', error);
      this.showMessage('Failed to generate QR code', 'error');
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
            body { 
              margin: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
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
      if (this.isScanning) this.stopCameraScanner();
    } else {
      cameraScanner.style.display = 'none';
      uploadScanner.style.display = 'block';
      if (this.isScanning) this.stopCameraScanner();
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
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          this.handleDecodedQR(decodedText);
          this.stopCameraScanner();
        },
        (errorMessage) => {
          // Scanning errors are normal, ignore
        }
      );

      this.isScanning = true;
      qrReader.style.display = 'block';
      cameraPlaceholder.style.display = 'none';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
    } catch (error) {
      console.error('Camera error:', error);
      this.showMessage('Failed to access camera. Please check permissions.', 'error');
    }
  }

  async stopCameraScanner() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    this.isScanning = false;
    const qrReader = this.container.querySelector('#qrReader');
    const cameraPlaceholder = this.container.querySelector('#cameraPlaceholder');
    const startBtn = this.container.querySelector('#startScanBtn');
    const stopBtn = this.container.querySelector('#stopScanBtn');

    qrReader.style.display = 'none';
    cameraPlaceholder.style.display = 'flex';
    startBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
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

      // Decode QR from image
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

  handleDecodedQR(decodedText) {
    // Check if encrypted
    if (decodedText.startsWith('ENCRYPTED:')) {
      this.encryptedData = decodedText.substring(10);
      const decryptSection = this.container.querySelector('#decryptSection');
      decryptSection.style.display = 'block';
      this.showMessage('Encrypted data detected. Enter decryption key.', 'info');
    } else {
      this.displayDecodedData(decodedText);
    }
  }

  decryptData() {
    const decodeKey = this.container.querySelector('#decodeKey').value;

    if (!decodeKey) {
      this.showMessage('Please enter decryption key', 'error');
      return;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(this.encryptedData, decodeKey).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        this.showMessage('Invalid decryption key', 'error');
        return;
      }

      this.displayDecodedData(decrypted);
      this.showMessage('Data decrypted successfully', 'success');
      
      const decryptSection = this.container.querySelector('#decryptSection');
      decryptSection.style.display = 'none';
    } catch (error) {
      console.error('Decryption error:', error);
      this.showMessage('Failed to decrypt data. Check your key.', 'error');
    }
  }

  displayDecodedData(data) {
    const decodeResult = this.container.querySelector('#decodeResult');
    const decodedContent = this.container.querySelector('#decodedContent');

    decodedContent.textContent = data;
    decodeResult.style.display = 'block';

    // Scroll to result
    decodeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  copyDecoded() {
    const decodedContent = this.container.querySelector('#decodedContent').textContent;
    navigator.clipboard.writeText(decodedContent)
      .then(() => {
        this.showMessage('Copied to clipboard', 'success');
      })
      .catch(() => {
        this.showMessage('Failed to copy', 'error');
      });
  }

  clearDecode() {
    const decryptSection = this.container.querySelector('#decryptSection');
    const decodeResult = this.container.querySelector('#decodeResult');
    const decodeKey = this.container.querySelector('#decodeKey');

    decryptSection.style.display = 'none';
    decodeResult.style.display = 'none';
    decodeKey.value = '';
    this.encryptedData = null;
  }

  showMessage(text, type) {
    // Import and use your existing message system
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
