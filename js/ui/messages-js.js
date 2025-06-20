/**
 * Message Display System
 * Handles error messages, success notifications, and user feedback
 */
class Messages {
  
  static messageQueue = [];
  static currentToast = null;
  
  /**
   * Show an error message
   * @param {string} message - Error message to display
   * @param {number} duration - How long to show the message (ms)
   */
  static showError(message, duration = 5000) {
    this.showMessage(message, 'error', duration);
  }

  /**
   * Show a success message
   * @param {string} message - Success message to display
   * @param {number} duration - How long to show the message (ms)
   */
  static showSuccess(message, duration = 3000) {
    this.showMessage(message, 'success', duration);
  }

  /**
   * Show a warning message
   * @param {string} message - Warning message to display
   * @param {number} duration - How long to show the message (ms)
   */
  static showWarning(message, duration = 4000) {
    this.showMessage(message, 'warning', duration);
  }

  /**
   * Show an info message
   * @param {string} message - Info message to display
   * @param {number} duration - How long to show the message (ms)
   */
  static showInfo(message, duration = 3000) {
    this.showMessage(message, 'info', duration);
  }

  /**
   * Show a message in the designated container
   * @param {string} message - Message text
   * @param {string} type - Message type (error, success, warning, info)
   * @param {number} duration - How long to show the message (ms)
   */
  static showMessage(message, type = 'info', duration = 3000) {
    // Try to find the error container first
    let container = document.getElementById("errorContainer");
    
    // If no error container, try to find or create a message container
    if (!container) {
      container = document.getElementById("messageContainer");
      if (!container) {
        container = this.createMessageContainer();
      }
    }

    if (!container) {
      // Fallback to toast notification
      this.showToast(message, type, duration);
      return;
    }

    // Clear previous messages
    container.innerHTML = '';

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    // Add close button for persistent messages
    if (type === 'error' || duration === 0) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.className = 'message-close';
      closeBtn.onclick = () => messageDiv.remove();
      messageDiv.appendChild(closeBtn);
    }
    
    container.appendChild(messageDiv);
    
    // Auto-remove message after duration (unless duration is 0)
    if (duration > 0) {
      setTimeout(() => {
        if (messageDiv.parentElement) {
          messageDiv.remove();
        }
      }, duration);
    }

    // Scroll message into view if needed
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Show a toast notification (floating message)
   * @param {string} message - Message text
   * @param {string} type - Message type
   * @param {number} duration - How long to show the toast (ms)
   */
  static showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    if (this.currentToast) {
      this.currentToast.remove();
    }

    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${this.getToastColor(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      pointer-events: auto;
      max-width: 350px;
      word-wrap: break-word;
      font-size: 14px;
      position: relative;
    `;

    // Add icon
    const icon = this.getMessageIcon(type);
    toast.innerHTML = `
      <span style="margin-right: 8px;">${icon}</span>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        float: right;
        cursor: pointer;
        font-size: 16px;
        margin-left: 10px;
        opacity: 0.7;
      ">×</button>
    `;

    toastContainer.appendChild(toast);
    this.currentToast = toast;

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  }

  /**
   * Get toast background color for message type
   * @param {string} type - Message type
   * @returns {string} CSS color value
   */
  static getToastColor(type) {
    const colors = {
      error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
      success: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
      warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      info: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    };
    return colors[type] || colors.info;
  }

  /**
   * Get icon for message type
   * @param {string} type - Message type
   * @returns {string} Icon character
   */
  static getMessageIcon(type) {
    const icons = {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Create a message container if none exists
   * @returns {HTMLElement} Created message container
   */
  static createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    container.style.cssText = `
      margin: 20px 0;
      position: relative;
      z-index: 1000;
    `;

    // Try to insert after page header or at the beginning of main content
    const pageHeader = document.querySelector('.page-header');
    const mainContent = document.querySelector('.main-content');
    const inputContainer = document.querySelector('.input-container');

    if (pageHeader) {
      pageHeader.parentNode.insertBefore(container, pageHeader.nextSibling);
    } else if (inputContainer) {
      inputContainer.parentNode.insertBefore(container, inputContainer);
    } else if (mainContent) {
      mainContent.insertBefore(container, mainContent.firstChild);
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Clear all messages
   */
  static clearMessages() {
    const containers = [
      document.getElementById("errorContainer"),
      document.getElementById("messageContainer")
    ];

    containers.forEach(container => {
      if (container) {
        container.innerHTML = '';
      }
    });

    // Clear toasts
    if (this.currentToast) {
      this.currentToast.remove();
      this.currentToast = null;
    }
  }

  /**
   * Show loading message
   * @param {string} message - Loading message
   * @returns {Function} Function to hide the loading message
   */
  static showLoading(message = 'Loading...') {
    const loadingId = 'loading-' + Math.random().toString(36).substr(2, 9);
    
    this.showMessage(`
      <span id="${loadingId}" style="display: flex; align-items: center; gap: 10px;">
        <div style="
          width: 16px; 
          height: 16px; 
          border: 2px solid #ccc; 
          border-top: 2px solid #333; 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
        "></div>
        ${message}
      </span>
    `, 'info', 0);

    // Add CSS animation if not already present
    if (!document.getElementById('loading-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'loading-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Return function to hide loading
    return () => {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.closest('.info').remove();
      }
    };
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback for confirmation
   * @param {Function} onCancel - Callback for cancellation
   */
  static showConfirmation(message, onConfirm, onCancel) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    dialog.innerHTML = `
      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirm-yes" style="
          padding: 10px 20px;
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Yes</button>
        <button id="confirm-no" style="
          padding: 10px 20px;
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">No</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Handle button clicks
    dialog.querySelector('#confirm-yes').onclick = () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    };

    dialog.querySelector('#confirm-no').onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Handle click outside dialog
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    };
  }

  /**
   * Show progress bar
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   * @returns {Function} Function to update progress
   */
  static showProgress(progress = 0, message = 'Processing...') {
    const progressId = 'progress-' + Math.random().toString(36).substr(2, 9);
    
    const container = document.getElementById("messageContainer") || this.createMessageContainer();
    container.innerHTML = '';

    const progressDiv = document.createElement('div');
    progressDiv.id = progressId;
    progressDiv.className = 'progress-container';
    progressDiv.innerHTML = `
      <div style="margin-bottom: 10px; color: #333;">${message}</div>
      <div style="
        width: 100%;
        height: 20px;
        background: #f0f0f0;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #ddd;
      ">
        <div class="progress-bar" style="
          height: 100%;
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          width: ${progress}%;
          transition: width 0.3s ease;
        "></div>
      </div>
      <div style="margin-top: 5px; font-size: 12px; color: #666;">${progress}%</div>
    `;

    container.appendChild(progressDiv);

    // Return update function
    return {
      update: (newProgress, newMessage) => {
        const element = document.getElementById(progressId);
        if (element) {
          const progressBar = element.querySelector('.progress-bar');
          const messageEl = element.querySelector('div:first-child');
          const percentEl = element.querySelector('div:last-child');
          
          if (progressBar) progressBar.style.width = `${newProgress}%`;
          if (messageEl && newMessage) messageEl.textContent = newMessage;
          if (percentEl) percentEl.textContent = `${newProgress}%`;
        }
      },
      complete: () => {
        const element = document.getElementById(progressId);
        if (element) {
          setTimeout(() => element.remove(), 1000);
        }
      }
    };
  }

  /**
   * Queue multiple messages to show in sequence
   * @param {Array} messages - Array of message objects {text, type, duration}
   */
  static queueMessages(messages) {
    this.messageQueue = [...messages];
    this.processMessageQueue();
  }

  /**
   * Process queued messages
   */
  static processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    const message = this.messageQueue.shift();
    this.showMessage(message.text, message.type, message.duration);

    // Process next message after this one's duration
    setTimeout(() => {
      this.processMessageQueue();
    }, message.duration + 500);
  }
}