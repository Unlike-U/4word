import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

class BackendService {
  constructor() {
    this.apiUrl = API_URL;
    this.isConnected = false;
  }

  /**
   * Test connection to backend
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this.isConnected = response.status === 200;
      console.log('✅ Backend connected:', response.data);
      return this.isConnected;
    } catch (error) {
      console.warn('❌ Backend server not available:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Register new user on backend
   */
  async registerUser(userData) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/users/register`, 
        {
          username: userData.username,
          displayName: userData.displayName,
          publicKey: userData.publicKey,
          avatar: userData.avatar,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ User registered on backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering user on backend:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(username, updates) {
    try {
      const response = await axios.put(`${this.apiUrl}/api/users/${username}`, updates, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ User updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get online users
   */
  async getOnlineUsers() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/users/online`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Online users fetched:', response.data.users.length);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching online users:', error.response?.data || error.message);
      return { users: [] };
    }
  }

  /**
   * Set user online status
   */
  async setUserOnline(username, isOnline = true) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/users/${username}/status`, 
        {
          online: isOnline,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ User ${username} set to ${isOnline ? 'online' : 'offline'}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get messages for a user
   */
  async getMessages(username) {
    try {
      const response = await axios.get(`${this.apiUrl}/api/messages/${username}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Messages fetched for ${username}:`, response.data.messages.length);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching messages:', error.response?.data || error.message);
      return { messages: [] };
    }
  }

  /**
   * Send temporary message
   */
  async sendTemporaryMessage(messageData) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/messages/temporary`, messageData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Temporary message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending temporary message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get temporary messages
   */
  async getTemporaryMessages(username) {
    try {
      const response = await axios.get(`${this.apiUrl}/api/messages/temporary/${username}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Temporary messages fetched for ${username}:`, response.data.messages.length);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching temporary messages:', error.response?.data || error.message);
      return { messages: [] };
    }
  }

  /**
   * Send self-destruct message
   */
  async sendSelfDestructMessage(messageData) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/messages/self-destruct`, messageData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Self-destruct message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending self-destruct message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mark message as read (triggers self-destruct)
   */
  async markMessageAsRead(messageId) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/messages/${messageId}/read`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Message marked as read:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error marking message as read:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new BackendService();
