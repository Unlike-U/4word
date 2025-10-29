/**
 * Message Manager for displaying notifications and messages
 */
class MessageManagerClass {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create message container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'message-container';
      this.container.id = 'messageContainer';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a message
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, warning, info)
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    
    const icon = this.getIcon(type);
    messageEl.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;

    this.container.appendChild(messageEl);

    // Trigger animation
    setTimeout(() => messageEl.classList.add('show'), 10);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(messageEl), duration);
    }

    return messageEl;
  }

  /**
   * Show success message
   */
  showSuccess(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error message
   */
  showError(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning message
   */
  showWarning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info message
   */
  showInfo(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Remove a message
   */
  remove(messageEl) {
    messageEl.classList.remove('show');
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 300);
  }

  /**
   * Get icon for message type
   */
  getIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Clear all messages
   */
  clearAll() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export singleton instance
export const MessageManager = new MessageManagerClass();
export default MessageManager;
