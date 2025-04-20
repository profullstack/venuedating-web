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
          font-family: var(--font-primary, 'SpaceMono', monospace);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        /* Mobile menu styles */
        .hamburger-menu {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 21px;
          cursor: pointer;
          z-index: 200;
        }
        
        .hamburger-menu span {
          display: block;
          height: 3px;
          width: 100%;
          background-color: var(--text-primary);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        .hamburger-menu.active span:nth-child(1) {
          transform: translateY(9px) rotate(45deg);
        }
        
        .hamburger-menu.active span:nth-child(2) {
          opacity: 0;
        }
        
        .hamburger-menu.active span:nth-child(3) {
          transform: translateY(-9px) rotate(-45deg);
        }
        
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--background-color);
          z-index: 100;
          padding: 80px var(--spacing-md-lg) var(--spacing-md-lg);
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
          overflow-y: auto;
        }
        
        .mobile-menu.active {
          display: flex;
        }
        
        .mobile-menu a {
          font-size: 1.2rem;
          padding: 12px 0;
          width: 100%;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
        }

        /* Theme toggle styles */
        .theme-toggle {
          margin-left: 15px;
          background-color: transparent;
          border: 1px solid #ddd;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          color: var(--text-primary, #111827); /* Add explicit color for default state */
        }
        
        .theme-toggle:hover {
          background-color: var(--surface-variant, #f3f4f6); /* Use theme-appropriate background */
          color: var(--text-primary, #111827); /* Maintain text color on hover */
        }
        
        .theme-toggle svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
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
          color: #e02337;
          font-weight: bold;
        }
        
        .nav-links {
          display: flex;
          gap: 15px;
        }
        
        .nav-link {
          padding: 8px 15px;
          color: var(--text-primary);
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.2s, color 0.2s;
        }
        
        .nav-link:hover {
          background-color: var(--surface-variant);
          color: var(--primary-color);
        }
        
        .nav-link.active {
          background-color: var(--surface-variant);
          color: var(--primary-color);
          font-weight: bold;
        }
        
        .subscription-link {
          display: inline-block;
          padding: 8px 15px;
          background-color: #e02337;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .subscription-link:hover {
          background-color: #c01d2f;
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
        
        /* Media queries for responsive design */
        @media (max-width: 768px) {
          .nav-links {
            display: none; /* Hide regular nav links on mobile */
          }
          
          .hamburger-menu {
            display: flex; /* Show hamburger menu on mobile */
          }
          
          .theme-toggle {
            position: fixed;
            top: 20px;
            right: 70px;
            z-index: 200;
          }
        }
      </style>
      
      <div class="header">
        <a href="/" class="logo-link" style="text-decoration: none;">
          <div class="logo">
            <img src="/icons/logo.${this.currentTheme === 'dark' ? 'dark' : 'light'}.svg" alt="Profullstack, Inc. Logo">
            <h1>convert2doc</h1>
          </div>
        </a>
        
        <!-- Hamburger menu for mobile -->
        <div class="hamburger-menu">
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <div class="nav-links">
          <a href="/api-docs" class="nav-link" id="api-docs-link">API Docs</a>
          <a href="/api-keys" class="nav-link" id="api-keys-link">API Keys</a>
          <a href="/login" class="nav-link login-link" id="login-link">Login</a>
          <a href="/register" class="subscription-link register-link" id="register-link">Register</a>
          <button class="theme-toggle" title="Toggle light/dark theme">
            ${this.currentTheme === 'dark'
              ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
                </svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
                </svg>`
            }
          </button>
        </div>
      </div>
      
      <!-- Mobile menu container -->
      <div class="mobile-menu">
        <a href="/api-docs" class="nav-link" id="mobile-api-docs-link">API Docs</a>
        <a href="/api-keys" class="nav-link" id="mobile-api-keys-link">API Keys</a>
        <a href="/login" class="nav-link login-link" id="mobile-login-link">Login</a>
        <a href="/register" class="subscription-link register-link" id="mobile-register-link">Register</a>
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
      this.updateThemeToggle();
    });
    
    // Add event listener for theme toggle button
    const themeToggle = this.shadowRoot.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // Add event listener for hamburger menu toggle
    const hamburgerMenu = this.shadowRoot.querySelector('.hamburger-menu');
    const mobileMenu = this.shadowRoot.querySelector('.mobile-menu');
    if (hamburgerMenu && mobileMenu) {
      hamburgerMenu.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        // Prevent scrolling when mobile menu is open
        document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
      });
      
      // Close mobile menu when clicking on a link
      const mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          hamburgerMenu.classList.remove('active');
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }
    
    // Update active link based on current path
    this.updateActiveLink();
    
    // Listen for route changes
    window.addEventListener('route-changed', () => {
      this.updateActiveLink();
    });
  }
  
  updateActiveLink() {
    const currentPath = window.location.pathname;
    
    // Remove active class from all links
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to the current link
    if (currentPath.startsWith('/api-docs')) {
      this.shadowRoot.querySelector('#api-docs-link')?.classList.add('active');
    } else if (currentPath.startsWith('/api-keys')) {
      this.shadowRoot.querySelector('#api-keys-link')?.classList.add('active');
    } else if (currentPath.startsWith('/login')) {
      this.shadowRoot.querySelector('#login-link')?.classList.add('active');
    } else if (currentPath.startsWith('/register')) {
      this.shadowRoot.querySelector('#register-link')?.classList.add('active');
    }
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.currentTheme = newTheme;
    
    // Update the document theme
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save theme preference
    localStorage.setItem('profullstack-theme', newTheme);
    
    // Update UI
    this.updateLogo();
    this.updateThemeToggle();
    
    // Dispatch theme change event
    const event = new CustomEvent('themechange', { detail: { theme: newTheme } });
    document.dispatchEvent(event);
  }
  
  updateThemeToggle() {
    const themeToggle = this.shadowRoot.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.innerHTML = this.currentTheme === 'dark'
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
          </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
          </svg>`;
    }
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
    
    // Update desktop navigation
    const navLinks = this.shadowRoot.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Get the static login and register links
    const loginLink = navLinks.querySelector('.login-link');
    const registerLink = navLinks.querySelector('.register-link');
    
    // Clear existing dynamic auth-related elements
    const authElements = navLinks.querySelectorAll('.user-dropdown');
    authElements.forEach(el => el.remove());
    
    // Update mobile navigation
    const mobileMenu = this.shadowRoot.querySelector('.mobile-menu');
    const mobileLoginLink = mobileMenu?.querySelector('#mobile-login-link');
    const mobileRegisterLink = mobileMenu?.querySelector('#mobile-register-link');
    
    if (isLoggedIn) {
      // User is logged in
      
      // Hide the static login and register links in desktop nav
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
      
      // Hide the login and register links in mobile nav
      if (mobileLoginLink) mobileLoginLink.style.display = 'none';
      if (mobileRegisterLink) mobileRegisterLink.style.display = 'none';
      
      // Add the user dropdown to desktop nav
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
      
      // Add user-related links to mobile menu
      if (mobileMenu && !mobileMenu.querySelector('.mobile-settings-link')) {
        const mobileUserLinksHtml = `
          <a href="/settings" class="nav-link mobile-settings-link">Settings</a>
          <a href="#" class="nav-link mobile-logout-link">Logout</a>
        `;
        mobileMenu.insertAdjacentHTML('beforeend', mobileUserLinksHtml);
        
        // Add event listener for mobile logout
        const mobileLogoutLink = mobileMenu.querySelector('.mobile-logout-link');
        if (mobileLogoutLink) {
          mobileLogoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
          });
        }
      }
      
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
      
      // Show the static login and register links in desktop nav
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
      
      // Show the login and register links in mobile nav
      if (mobileLoginLink) mobileLoginLink.style.display = '';
      if (mobileRegisterLink) mobileRegisterLink.style.display = '';
      
      // Remove any user-specific links from mobile menu
      const mobileSettingsLink = mobileMenu?.querySelector('.mobile-settings-link');
      const mobileLogoutLink = mobileMenu?.querySelector('.mobile-logout-link');
      if (mobileSettingsLink) mobileSettingsLink.remove();
      if (mobileLogoutLink) mobileLogoutLink.remove();
    }
  }

  logout() {
    // Clear all localStorage items
    localStorage.clear();
    
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    
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