import AdvancedSteganography from '../services/AdvancedSteganography.js';
import MessageManager from '../managers/MessageManager.js';

export class SteganographyView {
  constructor() {
    this.container = null;
    this.mode = 'hide'; // 'hide' or 'extract'
    this.selectedImage = null;
    this.stegoService = AdvancedSteganography;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'steganography-view';
    this.container.innerHTML = `
      <div class="stego-header">
        <h2><i class="fas fa-image"></i> Image Steganography</h2>
        <p class="stego-subtitle">Hide secret messages in images</p>
      </div>

      <div class="stego-mode-toggle">
        <button class="stego-mode-btn active" data-mode="hide">
          <i class="fas fa-eye-slash"></i> Hide Message
        </button>
        <button class="stego-mode-btn" data-mode="extract">
          <i class="fas fa-eye"></i> Extract Message
        </button>
      </div>

      <div class="stego-content">
        <!-- Hide Message Panel -->
        <div class="stego-panel hide-panel active">
          <div class="stego-section">
            <h3>1. Select Image</h3>
            <div class="image-upload-zone" id="hideImageUpload">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Click or drag image here</p>
              <span class="upload-hint">PNG, JPG, or GIF</span>
              <input type="file" id="hideImageInput" accept="image/*" hidden>
            </div>
            <div class="image-preview" id="hideImagePreview" style="display: none;">
              <img id="hidePreviewImg" alt="Preview">
              <div class="image-info" id="hideImageInfo"></div>
            </div>
          </div>

          <div class="stego-section">
            <h3>2. Enter Message</h3>
            <textarea 
              id="hideMessageInput" 
              class="stego-textarea" 
              placeholder="Enter your secret message here..."
              rows="6"
            ></textarea>
            <div class="message-stats">
              <span id="hideMessageLength">0 characters</span>
              <span id="hideCapacityWarning" class="capacity-warning"></span>
            </div>
          </div>

          <div class="stego-section">
            <h3>3. Optional Password</h3>
            <input 
              type="password" 
              id="hidePasswordInput" 
              class="stego-input" 
              placeholder="Enter password for encryption (optional)"
            >
          </div>

          <div class="stego-section">
            <h3>4. Advanced Options</h3>
            <div class="stego-options">
              <label class="stego-option">
                <span>Bits per channel:</span>
                <select id="hideBitsPerChannel" class="stego-select">
                  <option value="1">1 (Most secure, least capacity)</option>
                  <option value="2" selected>2 (Balanced)</option>
                  <option value="4">4 (Less secure, more capacity)</option>
                </select>
              </label>
            </div>
          </div>

          <button class="stego-btn stego-btn-primary" id="hideMessageBtn" disabled>
            <i class="fas fa-lock"></i> Hide Message
          </button>
        </div>

        <!-- Extract Message Panel -->
        <div class="stego-panel extract-panel">
          <div class="stego-section">
            <h3>1. Select Image</h3>
            <div class="image-upload-zone" id="extractImageUpload">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Click or drag image here</p>
              <span class="upload-hint">Image with hidden message</span>
              <input type="file" id="extractImageInput" accept="image/*" hidden>
            </div>
            <div class="image-preview" id="extractImagePreview" style="display: none;">
              <img id="extractPreviewImg" alt="Preview">
            </div>
          </div>

          <div class="stego-section">
            <h3>2. Optional Password</h3>
            <input 
              type="password" 
              id="extractPasswordInput" 
              class="stego-input" 
              placeholder="Enter password if message is encrypted"
            >
          </div>

          <button class="stego-btn stego-btn-primary" id="extractMessageBtn" disabled>
            <i class="fas fa-unlock"></i> Extract Message
          </button>

          <div class="stego-section" id="extractedMessageSection" style="display: none;">
            <h3>Extracted Message</h3>
            <div class="extracted-message" id="extractedMessage"></div>
            <button class="stego-btn stego-btn-secondary" id="copyExtractedBtn">
              <i class="fas fa-copy"></i> Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return this.container;
  }

  attachEventListeners() {
    // Mode toggle
    this.container.querySelectorAll('.stego-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });

    // Hide panel events
    this.setupHidePanel();
    
    // Extract panel events
    this.setupExtractPanel();
  }

  setupHidePanel() {
    const uploadZone = this.container.querySelector('#hideImageUpload');
    const fileInput = this.container.querySelector('#hideImageInput');
    const messageInput = this.container.querySelector('#hideMessageInput');
    const hideBtn = this.container.querySelector('#hideMessageBtn');
    const bitsSelect = this.container.querySelector('#hideBitsPerChannel');

    // File upload
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this.handleHideImageSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleHideImageSelect(e.target.files[0]);
      }
    });

    // Message input
    messageInput.addEventListener('input', () => {
      this.updateMessageStats();
      this.validateHideForm();
    });

    // Bits per channel change
    bitsSelect.addEventListener('change', (e) => {
      this.stegoService.setBitsPerChannel(parseInt(e.target.value));
      this.updateMessageStats();
    });

    // Hide button
    hideBtn.addEventListener('click', () => this.hideMessage());
  }

  setupExtractPanel() {
    const uploadZone = this.container.querySelector('#extractImageUpload');
    const fileInput = this.container.querySelector('#extractImageInput');
    const extractBtn = this.container.querySelector('#extractMessageBtn');
    const copyBtn = this.container.querySelector('#copyExtractedBtn');

    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this.handleExtractImageSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleExtractImageSelect(e.target.files[0]);
      }
    });

    extractBtn.addEventListener('click', () => this.extractMessage());
    copyBtn.addEventListener('click', () => this.copyExtractedMessage());
  }

  async handleHideImageSelect(file) {
    if (!file.type.startsWith('image/')) {
      MessageManager.showError('Please select a valid image file');
      return;
    }

    this.selectedImage = file;
    
    // Show preview
    const preview = this.container.querySelector('#hideImagePreview');
    const img = this.container.querySelector('#hidePreviewImg');
    const info = this.container.querySelector('#hideImageInfo');

    img.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    this.container.querySelector('#hideImageUpload').style.display = 'none';

    // Analyze image
    try {
      const analysis = await this.stegoService.analyzeImage(file);
      info.innerHTML = `
        <div class="info-item"><strong>Size:</strong> ${analysis.width}x${analysis.height}</div>
        <div class="info-item"><strong>Capacity:</strong> ~${analysis.maxChars} characters</div>
      `;
      this.imageCapacity = analysis.maxChars;
      this.updateMessageStats();
    } catch (error) {
      MessageManager.showError('Failed to analyze image');
      console.error(error);
    }

    this.validateHideForm();
  }

  handleExtractImageSelect(file) {
    if (!file.type.startsWith('image/')) {
      MessageManager.showError('Please select a valid image file');
      return;
    }

    this.selectedExtractImage = file;
    
    const preview = this.container.querySelector('#extractImagePreview');
    const img = this.container.querySelector('#extractPreviewImg');

    img.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    this.container.querySelector('#extractImageUpload').style.display = 'none';

    this.container.querySelector('#extractMessageBtn').disabled = false;
  }

  updateMessageStats() {
    const messageInput = this.container.querySelector('#hideMessageInput');
    const lengthSpan = this.container.querySelector('#hideMessageLength');
    const warningSpan = this.container.querySelector('#hideCapacityWarning');

    const length = messageInput.value.length;
    lengthSpan.textContent = `${length} characters`;

    if (this.imageCapacity) {
      if (length > this.imageCapacity) {
        warningSpan.textContent = `⚠️ Message too long! Max: ${this.imageCapacity} characters`;
        warningSpan.style.display = 'block';
      } else {
        warningSpan.style.display = 'none';
      }
    }
  }

  validateHideForm() {
    const messageInput = this.container.querySelector('#hideMessageInput');
    const hideBtn = this.container.querySelector('#hideMessageBtn');
    
    const hasImage = this.selectedImage !== null;
    const hasMessage = messageInput.value.trim().length > 0;
    const fitsInImage = !this.imageCapacity || messageInput.value.length <= this.imageCapacity;

    hideBtn.disabled = !(hasImage && hasMessage && fitsInImage);
  }

  async hideMessage() {
    const messageInput = this.container.querySelector('#hideMessageInput');
    const passwordInput = this.container.querySelector('#hidePasswordInput');
    const hideBtn = this.container.querySelector('#hideMessageBtn');

    const message = messageInput.value.trim();
    const password = passwordInput.value;

    if (!this.selectedImage || !message) return;

    hideBtn.disabled = true;
    hideBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Hiding...';

    try {
      const resultBlob = await this.stegoService.hideMessage(
        this.selectedImage,
        message,
        password
      );

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stego_' + Date.now() + '.png';
      a.click();
      URL.revokeObjectURL(url);

      MessageManager.showSuccess('Message hidden successfully! Image downloaded.');
      
      // Reset form
      this.resetHideForm();
    } catch (error) {
      MessageManager.showError('Failed to hide message: ' + error.message);
      console.error(error);
    } finally {
      hideBtn.disabled = false;
      hideBtn.innerHTML = '<i class="fas fa-lock"></i> Hide Message';
    }
  }

  async extractMessage() {
    const passwordInput = this.container.querySelector('#extractPasswordInput');
    const extractBtn = this.container.querySelector('#extractMessageBtn');
    const messageSection = this.container.querySelector('#extractedMessageSection');
    const messageDiv = this.container.querySelector('#extractedMessage');

    const password = passwordInput.value;

    if (!this.selectedExtractImage) return;

    extractBtn.disabled = true;
    extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extracting...';

    try {
      const message = await this.stegoService.extractMessage(
        this.selectedExtractImage,
        password
      );

      messageDiv.textContent = message;
      messageSection.style.display = 'block';
      
      MessageManager.showSuccess('Message extracted successfully!');
    } catch (error) {
      MessageManager.showError('Failed to extract message: ' + error.message);
      console.error(error);
      messageSection.style.display = 'none';
    } finally {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<i class="fas fa-unlock"></i> Extract Message';
    }
  }

  copyExtractedMessage() {
    const messageDiv = this.container.querySelector('#extractedMessage');
    const text = messageDiv.textContent;

    navigator.clipboard.writeText(text).then(() => {
      MessageManager.showSuccess('Message copied to clipboard!');
    }).catch(() => {
      MessageManager.showError('Failed to copy message');
    });
  }

  resetHideForm() {
    this.selectedImage = null;
    this.imageCapacity = null;
    this.container.querySelector('#hideImageInput').value = '';
    this.container.querySelector('#hideMessageInput').value = '';
    this.container.querySelector('#hidePasswordInput').value = '';
    this.container.querySelector('#hideImagePreview').style.display = 'none';
    this.container.querySelector('#hideImageUpload').style.display = 'flex';
    this.updateMessageStats();
    this.validateHideForm();
  }

  switchMode(mode) {
    this.mode = mode;

    // Update buttons
    this.container.querySelectorAll('.stego-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update panels
    this.container.querySelectorAll('.stego-panel').forEach(panel => {
      panel.classList.toggle('active', panel.classList.contains(`${mode}-panel`));
    });
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.selectedImage = null;
    this.selectedExtractImage = null;
  }
}
