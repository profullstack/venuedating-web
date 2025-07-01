// discover-sidebar.js: Sidebar menu as a web component for BarCrush Discover page

const template = document.createElement('template');
template.innerHTML = `
  <style>
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(20, 10, 30, 0.55);
      z-index: 1001;
      transition: opacity 0.2s;
    }
    .sidebar-overlay.active {
      display: block;
      opacity: 1;
    }
    .sidebar-menu {
      position: fixed;
      top: 0; left: 0;
      height: 100vh;
      width: 290px;
      background: #3a1847;
      border-radius: 18px 0 0 18px;
      color: #fff;
      z-index: 1002;
      transform: translateX(-105%);
      transition: transform 0.25s cubic-bezier(.4,1.5,.5,1);
      box-shadow: 2px 0 24px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      padding: 22px 0 18px 0;
      max-width: 92vw;
    }
    .sidebar-menu.open {
      transform: translateX(0);
    }
    .sidebar-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 24px 18px 24px;
    }
    .sidebar-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .sidebar-name {
      font-size: 17px;
      font-weight: 600;
      color: #fff;
    }
    .sidebar-nav {
      flex: 1;
      padding: 0 24px;
      overflow-y: auto;
    }
    .sidebar-section {
      margin-bottom: 18px;
    }
    .sidebar-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #f4c4ec;
      margin-bottom: 6px;
      display: block;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      color: #fff;
      text-decoration: none;
      margin-bottom: 7px;
      padding: 7px 0;
      border-radius: 8px;
      transition: background 0.14s;
    }
    .sidebar-link.active,
    .sidebar-link:hover {
      background: rgba(244,75,116,0.12);
      color: #F44B74;
    }
    .sidebar-icon {
      font-size: 18px;
      margin-right: 2px;
    }
    .sidebar-divider {
      border: none;
      border-top: 1px solid #6a397a;
      margin: 14px 0 10px 0;
    }
    .delete-account {
      color: #F44B74;
      font-weight: 600;
      margin-bottom: 0;
    }
    .sidebar-bottom {
      padding: 16px 24px 0 24px;
    }
    .sidebar-help-center {
      display: flex;
      align-items: center;
      background: #fff;
      color: #3a1847;
      border-radius: 12px;
      padding: 9px 14px;
      margin-bottom: 14px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
    }
    .sidebar-help-icon {
      font-size: 20px;
      margin-right: 8px;
    }
    .sidebar-help-arrow {
      margin-left: auto;
      font-size: 18px;
      color: #F44B74;
    }
    .sidebar-darkmode {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }
    .sidebar-darkmode-label {
      font-weight: 500;
    }
    .sidebar-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .sidebar-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .sidebar-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #ccc;
      border-radius: 20px;
      transition: background 0.2s;
    }
    .sidebar-switch input:checked + .sidebar-slider {
      background: #F44B74;
    }
    .sidebar-slider:before {
      content: "";
      position: absolute;
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .sidebar-switch input:checked + .sidebar-slider:before {
      transform: translateX(16px);
    }
  </style>
  <div class="sidebar-overlay"></div>
  <aside class="sidebar-menu">
    <div class="sidebar-profile">
      <img class="sidebar-avatar" src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile avatar">
      <span class="sidebar-name">David Paterson</span>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <span class="sidebar-section-title">Profile</span>
        <a class="sidebar-link active" href="#"><span class="sidebar-icon">&#128100;</span> Edit Profile</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#127760;</span> Language : English</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128276;</span> Notifications</a>
      </div>
      <div class="sidebar-section">
        <span class="sidebar-section-title">Bank</span>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128179;</span> Payments</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128279;</span> Taxes</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128179;</span> Transactions</a>
      </div>
      <div class="sidebar-section">
        <span class="sidebar-section-title">Security</span>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128274;</span> Password</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128272;</span> Access</a>
        <a class="sidebar-link" href="#"><span class="sidebar-icon">&#128196;</span> Sessions</a>
      </div>
      <hr class="sidebar-divider">
      <a class="sidebar-link delete-account" href="#"><span class="sidebar-icon">&#128465;</span> Delete account</a>
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-help-center">
        <span class="sidebar-help-icon">&#128172;</span>
        <div>
          <span class="sidebar-help-title">Help Center</span><br>
          <span class="sidebar-help-desc">Answers here</span>
        </div>
        <span class="sidebar-help-arrow">&#8594;</span>
      </div>
      <div class="sidebar-darkmode">
        <span class="sidebar-darkmode-icon">&#9788;</span>
        <span class="sidebar-darkmode-label">Dark Mode</span>
        <label class="sidebar-switch">
          <input type="checkbox" id="darkmode-toggle">
          <span class="sidebar-slider"></span>
        </label>
      </div>
    </div>
  </aside>
`;

class DiscoverSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    console.log('DiscoverSidebar component constructed');
  }

  connectedCallback() {
    console.log('DiscoverSidebar connected to DOM');
    this._overlay = this.shadowRoot.querySelector('.sidebar-overlay');
    this._sidebar = this.shadowRoot.querySelector('.sidebar-menu');
    
    console.log('DEBUG: Sidebar elements found:', {
      overlay: this._overlay,
      sidebar: this._sidebar
    });
    
    if (this._overlay) {
      this._overlay.addEventListener('click', () => this.close());
      console.log('DEBUG: Added click listener to overlay');
    } else {
      console.error('DEBUG: Overlay element not found in shadow DOM');
    }
    
    // Optionally, close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
    
    // Expose the open method globally for debugging
    window.openDiscoverSidebar = () => {
      console.log('DEBUG: Manual sidebar open triggered');
      this.open();
    };
    
    console.log('DEBUG: Sidebar component fully initialized');
  }

  open() {
    console.log('Opening sidebar');
    console.log('DEBUG: Open method called with sidebar:', this._sidebar, 'overlay:', this._overlay);
    
    // Re-query elements if they're not found (in case they weren't available during connectedCallback)
    if (!this._sidebar || !this._overlay) {
      console.log('DEBUG: Re-querying sidebar elements');
      this._sidebar = this.shadowRoot.querySelector('.sidebar-menu');
      this._overlay = this.shadowRoot.querySelector('.sidebar-overlay');
    }
    
    if (this._sidebar && this._overlay) {
      console.log('DEBUG: Adding open/active classes to elements');
      this._sidebar.classList.add('open');
      this._overlay.classList.add('active');
      
      // Force a reflow to ensure CSS transitions work
      void this._sidebar.offsetWidth;
      
      // Verify classes were added
      console.log('DEBUG: Sidebar classes after open:', this._sidebar.className);
      console.log('DEBUG: Overlay classes after open:', this._overlay.className);
    } else {
      console.error('Cannot open sidebar: elements not found', {
        sidebar: this._sidebar,
        overlay: this._overlay
      });
    }
  }

  close() {
    console.log('Closing sidebar');
    if (this._sidebar && this._overlay) {
      this._sidebar.classList.remove('open');
      this._overlay.classList.remove('active');
    }
  }
}

customElements.define('discover-sidebar', DiscoverSidebar);
