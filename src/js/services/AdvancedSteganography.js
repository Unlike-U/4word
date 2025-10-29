/**
 * Advanced Steganography Service
 * Handles hiding and extracting messages in images
 */
export class AdvancedSteganography {
  constructor() {
    this.bitsPerChannel = 2; // Number of LSBs to use per color channel
  }

  /**
   * Hide a message in an image
   * @param {File} imageFile - The image file to hide the message in
   * @param {string} message - The message to hide
   * @param {string} password - Optional password for encryption
   * @returns {Promise<Blob>} The image with hidden message
   */
  async hideMessage(imageFile, message, password = '') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Prepare message
          const fullMessage = password ? this.encryptMessage(message, password) : message;
          const messageWithLength = this.prependLength(fullMessage);
          const binaryMessage = this.stringToBinary(messageWithLength);

          // Check if message fits
          const maxCapacity = (data.length / 4) * 3 * this.bitsPerChannel;
          if (binaryMessage.length > maxCapacity) {
            reject(new Error('Message too long for this image'));
            return;
          }

          // Hide message in image
          let messageIndex = 0;
          for (let i = 0; i < data.length && messageIndex < binaryMessage.length; i++) {
            // Skip alpha channel
            if ((i + 1) % 4 === 0) continue;

            // Modify LSBs
            const bits = binaryMessage.substr(messageIndex, this.bitsPerChannel);
            if (bits.length > 0) {
              data[i] = this.modifyLSBs(data[i], bits);
              messageIndex += bits.length;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Extract a message from an image
   * @param {File} imageFile - The image file to extract from
   * @param {string} password - Optional password for decryption
   * @returns {Promise<string>} The extracted message
   */
  async extractMessage(imageFile, password = '') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Extract message length first (32 bits)
          let binaryLength = '';
          let pixelIndex = 0;

          while (binaryLength.length < 32 && pixelIndex < data.length) {
            if ((pixelIndex + 1) % 4 === 0) {
              pixelIndex++;
              continue;
            }
            binaryLength += this.extractLSBs(data[pixelIndex]);
            pixelIndex++;
          }

          const messageLength = parseInt(binaryLength, 2);
          if (isNaN(messageLength) || messageLength <= 0 || messageLength > 1000000) {
            reject(new Error('No valid message found in image'));
            return;
          }

          // Extract message
          let binaryMessage = '';
          const totalBits = messageLength * 8;

          while (binaryMessage.length < totalBits && pixelIndex < data.length) {
            if ((pixelIndex + 1) % 4 === 0) {
              pixelIndex++;
              continue;
            }
            binaryMessage += this.extractLSBs(data[pixelIndex]);
            pixelIndex++;
          }

          const message = this.binaryToString(binaryMessage.substr(0, totalBits));
          const decryptedMessage = password ? this.decryptMessage(message, password) : message;

          resolve(decryptedMessage);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Analyze an image's steganography capacity
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const pixelCount = img.width * img.height;
        const channels = 3; // RGB (excluding alpha)
        const maxBytes = Math.floor((pixelCount * channels * this.bitsPerChannel) / 8) - 4;
        const maxChars = maxBytes;

        resolve({
          width: img.width,
          height: img.height,
          pixelCount,
          maxBytes,
          maxChars,
          bitsPerChannel: this.bitsPerChannel
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Helper methods

  stringToBinary(str) {
    let binary = '';
    for (let i = 0; i < str.length; i++) {
      const bin = str.charCodeAt(i).toString(2).padStart(8, '0');
      binary += bin;
    }
    return binary;
  }

  binaryToString(binary) {
    let str = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      if (byte.length === 8) {
        str += String.fromCharCode(parseInt(byte, 2));
      }
    }
    return str;
  }

  prependLength(message) {
    const length = message.length;
    const lengthBinary = length.toString(2).padStart(32, '0');
    let lengthStr = '';
    for (let i = 0; i < lengthBinary.length; i += 8) {
      lengthStr += String.fromCharCode(parseInt(lengthBinary.substr(i, 8), 2));
    }
    return lengthStr + message;
  }

  modifyLSBs(byte, bits) {
    const mask = (1 << this.bitsPerChannel) - 1;
    const cleared = byte & ~mask;
    const newBits = parseInt(bits.padEnd(this.bitsPerChannel, '0'), 2);
    return cleared | newBits;
  }

  extractLSBs(byte) {
    const mask = (1 << this.bitsPerChannel) - 1;
    const bits = (byte & mask).toString(2).padStart(this.bitsPerChannel, '0');
    return bits;
  }

  // Simple XOR encryption (for demo purposes)
  encryptMessage(message, password) {
    let encrypted = '';
    for (let i = 0; i < message.length; i++) {
      const msgChar = message.charCodeAt(i);
      const keyChar = password.charCodeAt(i % password.length);
      encrypted += String.fromCharCode(msgChar ^ keyChar);
    }
    return encrypted;
  }

  decryptMessage(message, password) {
    // XOR encryption is symmetric
    return this.encryptMessage(message, password);
  }

  /**
   * Set the number of bits per channel to use
   * @param {number} bits - Number of bits (1-8)
   */
  setBitsPerChannel(bits) {
    if (bits < 1 || bits > 8) {
      throw new Error('Bits per channel must be between 1 and 8');
    }
    this.bitsPerChannel = bits;
  }
}

// Export singleton instance
export default new AdvancedSteganography();
