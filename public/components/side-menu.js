/**
 * Side Menu component
 * Usage: 
 * 1. Import this file: <script src="/components/side-menu.js" type="module"></script>
 * 2. Add the component where needed: <side-menu user-name="David Paterson" user-avatar="/path/to/avatar.jpg"></side-menu>
 */

class SideMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
  }
  
  connectedCallback() {
    const userName = this.getAttribute('user-name') || 'User Name';
    const userAvatar = this.getAttribute('user-avatar') || '/images/default-avatar.jpg';
    
    this.render(userName, userAvatar);
    this.setupEventListeners();
    
    // Initialize toggle state based on current theme
    setTimeout(() => this.initializeToggleState(), 100);
  }
  
  render(userName, userAvatar) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .menu-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          color: var(--text-primary);
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 10px;
          right: 10px;
          color: var(--text-on-surface);
        }
        
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }
        
        .side-menu {
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          width: 85%;
          max-width: 320px;
          background-color: #2D1139;
          color: #fff;
          z-index: 1000;
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .side-menu.open {
          transform: translateX(0);
        }
        
        .overlay.open {
          opacity: 1;
          visibility: visible;
        }
        
        .profile-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .user-name {
          color: #fff;
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 5px;
          text-align: center;
        }
        
        .profile {
          color: #F44B74;
          font-size: 14px;
          margin: 0;
          text-align: center;
        }
        
        .edit-profile-btn {
          background-color: #F44B74;
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          width: 100%;
          max-width: 200px;
        }
        
        .edit-profile-btn svg {
          margin-right: 8px;
        }
        
        .menu-section {
          margin-bottom: 15px;
        }
        
        .menu-section-title {
          color: #F44B74;
          font-size: 12px;
          margin: 20px 0 10px;
          text-transform: uppercase;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
        }
        
        .menu-item svg {
          margin-right: 12px;
        }
        
        .menu-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          margin: 15px 0;
        }
        
        .delete-account {
          display: flex;
          align-items: center;
          color: #F44B74;
          font-size: 14px;
          margin-top: 10px;
          padding: 12px 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        
        .delete-account svg {
          margin-right: 12px;
        }
        
        .help-center {
          margin-top: auto;
          background-color: #fff;
          border-radius: 50px;
          display: flex;
          align-items: center;
          padding: 15px;
          color: #555;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          position: relative;
        }
        
        .help-center .icon {
          background-color: #F44B74;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
        }
        
        .help-center .arrow {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .dark-mode-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #F44B74;
          border-radius: 50px;
          padding: 5px;
          margin-top: 15px;
        }
        
        .dark-mode-toggle span {
          font-size: 14px;
          font-weight: 500;
          margin-left: 10px;
        }
        
        .toggle-switch {
          width: 45px;
          height: 24px;
          background-color: transparent;
          border-radius: 12px;
          position: relative;
          margin-left: auto;
          margin-right: 5px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent;
          border: 2px solid #fff;
          border-radius: 12px;
          transition: .4s;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 2px;
          background-color: #fff;
          border-radius: 50%;
          transition: .4s;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        /* Hide the toggle if not supported by the browser */
        @media (prefers-color-scheme: no-preference) {
          .dark-mode-toggle {
            display: flex;
          }
        }
      </style>
      
      <button class="menu-button" aria-label="Open menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <div class="overlay"></div>
      
      <div class="side-menu">
        <button class="close-button" aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="profile-section">
          <div class="user-avatar">
            <img src="${userAvatar}" alt="${userName}">
          </div>
          <h3 class="user-name">${userName}</h3>
          <p class="profile">Profile</p>
          <button class="edit-profile-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Profile
          </button>
        </div>
        
        <a href="#" class="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          Language : English
        </a>
        
        <a href="#" class="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          Notifications
        </a>
        
        <div class="menu-section">
          <p class="menu-section-title">Bank</p>
          
          <a href="#" class="menu-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Payments
          </a>
    
        </div>
        
        <div class="menu-section">
          <p class="menu-section-title">Security</p>
          
          <a href="#" class="menu-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Password
          </a>
   
        </div>
        
        <button class="delete-account">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete account
        </button>
        
        <a href="#" class="help-center">
          <div class="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          Help Center 
          <div class="arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>
        
        <div class="dark-mode-toggle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <span>Dark Mode</span>
          <label class="toggle-switch">
            <input type="checkbox">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const menuButton = this.shadowRoot.querySelector('.menu-button');
    const closeButton = this.shadowRoot.querySelector('.close-button');
    const overlay = this.shadowRoot.querySelector('.overlay');
    const sideMenu = this.shadowRoot.querySelector('.side-menu');
    
    // Toggle menu on button click
    menuButton.addEventListener('click', () => {
      this.toggleMenu();
    });
    
    // Close menu when clicking close button
    closeButton.addEventListener('click', () => {
      this.closeMenu();
    });
    
    // Close menu when clicking overlay
    overlay.addEventListener('click', () => {
      this.closeMenu();
    });
    
    // Dark mode toggle functionality
    const darkModeToggle = this.shadowRoot.querySelector('.dark-mode-toggle input');
    darkModeToggle.addEventListener('change', () => {
      const event = new CustomEvent('darkModeToggle', {
        detail: { darkMode: darkModeToggle.checked },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    });
    
    // Initialize toggle state on load
    this.initializeToggleState();
    
    // Prevent clicks inside the menu from closing it
    sideMenu.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
  
  toggleMenu() {
    const sideMenu = this.shadowRoot.querySelector('.side-menu');
    const overlay = this.shadowRoot.querySelector('.overlay');
    
    if (this.isOpen) {
      this.closeMenu();
    } else {
      sideMenu.classList.add('open');
      overlay.classList.add('open');
      this.isOpen = true;
      
      // Directly hide the bottom navigation
      const bottomNav = document.querySelector('bottom-navigation');
      if (bottomNav) {
        bottomNav.style.display = 'none';
      }
    }
  }
  
  closeMenu() {
    const sideMenu = this.shadowRoot.querySelector('.side-menu');
    const overlay = this.shadowRoot.querySelector('.overlay');
    
    sideMenu.classList.remove('open');
    overlay.classList.remove('open');
    this.isOpen = false;
    
    // Directly show the bottom navigation
    const bottomNav = document.querySelector('bottom-navigation');
    if (bottomNav) {
      bottomNav.style.display = '';
    }
  }
  
  // Public method to programmatically open the menu
  open() {
    if (!this.isOpen) {
      this.toggleMenu();
    }
  }
  
  // Public method to programmatically close the menu
  close() {
    if (this.isOpen) {
      this.closeMenu();
    }
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if ((name === 'user-name' || name === 'user-avatar') && oldValue !== newValue) {
      this.render(
        this.getAttribute('user-name') || 'User Name',
        this.getAttribute('user-avatar') || '/images/default-avatar.jpg'
      );
      this.setupEventListeners();
    }
  }
  
  static get observedAttributes() {
    return ['user-name', 'user-avatar'];
  }
  
  // Initialize dark mode toggle based on current theme
  initializeToggleState() {
    try {
      const toggle = this.shadowRoot.querySelector('.dark-mode-toggle input');
      if (toggle) {
        // Get current theme from data attribute (most reliable source)
        const darkModeEnabled = document.documentElement.getAttribute('data-theme') === 'dark';
          
        // Update toggle state without triggering the event
        toggle.checked = darkModeEnabled;
        console.log('Dark mode toggle initialized:', darkModeEnabled);
      }
    } catch (error) {
      console.error('Error initializing dark mode toggle:', error);
    }
  }
}

// Register the custom element
customElements.define('side-menu', SideMenu);

export default SideMenu;
