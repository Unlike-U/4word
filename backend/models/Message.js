// In-memory storage (for 100GB VNC server)
// For production, use MongoDB, PostgreSQL, or Redis

class MessageStore {
  constructor() {
    this.messages = new Map();
    this.messageCounter = 0;
  }

  create(messageData) {
    const id = `msg_${Date.now()}_${++this.messageCounter}`;
    const message = {
      id,
      ...messageData,
      createdAt: new Date().toISOString()
    };

    this.messages.set(id, message);
    console.log(`Message ${id} created. Total: ${this.messages.size}`);
    
    return message;
  }

  getById(id) {
    return this.messages.get(id) || null;
  }

  getAll() {
    return Array.from(this.messages.values());
  }

  getMessagesForUser(username) {
    const now = Date.now();
    const messages = [];

    for (const message of this.messages.values()) {
      // Skip expired messages
      if (new Date(message.expiresAt).getTime() < now) {
        continue;
      }

      // Skip read self-destruct messages
      if (message.messageType === 'self-destruct' && message.read) {
        continue;
      }

      // Include if:
      // 1. Public message (no receiver)
      // 2. Sent to this user
      // 3. Sent by this user
      if (
        !message.receiver ||
        message.receiver === '' ||
        message.receiver === username ||
        message.sender === username
      ) {
        messages.push(message);
      }
    }

    return messages;
  }

  markAsRead(id) {
    const message = this.messages.get(id);
    if (message) {
      message.read = true;
      message.readAt = new Date().toISOString();
      this.messages.set(id, message);
    }
  }

  deleteById(id) {
    const deleted = this.messages.delete(id);
    if (deleted) {
      console.log(`Message ${id} deleted. Remaining: ${this.messages.size}`);
    }
    return deleted;
  }

  deleteExpired() {
    const now = Date.now();
    let count = 0;

    for (const [id, message] of this.messages.entries()) {
      if (new Date(message.expiresAt).getTime() < now) {
        this.messages.delete(id);
        count++;
      }
    }

    if (count > 0) {
      console.log(`Cleanup: ${count} expired messages deleted. Remaining: ${this.messages.size}`);
    }

    return count;
  }

  getStats() {
    const now = Date.now();
    const stats = {
      total: this.messages.size,
      temporary: 0,
      selfDestruct: 0,
      expired: 0,
      read: 0
    };

    for (const message of this.messages.values()) {
      if (message.messageType === 'temporary') stats.temporary++;
      if (message.messageType === 'self-destruct') stats.selfDestruct++;
      if (new Date(message.expiresAt).getTime() < now) stats.expired++;
      if (message.read) stats.read++;
    }

    return stats;
  }
}

module.exports = new MessageStore();
