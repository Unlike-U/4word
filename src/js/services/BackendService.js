import axios from 'axios';
import { BACKEND_CONFIG, BACKEND_ENDPOINTS } from '../config/backend.js';
import MessageManager from '../managers/MessageManager.js';

class BackendServiceClass {
  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_CONFIG.baseURL,
      timeout: BACKEND_CONFIG.timeout,
      headers: BACKEND_CONFIG.headers
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Backend API error:', error);
        
        if (error.code === 'ECONNABORTED') {
          MessageManager.showError('Request timeout - backend server not responding');
        } else if (error.response) {
          MessageManager.showError(`Backend error: ${error.response.data.error || error.message}`);
        } else if (error.request) {
          MessageManager.showError('Cannot reach backend server');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await this.client.get(BACKEND_ENDPOINTS.health);
      console.log('Backend health:', response.data);
      return response.data;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return null;
    }
  }

  /**
   * Store temporary or self-destruct message
   */
  async storeMessage(messageData) {
    try {
      const response = await this.client.post(BACKEND_ENDPOINTS.messages, messageData);
      console.log('Message stored on backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to store message on backend:', error);
      throw error;
    }
  }

  /**
   * Get messages for a user
   */
  async getMessages(username) {
    try {
      const response = await this.client.get(BACKEND_ENDPOINTS.messages, {
        params: { username }
      });
      
      console.log(`Loaded ${response.data.count} messages from backend`);
      return response.data.messages;
    } catch (error) {
      console.error('Failed to fetch messages from backend:', error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, username) {
    try {
      const response = await this.client.post(
        BACKEND_ENDPOINTS.markRead(messageId),
        { username }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }

  /**
   * Test backend connection
   */
  async testConnection() {
    try {
      const health = await this.checkHealth();
      if (health) {
        MessageManager.showSuccess('Backend server connected ✓');
        return true;
      }
      return false;
    } catch {
      MessageManager.showWarning('Backend server not available - temporary messages disabled');
      return false;
    }
  }
}

export const BackendService = new BackendServiceClass();
export default BackendService;
