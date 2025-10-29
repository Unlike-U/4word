const Message = require('../models/Message');

function cleanupExpiredMessages() {
  console.log('Running cleanup job...');
  const deleted = Message.deleteExpired();
  
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} expired messages`);
  }

  const stats = Message.getStats();
  console.log('Message stats:', stats);
}

function startCleanupJob() {
  console.log('Starting cleanup job (runs every 10 minutes)');
  
  // Run immediately
  cleanupExpiredMessages();
  
  // Then run every 10 minutes
  setInterval(cleanupExpiredMessages, 10 * 60 * 1000);
}

module.exports = { startCleanupJob, cleanupExpiredMessages };
