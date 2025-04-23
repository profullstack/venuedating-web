// Authentication UI logic

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
});

function updateNavbar() {
  const apiKey = localStorage.getItem('api_key');
  const username = localStorage.getItem('username') || apiKey;
  const isLoggedIn = !!apiKey;
  
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  
  // Get the static login and register links
  const loginLink = navLinks.querySelector('a[href="/login.html"]');
  const registerLink = navLinks.querySelector('a[href="/register.html"]');
  
  // Clear existing dynamic auth-related elements
  const authElements = navLinks.querySelectorAll('.auth-link, .user-dropdown');
  authElements.forEach(el => {
    // Only remove dynamically added elements, not the static links
    if (el !== loginLink && el !== registerLink) {
      el.remove();
    }
  });
  
  if (isLoggedIn) {
    // User is logged in
    
    // Hide the static login and register links
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    
    // Add the user dropdown
    const dropdownHtml = `
      <div class="user-dropdown">
        <button class="dropdown-button">
          <span class="username">${username}</span>
          <svg class="dropdown-icon" width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="dropdown-menu">
          <a href="/settings.html" class="dropdown-item">Settings</a>
          <a href="#" class="dropdown-item logout-button">Logout</a>
        </div>
      </div>
    `;
    
    navLinks.insertAdjacentHTML('beforeend', dropdownHtml);
    
    // Add event listener for dropdown toggle
    const dropdownButton = navLinks.querySelector('.dropdown-button');
    const dropdownMenu = navLinks.querySelector('.dropdown-menu');
    
    dropdownButton.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
    
    // Add event listener for logout
    const logoutButton = navLinks.querySelector('.logout-button');
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    // User is not logged in
    
    // Show the static login and register links
    if (loginLink) loginLink.style.display = '';
    if (registerLink) registerLink.style.display = '';
  }
}

function logout() {
  // Clear authentication data
  localStorage.removeItem('username');
  localStorage.removeItem('jwt_token');
  
  // Update UI
  updateNavbar();
  
  // Redirect to home page if on a protected page
  const currentPath = window.location.pathname;
  const protectedPages = ['/api-keys.html', '/settings.html'];
  
  if (protectedPages.includes(currentPath)) {
    window.location.href = '/';
  }
}

// Export functions for use in other scripts
window.authUI = {
  updateNavbar,
  logout
};