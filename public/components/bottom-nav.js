/**
 * Bottom navigation component
 * Usage: 
 * 1. Import this file: <script src="/components/bottom-nav.js" type="module"></script>
 * 2. Add the component where needed: <bottom-navigation current-page="discover"></bottom-navigation>
 */

class BottomNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    const currentPage = this.getAttribute('current-page') || 'discover';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          z-index: 100;
        }
        
        /* Bottom Navigation */
        .bottom-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: white;
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          border-radius: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 182px;
          padding: 12px 24px;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.2s ease;
          position: relative;
          width: 40px;
          height: 40px;
        }
        
        .nav-item svg {
          width: 24px;
          height: 24px;
          position: relative;
          z-index: 2;
        }
        
        .nav-item.active::before {
          content: "";
          position: absolute;
          width: 40px;
          height: 40px;
          background-color: #F44B74;
          border-radius: 50%;
          z-index: 1;
        }
        
        .nav-item.active svg {
          fill: white;
          stroke: white;
        }
        
        .nav-item:not(.active) svg {
          fill: none;
          stroke: #F44B74;
        }
      </style>
      
      <nav class="bottom-nav">
        <a href="/discover" class="nav-item ${currentPage === 'discover' ? 'active' : ''}">
          <svg width="24" height="24" viewBox="0 0 24 24" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </a>
        <a href="/matching" class="nav-item ${currentPage === 'matching' ? 'active' : ''}">
          <svg width="24" height="24" viewBox="0 0 24 24" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </a>
        <a href="/chat" class="nav-item ${currentPage === 'chat' ? 'active' : ''}">
          <svg width="24" height="24" viewBox="0 0 24 24" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </a>
      </nav>
    `;
  }
}

// Register the custom element
customElements.define('bottom-navigation', BottomNavigation);

export default BottomNavigation;
