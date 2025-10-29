/**
 * 4Word CLI - Enhanced Command Line Interface
 */

import crypto from '../crypto/webCrypto.js';
import stego from '../crypto/steganography.js';
import storage from '../storage/indexedDB.js';

export class CLI {
  constructor() {
    this.commands = {
      help: this.showHelp.bind(this),
      encrypt: this.encrypt.bind(this),
      decrypt: this.decrypt.bind(this),
      hash: this.hash.bind(this),
      genpass: this.generatePassword.bind(this),
      search: this.searchMessages.bind(this),
      stats: this.showStats.bind(this),
      clear: this.clearMessages.bind(this),
      export: this.exportMessages.bind(this),
      version: this.showVersion.bind(this)
    };
  }

  async execute(input) {
    const [command, ...args] = input.trim().split(' ');
    
    if (!command) return '';
    
    const cmd = this.commands[command.toLowerCase()];
    if (!cmd) {
      return `❌ Unknown command: ${command}\nType 'help' for available commands.`;
    }

    try {
      return await cmd(args);
    } catch (error) {
      return `❌ Error: ${error.message}`;
    }
  }

  showHelp() {
    return `
🔐 4Word CLI Commands:

  encrypt <message> <password>    Encrypt a message
  decrypt <encrypted> <password>  Decrypt a message
  hash <data>                     Generate SHA-256 hash
  genpass [length]                Generate secure password
  search <query>                  Search messages
  stats                           Show storage statistics
  clear                           Clear all messages
  export                          Export messages (encrypted)
  version                         Show version info
  help                            Show this help

Examples:
  > encrypt "Hello World" mypass123
  > search "credit card"
  > genpass 32
    `;
  }

  async encrypt(args) {
    if (args.length < 2) {
      return '❌ Usage: encrypt <message> <password>';
    }

    const message = args.slice(0, -1).join(' ');
    const password = args[args.length - 1];

    const result = await crypto.encrypt(message, password);
    
    return `
✅ Encrypted successfully!

Algorithm: ${result.algorithm}
Encrypted: ${result.encrypted.substring(0, 50)}...
Length: ${result.encrypted.length} chars

Copy the encrypted text to decrypt later.
    `;
  }

  async decrypt(args) {
    if (args.length < 2) {
      return '❌ Usage: decrypt <encrypted> <password>';
    }

    const encrypted = args.slice(0, -1).join(' ');
    const password = args[args.length - 1];

    const decrypted = await crypto.decrypt(encrypted, password);
    
    return `
✅ Decrypted successfully!

Message: ${decrypted}
    `;
  }

  async hash(args) {
    if (args.length === 0) {
      return '❌ Usage: hash <data>';
    }

    const data = args.join(' ');
    const hashed = await crypto.hash(data);
    
    return `
✅ SHA-256 Hash:

${hashed}
    `;
  }

  generatePassword(args) {
    const length = parseInt(args[0]) || 32;
    
    if (length < 8 || length > 128) {
      return '❌ Password length must be between 8 and 128';
    }

    const password = crypto.generateSecurePassword(length);
    
    return `
✅ Generated secure password:

${password}

Length: ${length} characters
⚠️  Save this securely - it won't be shown again!
    `;
  }

  async searchMessages(args) {
    if (args.length === 0) {
      return '❌ Usage: search <query>';
    }

    const query = args.join(' ');
    const masterPassword = sessionStorage.getItem('masterPassword');
    
    if (!masterPassword) {
      return '❌ Please unlock your vault first';
    }

    const results = await storage.searchMessages(query, masterPassword);
    
    if (results.length === 0) {
      return `❌ No messages found for: "${query}"`;
    }

    let output = `✅ Found ${results.length} message(s):\n\n`;
    
    results.forEach((msg, idx) => {
      output += `${idx + 1}. [${msg.type}] ${msg.content?.substring(0, 50)}...\n`;
      output += `   Date: ${new Date(msg.storedAt).toLocaleString()}\n\n`;
    });

    return output;
  }

  async showStats() {
    const stats = await storage.getStats();
    
    return `
📊 Storage Statistics:

Messages: ${stats.messageCount}
Database: ${stats.dbName} (v${stats.version})
Browser: ${navigator.userAgent.split(' ').slice(-1)[0]}
    `;
  }

  async clearMessages() {
    const confirm = window.confirm(
      'Are you sure you want to delete ALL messages? This cannot be undone!'
    );
    
    if (!confirm) {
      return '❌ Cancelled';
    }

    await storage.clearAllMessages();
    return '✅ All messages deleted';
  }

  async exportMessages() {
    const masterPassword = sessionStorage.getItem('masterPassword');
    
    if (!masterPassword) {
      return '❌ Please unlock your vault first';
    }

    const messages = await storage.getMessages(masterPassword, 10000);
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4word_export_${Date.now()}.json`;
    a.click();
    
    return `✅ Exported ${messages.length} messages`;
  }

  showVersion() {
    return `
4️⃣  4Word v1.0.0
Web3-Powered Secure Messaging

Core:
  - Web Crypto API (AES-256-GCM)
  - Advanced Steganography (LSB+Diffusion)
  - IndexedDB Storage
  - Double Encryption (2DE)

License: MIT
GitHub: github.com/Unlike-U/4word
    `;
  }
}

export const cli = new CLI();
