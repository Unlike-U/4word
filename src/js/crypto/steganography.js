/**
 * 4Word Advanced Steganography Module
 */

import crypto from './webCrypto.js';

class AdvancedSteganography {
  constructor() {
    this.SIGNATURE = 'FW';
    this.VERSION = 1;
  }

  chaosSequence(seed, length) {
    const sequence = [];
    let x = this.seedToFloat(seed);
    const r = 3.99;
    for (let i = 0; i < length; i++) {
      x = r * x * (1 - x);
      sequence.push(x);
    }
    return sequence;
  }

  seedToFloat(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }

  async embedMessage(imageFile, message, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const encrypted = await crypto.encrypt(message, password);
        const payload = JSON.stringify(encrypted);
        const header = `${this.SIGNATURE}${this.VERSION}${payload.length.toString().padStart(8, '0')}`;
        const fullData = header + payload;
        
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            const chaosSeq = this.chaosSequence(password, pixels.length / 4);
            const pixelIndices = chaosSeq
              .map((val, idx) => ({ val, idx }))
              .sort((a, b) => a.val - b.val)
              .map(item => item.idx);

            const capacity = Math.floor(pixels.length / 4) * 3;
            if (fullData.length * 8 > capacity) {
              reject(new Error('Image too small for message'));
              return;
            }

            let bitIndex = 0;
            for (const char of fullData) {
              const charCode = char.charCodeAt(0);
              for (let bit = 7; bit >= 0; bit--) {
                const pixelIndex = pixelIndices[Math.floor(bitIndex / 3)];
                const colorChannel = (bitIndex % 3);
                const pixelByte = pixelIndex * 4 + colorChannel;
                pixels[pixelByte] = (pixels[pixelByte] & 0xFE) | ((charCode >> bit) & 1);
                bitIndex++;
              }
            }

            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
              resolve({
                blob,
                filename: `4word_stego_${Date.now()}.png`,
                originalSize: imageFile.size,
                newSize: blob.size,
                messageLength: message.length
              });
            }, 'image/png');
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(error);
      }
    });
  }

  async extractMessage(imageFile, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            const chaosSeq = this.chaosSequence(password, pixels.length / 4);
            const pixelIndices = chaosSeq
              .map((val, idx) => ({ val, idx }))
              .sort((a, b) => a.val - b.val)
              .map(item => item.idx);

            let bitIndex = 0;
            const readChars = (count) => {
              let result = '';
              for (let i = 0; i < count; i++) {
                let charCode = 0;
                for (let bit = 7; bit >= 0; bit--) {
                  const pixelIndex = pixelIndices[Math.floor(bitIndex / 3)];
                  const colorChannel = bitIndex % 3;
                  const pixelByte = pixelIndex * 4 + colorChannel;
                  charCode |= (pixels[pixelByte] & 1) << bit;
                  bitIndex++;
                }
                result += String.fromCharCode(charCode);
              }
              return result;
            };

            const header = readChars(11);
            if (!header.startsWith(this.SIGNATURE)) {
              reject(new Error('No hidden message found or wrong password'));
              return;
            }

            const messageLength = parseInt(header.substring(3, 11));
            if (isNaN(messageLength) || messageLength <= 0) {
              reject(new Error('Corrupted stego data'));
              return;
            }

            const encryptedPayload = readChars(messageLength);
            const encryptedObj = JSON.parse(encryptedPayload);
            const decrypted = await crypto.decrypt(encryptedObj, password);
            
            resolve({
              message: decrypted,
              extractedAt: Date.now(),
              algorithm: encryptedObj.algorithm
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(new Error(`Extraction failed: ${error.message}`));
      }
    });
  }

  async getImageCapacity(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const pixels = img.width * img.height;
          const bytesCapacity = Math.floor(pixels * 3 / 8);
          const charsCapacity = bytesCapacity - 11;
          resolve({
            width: img.width,
            height: img.height,
            totalPixels: pixels,
            maxMessageBytes: bytesCapacity,
            maxMessageChars: charsCapacity,
            recommendedMaxChars: Math.floor(charsCapacity * 0.8)
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }
}

// Export singleton
const stegoInstance = new AdvancedSteganography();
export default stegoInstance;
