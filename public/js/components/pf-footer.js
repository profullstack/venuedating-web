/**
 * Footer component for the application
 */
class PfFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const year = new Date().getFullYear();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-primary, 'SpaceMono', monospace);
          margin-top: 60px;
        }
        
        .footer {
          padding: 30px 0;
          border-top: 1px solid var(--border-color);
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
          color: var(--primary-color);
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 10px;
        }
        
        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-links a:hover {
          color: var(--primary-color);
        }
        
        .copyright {
          margin-top: 30px;
          text-align: center;
          color: var(--text-tertiary);
          font-size: 14px;
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
            <h3>convert2doc</h3>
            <ul class="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/api-docs">API Documentation</a></li>
              <li><a href="/subscription">Pricing</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Resources</h3>
            <ul class="footer-links">
              <li><a href="/api-keys">API Keys</a></li>
              <li><a href="https://github.com/profullstack/pdf" target="_blank">GitHub</a></li>
              <li><a href="mailto:support@profullstack.com">Support</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Legal</h3>
            <ul class="footer-links">
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div class="copyright">
          &copy; ${year} Profullstack, Inc. All rights reserved.
        </div>
      </div>
    `;
  }
}

// Define the custom element
customElements.define('pf-footer', PfFooter);