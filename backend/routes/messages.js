const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Store temporary or self-destruct message
router.post('/', async (req, res) => {
  try {
    const {
      text,
      sender,
      senderName,
      receiver,
      messageType,
      rsaEncrypted,
      manuallyEncrypted,
      file
    } = req.body;

    // Validate
    if (!text || !sender || !messageType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['temporary', 'self-destruct'].includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type for backend storage' });
    }

    // Calculate expiry
    const now = Date.now();
    let expiresAt;
    
    if (messageType === 'temporary') {
      expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
    } else if (messageType === 'self-destruct') {
      expiresAt = now + (48 * 60 * 60 * 1000); // 48 hours max
    }

    // Create message
    const message = Message.create({
      text,
      sender,
      senderName,
      receiver,
      messageType,
      rsaEncrypted,
      manuallyEncrypted,
      file,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      read: false
    });

    res.status(201).json({
      id: message.id,
      timestamp: message.timestamp,
      expiresAt: message.expiresAt
    });

  } catch (error) {
    console.error('Error storing message:', error);
    res.status(500).json({ error: 'Failed to store message' });
  }
});

// Get messages for a user
router.get('/', async (req, res) => {
  try {
    const { username, receiver } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const messages = Message.getMessagesForUser(username);

    res.json({ messages, count: messages.length });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read (for self-destruct)
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const message = Message.getById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only recipient can mark as read
    if (message.receiver && message.receiver !== username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    Message.markAsRead(id);

    // If self-destruct, schedule immediate deletion
    if (message.messageType === 'self-destruct') {
      setTimeout(() => {
        Message.deleteById(id);
        console.log(`Self-destruct message ${id} deleted after read`);
      }, 7000); // 7 seconds (5s view + 2s animation)
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete expired messages (admin endpoint)
router.delete('/cleanup', async (req, res) => {
  try {
    const count = Message.deleteExpired();
    res.json({ deleted: count });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

module.exports = router;
