import QRCode from 'qrcode';

export class QRGenerator {
  static async generate(data, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#00ff00',
        light: '#000000'
      },
      width: 300,
      ...options
    };

    try {
      const qrDataUrl = await QRCode.toDataURL(data, defaultOptions);
      return qrDataUrl;
    } catch (error) {
      console.error('QR generation failed:', error);
      return null;
    }
  }

  static async generateToCanvas(canvas, data, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#00ff00',
        light: '#000000'
      },
      width: 300,
      ...options
    };

    try {
      await QRCode.toCanvas(canvas, data, defaultOptions);
    } catch (error) {
      console.error('QR canvas generation failed:', error);
    }
  }
}
