import BackendService from '../services/BackendService.js';
import Web3Service from '../services/Web3Service.js';

/**
 * State Manager - Handles application state and user data
 */
class StateManagerClass {
  constructor() {
    this.currentUser = null;
    this.users = [];
    this.isInitialized = false;
  }

  /**
   * Initialize state manager
   */
  async initialize(currentUser) {
    if (this.isInitialized) return;

    this.currentUser = currentUser;
    
    // Load users from server
    await this.loadUsers();
    
    this.isInitialized = true;
  }

  /**
   * Load users from backend server
   */
  async loadUsers() {
    try {
      // Try to fetch from backend
      const response = await BackendService.getOnlineUsers();
      
      if (response && response.users) {
        this.users = response.users;
        
        // Cache in localStorage for offline access
        this.cacheOnlineUsers(response.users);
      } else {
        // Fallback to cached users
        this.users = this.getCachedUsers();
      }
    } catch (error) {
      console.warn('Failed to load users from server, using cached data:', error);
      this.users = this.getCachedUsers();
    }
  }

  /**
   * Get cached users from localStorage
   */
  getCachedUsers() {
    try {
      const cached = localStorage.getItem('4word_online_users');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error reading cached users:', error);
    }
    return [];
  }

  /**
   * Cache online users for offline access
   */
  cacheOnlineUsers(users) {
    try {
      // Only cache public data (no private keys or password hashes)
      const publicUsers = users.map(user => ({
        username: user.username,
        displayName: user.displayName,
        publicKey: user.publicKey,
        avatar: user.avatar,
        online: user.online || false,
      }));
      
      localStorage.setItem('4word_online_users', JSON.stringify(publicUsers));
    } catch (error) {
      console.error('Error caching users:', error);
    }
  }

  /**
   * Get all users
   */
  getUsers() {
    return this.users;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username) {
    return this.users.find(u => u.username === username);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Update current user
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Add or update user in state
   */
  updateUser(user) {
    const index = this.users.findIndex(u => u.username === user.username);
    
    if (index >= 0) {
      this.users[index] = { ...this.users[index], ...user };
    } else {
      this.users.push(user);
    }
    
    // Update cache
    this.cacheOnlineUsers(this.users);
  }

  /**
   * Remove user from state
   */
  removeUser(username) {
    this.users = this.users.filter(u => u.username !== username);
    this.cacheOnlineUsers(this.users);
  }

  /**
   * Clear all state
   */
  clear() {
    this.currentUser = null;
    this.users = [];
    this.isInitialized = false;
    
    // Clear cached data
    localStorage.removeItem('4word_online_users');
  }

  /**
   * Get blockchain state
   */
  getBlockchainState() {
    return {
      connected: Web3Service.isConnected,
      account: Web3Service.currentAccount,
      network: Web3Service.network,
    };
  }
}

// Export singleton instance
const StateManager = new StateManagerClass();

export { StateManager };
export default StateManager;
