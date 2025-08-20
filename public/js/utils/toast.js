/**
 * Toast Notification Utility
 * 
 * Provides simple toast notifications for user feedback
 */

// Toast container ID
const TOAST_CONTAINER_ID = 'toast-container';

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if it doesn't exist
  let container = document.getElementById(TOAST_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    // Add basic styles
    addToastStyles();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${getToastIcon(type)}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Set up close button
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    closeToast(toast);
  });
  
  // Auto close after duration
  if (duration > 0) {
    setTimeout(() => {
      closeToast(toast);
    }, duration);
  }
  
  return toast;
}

/**
 * Close a toast notification
 * @param {HTMLElement} toast - Toast element to close
 */
function closeToast(toast) {
  // Animate out
  toast.classList.remove('show');
  
  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
    
    // Remove container if empty
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (container && container.children.length === 0) {
      document.body.removeChild(container);
    }
  }, 300);
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} - SVG icon
 */
function getToastIcon(type) {
  switch (type) {
    case 'success':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    case 'error':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    case 'warning':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    case 'info':
    default:
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
  }
}

/**
 * Add toast styles to document
 */
function addToastStyles() {
  if (document.getElementById('toast-styles')) {
    return;
  }
  
  const styles = document.createElement('style');
  styles.id = 'toast-styles';
  styles.textContent = `
    .toast {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      overflow: hidden;
      width: 300px;
      max-width: 100%;
      transform: translateX(110%);
      transition: transform 0.3s ease;
    }
    
    .toast.show {
      transform: translateX(0);
    }
    
    .toast-content {
      display: flex;
      align-items: center;
      padding: 12px 15px;
    }
    
    .toast-icon {
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .toast-message {
      flex: 1;
      font-size: 14px;
    }
    
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 5px 10px;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    
    .toast-close:hover {
      opacity: 1;
    }
    
    .toast-success {
      border-left: 4px solid #4CAF50;
    }
    
    .toast-success .toast-icon {
      color: #4CAF50;
    }
    
    .toast-error {
      border-left: 4px solid #F44336;
    }
    
    .toast-error .toast-icon {
      color: #F44336;
    }
    
    .toast-warning {
      border-left: 4px solid #FFC107;
    }
    
    .toast-warning .toast-icon {
      color: #FFC107;
    }
    
    .toast-info {
      border-left: 4px solid #2196F3;
    }
    
    .toast-info .toast-icon {
      color: #2196F3;
    }
  `;
  
  document.head.appendChild(styles);
}
