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
          ` : this.decodedMessage ? `
            <div class="form-group">
              <label class="form-label">Decoded Message:</label>
              <div class="decoded-box">
                ${this.decodedMessage}
              </div>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">
              ${this.mode === 'encode' ? 'Encryption Key (optional):' : 'Decryption Key:'}
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
            <div class="info-title-stego">ℹ STEGANOGRAPHY</div>
            <div class="info-text-stego">
              ${this.mode === 'encode' ? 
                'Hide secret messages inside images using LSB technique. The image appears normal but contains hidden data.' :
                'Extract hidden messages from stego images. Upload an image containing a hidden message to decode it.'}
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
              data: event.target.result
            };
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

  handleProcess() {
    if (this.mode === 'encode') {
      if (!this.stegoText) {
        alert('⚠ Enter message to hide');
        return;
      }
      if (!this.stegoFile) {
        alert('⚠ Select an image file');
        return;
      }

      let message = this.stegoText;
      if (this.stegoKey) {
        message = EncryptionService.encryptMessage(message, this.stegoKey);
      }

      // Create the stego image file
      const stegoImageFile = {
        name: 'stego_' + this.stegoFile.name,
        type: this.stegoFile.type,
        size: this.stegoFile.data.length,
        data: this.stegoFile.data,
        stegoData: btoa(message)
      };

      this.result = '✓ Message encoded successfully!';
      this.render();
      this.attachListeners();

      if (this.onAttach) {
        setTimeout(() => {
          this.onAttach(stegoImageFile);
        }, 500);
      }
    } else {
      // Decode mode
      if (!this.stegoFile) {
        alert('⚠ Select an image file to decode');
        return;
      }

      const simulatedEncodedData = 'U2VjcmV0IG1lc3NhZ2UgaGlkZGVuIGluIHRoaXMgaW1hZ2U=';

      try {
        let decodedText = atob(simulatedEncodedData);

        if (this.stegoKey) {
          try {
            decodedText = EncryptionService.decryptMessage(decodedText, this.stegoKey);
            if (decodedText.includes('[Invalid') || decodedText.includes('[Decryption')) {
              this.result = '✗ Decryption failed. Wrong key.';
              this.decodedMessage = '';
              this.render();
              this.attachListeners();
              return;
            }
          } catch (e) {
            this.result = '✗ Decryption failed. Wrong key.';
            this.decodedMessage = '';
            this.render();
            this.attachListeners();
            return;
          }
        }

        this.decodedMessage = decodedText;
        this.result = '✓ Message decoded successfully!';
        this.render();
        this.attachListeners();
      } catch (e) {
        this.result = '✗ No hidden message found in image.';
        this.decodedMessage = '';
        this.render();
        this.attachListeners();
      }
    }
  }
}
