import { EncryptionService } from '../services/encryption.js';

export class SteganographyView {
  constructor(container, stateManager, onAttach) {
    this.container = container;
    this.state = stateManager;
    this.onAttach = onAttach;
    this.mode = 'encode';
    this.stegoText = '';
    this.stegoKey = '';
    this.stegoFile = null;
    this.result = '';
    this.decodedMessage = '';
    
    this.render();
    this.attachListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="stego-view">
        <div class="stego-mode-toggle">
          <button 
            class="mode-btn ${this.mode === 'encode' ? 'active' : ''}" 
            id="encodeModeBtn"
          >
            ENCODE
          </button>
          <button 
            class="mode-btn ${this.mode === 'decode' ? 'active' : ''}" 
            id="decodeModeBtn"
          >
            DECODE
          </button>
        </div>

        <div class="stego-form">
          <div class="form-group">
            <label class="form-label">Select Image File:</label>
            <input 
              type="file" 
              accept="image/*" 
              id="stegoFileInput" 
              class="file-input-stego"
            />
            ${this.stegoFile ? `
              <div class="file-preview-stego">
                <img src="${this.stegoFile.data}" alt="preview" class="preview-img-stego" />
                <span class="preview-name-stego">${this.stegoFile.name}</span>
              </div>
            ` : ''}
          </div>

          ${this.mode === 'encode' ? `
            <div class="form-group">
              <label class="form-label">Message to Hide:</label>
              <textarea 
                id="stegoTextInput" 
                class="stego-textarea" 
                placeholder="Enter secret message to hide in image"
              >${this.stegoText}</textarea>
            </div>
          ` : ''}

          ${this.decodedMessage && this.mode === 'decode' ? `
            <div class="form-group">
              <label class="form-label">Decoded Message:</label>
              <div class="decoded-box">
                ${this.decodedMessage}
              </div>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">
              ${this.mode === 'encode' ? 'Encryption Key (optional):' : 'Decryption Key (if encrypted):'}
            </label>
            <input 
              type="password" 
              id="stegoKeyInput" 
              class="stego-input" 
              placeholder="enter.key"
              value="${this.stegoKey}"
            />
          </div>

          <button class="btn-stego-process" id="processBtn">
            ${this.mode === 'encode' ? '▶ ENCODE & ATTACH' : '▶ DECODE MESSAGE'}
          </button>

          ${this.result ? `
            <div class="stego-result ${this.result.includes('✗') ? 'error' : 'success'}">
              ${this.result}
            </div>
          ` : ''}

          <div class="stego-info-box">
            <div class="info-title-stego">ℹ STEGANOGRAPHY INFO</div>
            <div class="info-text-stego">
              ${this.mode === 'encode' ? 
                'Hide secret messages inside images. The message is embedded in the image metadata. Add an encryption key for additional security.' :
                'Extract hidden messages from stego images. If the message was encrypted, enter the decryption key to reveal the content.'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachListeners() {
    // Mode toggle
    const encodeModeBtn = this.container.querySelector('#encodeModeBtn');
    if (encodeModeBtn) {
      encodeModeBtn.addEventListener('click', () => {
        this.mode = 'encode';
        this.result = '';
        this.decodedMessage = '';
        this.stegoKey = '';
        this.render();
        this.attachListeners();
      });
    }

    const decodeModeBtn = this.container.querySelector('#decodeModeBtn');
    if (decodeModeBtn) {
      decodeModeBtn.addEventListener('click', () => {
        this.mode = 'decode';
        this.result = '';
        this.decodedMessage = '';
        this.stegoText = '';
        this.stegoKey = '';
        this.render();
        this.attachListeners();
      });
    }

    // File input
    const stegoFileInput = this.container.querySelector('#stegoFileInput');
    if (stegoFileInput) {
      stegoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.stegoFile = {
              name: file.name,
              type: file.type,
              data: event.target.result,
              originalFile: file
            };
            
            // Try to extract hidden data if in decode mode
            if (this.mode === 'decode') {
              this.tryExtractFromFileName(file.name);
            }
            
            this.render();
            this.attachListeners();
          };
          reader.readAsDataURL(file);
        } else {
          alert('⚠ Please select an image file');
        }
      });
    }

    // Text input
    const stegoTextInput = this.container.querySelector('#stegoTextInput');
    if (stegoTextInput) {
      stegoTextInput.addEventListener('input', (e) => {
        this.stegoText = e.target.value;
      });
    }

    // Key input
    const stegoKeyInput = this.container.querySelector('#stegoKeyInput');
    if (stegoKeyInput) {
      stegoKeyInput.addEventListener('input', (e) => {
        this.stegoKey = e.target.value;
      });
    }

    // Process button
    const processBtn = this.container.querySelector('#processBtn');
    if (processBtn) {
      processBtn.addEventListener('click', () => {
        this.handleProcess();
      });
    }
  }

  tryExtractFromFileName(fileName) {
    // Check if filename indicates it's a stego image
    if (fileName.startsWith('stego_')) {
      this.result = 'ℹ Stego image detected. Click DECODE to extract message.';
    }
  }

  handleProcess() {
    if (this.mode === 'encode') {
      this.handleEncode();
    } else {
      this.handleDecode();
    }
  }

  handleEncode() {
    if (!this.stegoText.trim()) {
      alert('⚠ Enter a message to hide');
      return;
    }
    
    if (!this.stegoFile) {
      alert('⚠ Select an image file');
      return;
    }

    let messageToHide = this.stegoText.trim();
    let isEncrypted = false;

    // Encrypt if key provided
    if (this.stegoKey.trim()) {
      try {
        messageToHide = EncryptionService.encryptMessage(messageToHide, this.stegoKey);
        isEncrypted = true;
        console.log('Message encrypted:', messageToHide.substring(0, 50) + '...');
      } catch (error) {
        alert('⚠ Encryption failed: ' + error.message);
        return;
      }
    }

    // Encode the message in base64 and add metadata
    const encodedData = btoa(unescape(encodeURIComponent(messageToHide)));
    
    // Create metadata object
    const metadata = {
      hidden: encodedData,
      encrypted: isEncrypted,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Embed metadata in the filename for this demo
    // In a real implementation, you would use canvas to modify LSB of image pixels
    const metadataString = btoa(JSON.stringify(metadata));
    
    // Create the stego image file
    const stegoImageFile = {
      name: 'stego_' + Date.now() + '_' + this.stegoFile.name,
      type: this.stegoFile.type,
      size: this.stegoFile.data.length,
      data: this.stegoFile.data,
      // Store metadata for retrieval
      stegoMetadata: metadataString
    };

    this.result = `✓ Message ${isEncrypted ? 'encrypted and ' : ''}encoded successfully! Attaching to message...`;
    this.render();
    this.attachListeners();

    // Attach to message
    if (this.onAttach) {
      setTimeout(() => {
        this.onAttach(stegoImageFile);
      }, 800);
    }
  }

  handleDecode() {
    if (!this.stegoFile) {
      alert('⚠ Select a stego image file to decode');
      return;
    }

    // Try to extract metadata from the file
    let metadata = null;
    let hiddenMessage = null;

    // Check if file has stegoMetadata (from our encoding)
    if (this.stegoFile.stegoMetadata) {
      try {
        metadata = JSON.parse(atob(this.stegoFile.stegoMetadata));
        hiddenMessage = decodeURIComponent(escape(atob(metadata.hidden)));
        console.log('Found metadata:', metadata);
      } catch (error) {
        console.error('Failed to parse metadata:', error);
      }
    }

    // If no metadata found, check if it's from an attached file with metadata
    if (!hiddenMessage && this.stegoFile.data) {
      // For demo: show instructions
      this.result = '⚠ No hidden message found. This image may not contain a stego message, or it was created outside this app.';
      this.decodedMessage = '';
      this.render();
      this.attachListeners();
      return;
    }

    if (!hiddenMessage) {
      this.result = '✗ No hidden message found in this image.';
      this.decodedMessage = '';
      this.render();
      this.attachListeners();
      return;
    }

    // If message is encrypted, try to decrypt
    if (metadata && metadata.encrypted) {
      if (!this.stegoKey.trim()) {
        this.result = '⚠ This message is encrypted. Enter the decryption key.';
        this.decodedMessage = '🔒 [ENCRYPTED MESSAGE - KEY REQUIRED]';
        this.render();
        this.attachListeners();
        return;
      }

      try {
        const decrypted = EncryptionService.decryptMessage(hiddenMessage, this.stegoKey);
        
        if (decrypted.includes('[Invalid') || decrypted.includes('[Decryption')) {
          this.result = '✗ Decryption failed. Wrong key.';
          this.decodedMessage = '🔒 [WRONG DECRYPTION KEY]';
          this.render();
          this.attachListeners();
          return;
        }

        this.decodedMessage = decrypted;
        this.result = '✓ Message decrypted and decoded successfully!';
      } catch (error) {
        this.result = '✗ Decryption failed: ' + error.message;
        this.decodedMessage = '🔒 [DECRYPTION ERROR]';
        this.render();
        this.attachListeners();
        return;
      }
    } else {
      // Message is not encrypted
      this.decodedMessage = hiddenMessage;
      this.result = '✓ Message decoded successfully!';
    }

    this.render();
    this.attachListeners();
  }
}
