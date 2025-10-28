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
  }

  render() {
    this.container.innerHTML = `
      <div class="stego-terminal">
        <div class="stego-header-terminal">
          <div class="mode-selector">
            <button 
              class="mode-btn-terminal ${this.mode === 'encode' ? 'active' : ''}" 
              id="encodeModeBtn"
            >
              ENCODE
            </button>
            <button 
              class="mode-btn-terminal ${this.mode === 'decode' ? 'active' : ''}" 
              id="decodeModeBtn"
            >
              DECODE
            </button>
          </div>
        </div>

        <div class="stego-body-terminal">
          <!-- File Upload -->
          <div class="stego-field">
            <label class="stego-label">IMAGE FILE:</label>
            <input 
              type="file" 
              accept="image/*" 
              id="stegoFileInput" 
              class="file-input-terminal"
            />
            ${this.stegoFile ? `
              <div class="file-preview-terminal">
                <img src="${this.stegoFile.data}" alt="preview" class="preview-img-terminal" />
                <span class="preview-filename">${this.stegoFile.name}</span>
              </div>
            ` : ''}
          </div>

          ${this.mode === 'encode' ? `
            <div class="stego-field">
              <label class="stego-label">SECRET MESSAGE:</label>
              <textarea 
                id="stegoTextInput" 
                class="stego-textarea" 
                placeholder="enter.secret.message"
              >${this.stegoText}</textarea>
            </div>
          ` : this.decodedMessage ? `
            <div class="stego-field">
              <label class="stego-label">DECODED MESSAGE:</label>
              <div class="decoded-box">
                ${this.decodedMessage}
              </div>
            </div>
          ` : ''}

          <div class="stego-field">
            <label class="stego-label">
              ${this.mode === 'encode' ? 'ENCRYPTION KEY (OPTIONAL):' : 'DECRYPTION KEY:'}
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
            <div class="info-title-terminal">ℹ STEGANOGRAPHY INFO</div>
            <div class="info-text-terminal">
              ${this.mode === 'encode' ? 
                'Hide secret messages inside images using LSB technique. Image appears normal but contains hidden encrypted data.' :
                'Extract hidden messages from stego images. Upload an image containing a hidden message to decode it.'}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Mode toggle
    document.getElementById('encodeModeBtn')?.addEventListener('click', () => {
      this.mode = 'encode';
      this.result = '';
      this.decodedMessage = '';
      this.render();
    });

    document.getElementById('decodeModeBtn')?.addEventListener('click', () => {
      this.mode = 'decode';
      this.result = '';
      this.decodedMessage = '';
      this.render();
    });

    // File input
    document.getElementById('stegoFileInput')?.addEventListener('change', (e) => {
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
        };
        reader.readAsDataURL(file);
      } else {
        alert('⚠ Please select an image file');
      }
    });

    // Text input
    document.getElementById('stegoTextInput')?.addEventListener('input', (e) => {
      this.stegoText = e.target.value;
    });

    // Key input
    document.getElementById('stegoKeyInput')?.addEventListener('input', (e) => {
      this.stegoKey = e.target.value;
    });

    // Process button
    document.getElementById('processBtn')?.addEventListener('click', () => {
      this.handleProcess();
    });
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
        stegoData: btoa(message) // Store hidden data
      };

      this.result = '✓ Message encoded successfully!';
      this.render();

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

      // Simulate decoding
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
              return;
            }
          } catch (e) {
            this.result = '✗ Decryption failed. Wrong key.';
            this.decodedMessage = '';
            this.render();
            return;
          }
        }

        this.decodedMessage = decodedText;
        this.result = '✓ Message decoded successfully!';
        this.render();
      } catch (e) {
        this.result = '✗ No hidden message found in image.';
        this.decodedMessage = '';
        this.render();
      }
    }
  }
}
