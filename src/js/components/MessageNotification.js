/**
 * Message Notification Component
 * Displays toast-style notifications
 */

export default class MessageNotification {
  constructor() {
    this.container = null;
    this.messages = [];
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'message-container';
    return this.container;
  }

  show(text, type = 'info', duration = 4000) {
    const message = this.createMessage(text, type);
    this.container.appendChild(message);

    // Trigger animation
    setTimeout(() => {
      message.classList.add('show');
    }, 10);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(message);
      }, duration);
    }

    return message;
  }

  createMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message message-${type}`;

    const icon = this.getIcon(type);

    message.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;

    // Click to dismiss
    message.addEventListener('click', () => {
      this.remove(message);
    });

    return message;
  }

  getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
    };
    return icons[type] || icons.info;
  }

  remove(message) {
    message.classList.remove('show');
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 300);
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}
