/**
 * Global alert utilities for the application
 */

// Global alert function for login page
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
    // Fallback to standard browser alert if element doesn't exist
    console.log(`Alert (${type}): ${message}`);
    alert(message);
  }
};

// Function to show any type of alert by ID
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
    // Fallback to console + alert
    console.log(`Alert (${type}): ${message}`);
    alert(message);
  }
};
