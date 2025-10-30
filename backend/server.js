const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration - allow requests from webpack dev server
app.use(cors({
  origin: ['http://localhost:9000', 'http://localhost:3001', 'http://10.0.0.42:9000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// In-memory storage (replace with database in production)
const users = new Map();
const onlineUsers = new Set();
const messages = new Map(); // username -> messages[]

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Register user
app.post('/api/users/register', (req, res) => {
  const { username, displayName, publicKey, avatar } = req.body;

  if (!username || !displayName || !publicKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (users.has(username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const user = {
    username,
    displayName,
    publicKey,
    avatar,
    createdAt: Date.now(),
    online: false,
  };

  users.set(username.toLowerCase(), user);

  console.log('User registered:', username);
  res.json({ success: true, user });
});

// Get online users
app.get('/api/users/online', (req, res) => {
  const onlineUsersList = Array.from(onlineUsers)
    .map(username => users.get(username.toLowerCase()))
    .filter(Boolean);

  console.log('Online users requested:', onlineUsersList.length);
  res.json({ users: onlineUsersList });
});

// Set user online status
app.post('/api/users/:username/status', (req, res) => {
  const { username } = req.params;
  const { online } = req.body;

  const user = users.get(username.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (online) {
    onlineUsers.add(username.toLowerCase());
  } else {
    onlineUsers.delete(username.toLowerCase());
  }

  user.online = online;
  users.set(username.toLowerCase(), user);

  console.log(`User ${username} is now ${online ? 'online' : 'offline'}`);
  res.json({ success: true, user });
});

// Update user
app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const updates = req.body;

  const user = users.get(username.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Only allow updating safe fields
  const allowedUpdates = ['displayName', 'avatar', 'publicKey'];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      user[key] = updates[key];
    }
  });

  users.set(username.toLowerCase(), user);

  console.log('User updated:', username);
  res.json({ success: true, user });
});

// Get messages for a user
app.get('/api/messages/:username', (req, res) => {
  const { username } = req.params;
  
  const userMessages = messages.get(username.toLowerCase()) || [];
  
  console.log(`Messages requested for ${username}:`, userMessages.length);
  res.json({ messages: userMessages });
});

// Send temporary message
app.post('/api/messages/temporary', (req, res) => {
  const messageData = req.body;
  
  if (!messageData.sender || !messageData.receiver) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Store message for receiver
  const receiverMessages = messages.get(messageData.receiver.toLowerCase()) || [];
  receiverMessages.push({
    ...messageData,
    id: messageData.id || 'msg_' + Date.now(),
    serverTimestamp: Date.now(),
    type: 'temporary'
  });
  messages.set(messageData.receiver.toLowerCase(), receiverMessages);

  // Also store for sender
  const senderMessages = messages.get(messageData.sender.toLowerCase()) || [];
  senderMessages.push({
    ...messageData,
    serverTimestamp: Date.now()
  });
  messages.set(messageData.sender.toLowerCase(), senderMessages);

  console.log('Temporary message stored:', messageData.id);
  res.json({ success: true, messageId: messageData.id });
});

// Get temporary messages
app.get('/api/messages/temporary/:username', (req, res) => {
  const { username } = req.params;
  
  const userMessages = (messages.get(username.toLowerCase()) || [])
    .filter(msg => msg.type === 'temporary');
  
  console.log(`Temporary messages for ${username}:`, userMessages.length);
  res.json({ messages: userMessages });
});

// Send self-destruct message
app.post('/api/messages/self-destruct', (req, res) => {
  const messageData = req.body;
  
  if (!messageData.sender || !messageData.receiver) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Store message for receiver only (self-destruct on read)
  const receiverMessages = messages.get(messageData.receiver.toLowerCase()) || [];
  receiverMessages.push({
    ...messageData,
    id: messageData.id || 'msg_' + Date.now(),
    serverTimestamp: Date.now(),
    type: 'self-destruct',
    read: false
  });
  messages.set(messageData.receiver.toLowerCase(), receiverMessages);

  console.log('Self-destruct message stored:', messageData.id);
  res.json({ success: true, messageId: messageData.id });
});

// Mark message as read (triggers self-destruct)
app.post('/api/messages/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  
  // Find and delete the message
  let deleted = false;
  
  for (const [username, userMessages] of messages.entries()) {
    const msgIndex = userMessages.findIndex(m => m.id === messageId);
    if (msgIndex >= 0) {
      const msg = userMessages[msgIndex];
      if (msg.type === 'self-destruct') {
        userMessages.splice(msgIndex, 1);
        messages.set(username, userMessages);
        deleted = true;
        console.log('Self-destruct message deleted:', messageId);
        break;
      }
    }
  }
  
  if (deleted) {
    res.json({ success: true, deleted: true });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ 4Word Backend Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: http://localhost:9000, http://localhost:3001`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
