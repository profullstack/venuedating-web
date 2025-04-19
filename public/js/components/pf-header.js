/**
 * Header component for the application
 */
class PfHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .logo img {
          height: 40px;
          width: auto;
        }
        
        .logo h1 {
          margin: 0;
          color: #2563eb;
          font-weight: bold;
        }
        
        .nav-links {
          display: flex;
          gap: 15px;
        }
        
        .nav-link {
          padding: 8px 15px;
          color: #333;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.2s;
        }
        
        .nav-link:hover {
          background-color: #f0f0f0;
        }
        
        .subscription-link {
          display: inline-block;
          padding: 8px 15px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .subscription-link:hover {
          background-color: #1d4ed8;
        }

        /* User dropdown styles */
        .user-dropdown {
          position: relative;
        }
        
        .dropdown-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          background: none;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          color: #333;
          transition: background-color 0.2s;
        }
        
        .dropdown-button:hover {
          background-color: #f0f0f0;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 200px;
          background-color: white;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          display: none;
          z-index: 100;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-item {
          display: block;
          padding: 8px 15px;
          color: #333;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
          background-color: #f0f0f0;
        }
      </style>
      
      <div class="header">
        <div class="logo">
          <img src="/icons/logo.${this.currentTheme === 'dark' ? 'dark' : 'light'}.svg" alt="Profullstack, Inc. Logo">
          <h1>Document Generation API</h1>
        </div>
        
        <div class="nav-links">
          <a href="/" class="nav-link">Home</a>
          <a href="/api-docs" class="nav-link">API Docs</a>
          <a href="/api-keys" class="nav-link">API Keys</a>
          <a href="/login" class="nav-link login-link">Login</a>
          <a href="/register" class="subscription-link register-link">Register</a>
        </div>
      </div>
    `;
  }

  initEventListeners() {
    // Update the navigation based on authentication status
    this.updateNavbar();

    // Listen for auth changes
    window.addEventListener('auth-changed', () => {
      this.updateNavbar();
    });
    
    // Listen for theme changes
    document.addEventListener('themechange', (event) => {
      this.currentTheme = event.detail.theme;
      this.updateLogo();
    });
  }
  
  updateLogo() {
    const logoImg = this.shadowRoot.querySelector('.logo img');
    if (logoImg) {
      logoImg.src = `/icons/logo.${this.currentTheme === 'dark' ? 'dark' : 'light'}.svg`;
    }
  }

  updateNavbar() {
    const apiKey = localStorage.getItem('api_key');
    const username = localStorage.getItem('username') || apiKey;
    const isLoggedIn = !!apiKey;
    
    const navLinks = this.shadowRoot.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Get the static login and register links
    const loginLink = navLinks.querySelector('.login-link');
    const registerLink = navLinks.querySelector('.register-link');
    
    // Clear existing dynamic auth-related elements
    const authElements = navLinks.querySelectorAll('.user-dropdown');
    authElements.forEach(el => el.remove());
    
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
            <a href="/settings" class="dropdown-item">Settings</a>
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
        this.logout();
      });
    } else {
      // User is not logged in
      
      // Show the static login and register links
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
    }
  }

  logout() {
    // Clear authentication data
    localStorage.removeItem('api_key');
    localStorage.removeItem('username');
    
    // Update UI
    this.updateNavbar();
    
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('auth-changed'));
    
    // Redirect to home page if on a protected page
    const currentPath = window.location.pathname;
    const protectedPages = ['/api-keys', '/settings'];
    
    if (protectedPages.includes(currentPath)) {
      if (window.router) {
        window.router.navigate('/');
      } else {
        window.location.href = '/';
      }
    }
  }
}

// Define the custom element
customElements.define('pf-header', PfHeader);