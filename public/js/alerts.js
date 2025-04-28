/**
 * Global alert utilities for the application
 */

// Container for dynamic alerts
let alertContainer;

// Initialize the alert container
function initAlertContainer() {
  // Check if container already exists
  if (document.getElementById('global-alert-container')) {
    return document.getElementById('global-alert-container');
  }
  
  // Create a container for alerts if it doesn't exist
  alertContainer = document.createElement('div');
  alertContainer.id = 'global-alert-container';
  alertContainer.style.position = 'fixed';
  alertContainer.style.top = '20px';
  alertContainer.style.left = '50%';
  alertContainer.style.transform = 'translateX(-50%)';
  alertContainer.style.zIndex = '9999';
  alertContainer.style.width = '80%';
  alertContainer.style.maxWidth = '500px';
  
  // Add background color based on current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  alertContainer.style.backgroundColor = currentTheme === 'dark' ? 'var(--background-color, #121212)' : 'var(--background-color, #ffffff)';
  
  document.body.appendChild(alertContainer);
  
  return alertContainer;
}

// Global function to show a floating alert
window.showFloatingAlert = function(message, type = 'error', duration = 5000) {
  // Initialize container if needed
  const container = initAlertContainer();
  
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.style.marginBottom = '10px';
  alertElement.style.boxShadow = 'var(--shadow-md)';
  alertElement.style.opacity = '0';
  alertElement.style.transition = 'opacity 0.3s ease-in-out';
  
  // Add message
  alertElement.textContent = message;
  
  // Add to container
  container.appendChild(alertElement);
  
  // Fade in
  setTimeout(() => {
    alertElement.style.opacity = '1';
  }, 10);
  
  // Auto-dismiss after duration
  setTimeout(() => {
    alertElement.style.opacity = '0';
    setTimeout(() => {
      container.removeChild(alertElement);
    }, 300);
  }, duration);
  
  return alertElement;
};

// Function to handle API errors
window.handleApiError = function(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  let errorMessage = defaultMessage;
  
  // Extract error message from different error formats
  if (error && error.message) {
    errorMessage = error.message;
  } else if (error && error.error) {
    errorMessage = error.error;
  } else if (error && error.data && error.data.error) {
    errorMessage = error.data.error;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Show the error alert
  showFloatingAlert(errorMessage, 'error');
};

// Function to show success message
window.showSuccess = function(message) {
  showFloatingAlert(message, 'success');
};

// Global alert function for login page (preserved for backward compatibility)
window.showLoginAlert = function(message, type = 'error') {
  // Try to find the alert element
  const alertElement = document.getElementById('login-alert');
  
  if (alertElement) {
    // If the alert element exists, update its content and display it
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    // Auto-dismiss success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        alertElement.classList.add('hidden');
      }, 5000);
    }
  } else {
    // Fallback to floating alert
    showFloatingAlert(message, type);
  }
};

// Function to show any type of alert by ID (preserved for backward compatibility)
window.showAlert = function(elementId, message, type = 'error') {
  const alertElement = document.getElementById(elementId);
  
  if (alertElement) {
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    if (type === 'success') {
      setTimeout(() => {
        alertElement.classList.add('hidden');
      }, 5000);
    }
  } else {
    // Fallback to floating alert
    showFloatingAlert(message, type);
  }
};
