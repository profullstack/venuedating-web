/**
 * Language Switcher Component
 * A web component for switching between available languages
 */
import { localizer } from '../i18n-setup.js';

class LanguageSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Wait for i18n to be ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.render();
    } else {
      window.addEventListener('i18n-ready', () => this.render());
    }

    // Listen for language changes
    window.addEventListener('language-changed', (event) => {
      console.log(`Language-switcher detected language change to: ${event.detail.language}`);
      this.updateSelectedLanguage();
    });
    
    // Listen for pre-navigation event to update language before transition starts
    document.addEventListener('pre-navigation', () => {
      console.log('Language-switcher detected pre-navigation event, updating selected language');
      this.updateSelectedLanguage();
    });
    
    // Also listen for router transitions to ensure language is preserved
    document.addEventListener('spa-transition-end', () => {
      console.log('Language-switcher detected route transition, updating selected language');
      this.updateSelectedLanguage();
    });
  }

  render() {
    const currentLang = localizer.getLanguage();
    const availableLanguages = localizer.getAvailableLanguages();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: var(--font-primary, 'SpaceMono', monospace);
        }
        
        .language-switcher {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .language-label {
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .language-select {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-color, #ddd);
          background-color: var(--background-color, #fff);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
          outline: none;
        }
        
        .language-select:hover {
          border-color: var(--primary-color, #e02337);
        }
        
        .language-select:focus {
          border-color: var(--primary-color, #e02337);
          box-shadow: 0 0 0 2px rgba(224, 35, 55, 0.2);
        }
        
        .language-buttons {
          display: flex;
          gap: 5px;
        }
        
        .language-button {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-color, #ddd);
          background-color: var(--background-color, #fff);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .language-button:hover {
          background-color: var(--surface-variant, #f3f4f6);
        }
        
        .language-button.active {
          background-color: var(--primary-color, #e02337);
          color: white;
          border-color: var(--primary-color, #e02337);
        }
        
        /* Dropdown style */
        .dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-color, #ddd);
          background-color: var(--background-color, #fff);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
        }
        
        .dropdown-button:hover {
          background-color: var(--surface-variant, #f3f4f6);
        }
        
        .dropdown-content {
          display: none;
          position: absolute;
          min-width: 120px;
          z-index: 1;
          background-color: var(--background-color, #fff);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dropdown-content.show {
          display: block;
        }
        
        .dropdown-item {
          padding: 8px 12px;
          display: block;
          text-decoration: none;
          color: var(--text-primary);
          cursor: pointer;
        }
        
        .dropdown-item:hover {
          background-color: var(--surface-variant, #f3f4f6);
        }
        
        .dropdown-item.active {
          font-weight: bold;
          color: var(--primary-color, #e02337);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .language-label {
            display: none;
          }
        }
      </style>
      
      <div class="language-switcher">
        <span class="language-label">${localizer.translate('navigation.language', 'Language')}:</span>
        
        <!-- Dropdown style (default) -->
        <div class="dropdown">
          <button class="dropdown-button">
            <span class="current-language">${this.getLanguageName(currentLang)}</span>
            <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="dropdown-content">
            ${availableLanguages.map(lang => `
              <div class="dropdown-item ${lang === currentLang ? 'active' : ''}" data-lang="${lang}">
                ${this.getLanguageName(lang)}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Dropdown toggle
    const dropdownButton = this.shadowRoot.querySelector('.dropdown-button');
    const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
    
    if (dropdownButton && dropdownContent) {
      // Use direct onclick assignment for more reliable event handling in Shadow DOM
      dropdownButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Language dropdown button clicked');
        dropdownContent.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      // We need a different approach for Shadow DOM
      const closeDropdown = (event) => {
        // Check if click is inside this shadow root
        const path = event.composedPath();
        const isInside = path.includes(this) || path.includes(this.shadowRoot);
        
        // If click is outside this component, close the dropdown
        if (!isInside && dropdownContent.classList.contains('show')) {
          console.log('Outside click detected, closing language dropdown');
          dropdownContent.classList.remove('show');
        }
      };
      
      // Use capture phase to ensure we get the event
      document.addEventListener('click', closeDropdown, true);
      
      // Store the listener so we can remove it later if needed
      this._documentClickHandler = closeDropdown;
      
      // Language selection
      const dropdownItems = this.shadowRoot.querySelectorAll('.dropdown-item');
      dropdownItems.forEach(item => {
        // Use direct onclick assignment
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lang = item.getAttribute('data-lang');
          console.log(`Language selected: ${lang}`);
          localizer.setLanguage(lang);
          dropdownContent.classList.remove('show');
        };
      });
    }
  }

  updateSelectedLanguage() {
    const currentLang = localizer.getLanguage();
    console.log(`Updating language-switcher UI to reflect current language: ${currentLang}`);
    
    // Update dropdown button text
    const currentLanguageSpan = this.shadowRoot.querySelector('.current-language');
    if (currentLanguageSpan) {
      currentLanguageSpan.textContent = this.getLanguageName(currentLang);
    }
    
    // Update active state in dropdown items
    const dropdownItems = this.shadowRoot.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      const itemLang = item.getAttribute('data-lang');
      if (itemLang === currentLang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Apply translations using the enhanced localizer
    localizer.translateDOM();
    localizer.applyRTLToDocument();
  }

  getLanguageName(langCode) {
    const names = {
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      uk: 'Українська',
      ru: 'Русский',
      pl: 'Polski',
      zh: '中文',
      ja: '日本語',
      ar: 'العربية'
    };
    
    return names[langCode] || langCode;
  }
}

// Define the custom element
customElements.define('language-switcher', LanguageSwitcher);

export default LanguageSwitcher;