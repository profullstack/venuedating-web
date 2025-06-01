/**
 * Footer component for BarCrush application
 */
class PfFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Listen for language changes
    window.addEventListener('language-changed', () => {
      console.log('pf-footer: Language changed event received');
      this.translateElements();
    });
    
    // Listen for i18n ready event
    window.addEventListener('i18n-ready', () => {
      console.log('pf-footer: i18n ready event received');
      this.translateElements();
    });
    
    // Listen for pre-navigation event to translate before transition starts
    document.addEventListener('pre-navigation', () => {
      console.log('pf-footer: Pre-navigation event received');
      this.translateElements();
    });
    
    // Listen for router transitions
    document.addEventListener('spa-transition-end', () => {
      console.log('pf-footer: SPA transition end event received');
      this.translateElements();
    });
  }

  render() {
    const year = new Date().getFullYear();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-primary, 'Roboto', sans-serif);
          margin-top: 60px;
        }
        
        .footer {
          padding: 30px 16px;
          border-top: 1px solid #eee;
          background-color: white;
        }
        
        .footer-content {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 30px;
        }
        
        .footer-section {
          flex: 1;
          min-width: 200px;
        }
        
        .footer-section h3 {
          color: #F44B74;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 600;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 12px;
        }
        
        .footer-links a {
          color: #333;
          text-decoration: none;
          transition: color 0.2s;
          font-size: 15px;
        }
        
        .footer-links a:hover {
          color: #F44B74;
        }
        
        .copyright {
          margin-top: 30px;
          text-align: center;
          color: #777;
          font-size: 14px;
        }
        
        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .footer-logo img {
          width: 40px;
          height: 32px;
          margin-right: 10px;
        }
        
        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
          }
        }
      </style>
      
      <div class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h3 data-i18n="app_name">BarCrush</h3>
            <ul class="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/auth">Login / Sign Up</a></li>
              <li><a href="/about">About Us</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Discover</h3>
            <ul class="footer-links">
              <li><a href="/api-keys" data-i18n="footer.api_keys">API Keys</a></li>
              <li><a href="mailto:support@barcrush.app" data-i18n="footer.support">Support</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Legal</h3>
            <ul class="footer-links">
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div class="copyright">
          &copy; ${year} <span data-i18n="footer.company_name">BarCrush, Inc.</span> <span data-i18n="footer.all_rights_reserved">All rights reserved.</span>
        </div>
      </div>
    `;
    
    // Translate elements after rendering
    this.translateElements();
  }
  
  /**
   * Method kept for compatibility but simplified since we're not using translations in BarCrush
   */
  translateElements() {
    console.log('pf-footer: Translation not needed for BarCrush');
    // No translation needed for BarCrush
    return;
  }
}

// Define the custom element
customElements.define('pf-footer', PfFooter);