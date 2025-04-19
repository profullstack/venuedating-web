/**
 * Profullstack, Inc. Document Generation API
 * Theme switching functionality
 */

class ThemeManager {
  constructor() {
    this.themeToggleClass = 'theme-toggle';
    this.darkThemeClass = 'dark';
    this.lightThemeClass = 'light';
    this.storageKey = 'profullstack-theme';
    this.themeAttribute = 'data-theme';
    
    this.init();
  }
  
  /**
   * Initialize the theme manager
   */
  init() {
    // Create theme toggle button if it doesn't exist
    this.createToggleButton();
    
    // Set initial theme
    this.setInitialTheme();
    
    // Add event listener to theme toggle button
    this.addToggleListener();
    
    // Listen for system preference changes
    this.addSystemPreferenceListener();
  }
  
  /**
   * Create theme toggle button
   */
  createToggleButton() {
    // Check if toggle button already exists
    if (document.querySelector(`.${this.themeToggleClass}`)) {
      return;
    }
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = this.themeToggleClass;
    toggleButton.setAttribute('aria-label', 'Toggle theme');
    toggleButton.setAttribute('title', 'Toggle light/dark theme');
    
    // Create SVG icons for sun and moon
    const lightIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon-light">
        <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
      </svg>
    `;
    
    const darkIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon-dark">
        <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
      </svg>
    `;
    
    // Set initial icon based on current theme
    const currentTheme = this.getCurrentTheme();
    toggleButton.innerHTML = currentTheme === this.darkThemeClass ? lightIcon : darkIcon;
    
    // Append toggle button to body
    document.body.appendChild(toggleButton);
  }
  
  /**
   * Set initial theme based on saved preference or system preference
   */
  setInitialTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme;
    if (savedTheme) {
      theme = savedTheme;
    } else {
      theme = prefersDarkScheme ? this.darkThemeClass : this.lightThemeClass;
      // Save the initial theme to localStorage
      localStorage.setItem(this.storageKey, theme);
    }
    
    this.setTheme(theme);
  }
  
  /**
   * Add event listener to theme toggle button
   */
  addToggleListener() {
    document.addEventListener('click', (event) => {
      const toggleButton = event.target.closest(`.${this.themeToggleClass}`);
      if (toggleButton) {
        this.toggleTheme();
      }
    });
  }
  
  /**
   * Add listener for system preference changes
   */
  addSystemPreferenceListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      // Only change theme if user hasn't set a preference
      if (!localStorage.getItem(this.storageKey)) {
        const newTheme = event.matches ? this.darkThemeClass : this.lightThemeClass;
        this.setTheme(newTheme);
        // Save the theme to localStorage
        localStorage.setItem(this.storageKey, newTheme);
      }
    });
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.lightThemeClass ? this.darkThemeClass : this.lightThemeClass;
    
    this.setTheme(newTheme);
    localStorage.setItem(this.storageKey, newTheme);
    
    // Update toggle button icon
    const toggleButton = document.querySelector(`.${this.themeToggleClass}`);
    if (toggleButton) {
      const lightIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon-light">
          <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
        </svg>
      `;
      
      const darkIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon-dark">
          <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
        </svg>
      `;
      
      toggleButton.innerHTML = newTheme === this.darkThemeClass ? lightIcon : darkIcon;
    }
  }
  
  /**
   * Set theme
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  setTheme(theme) {
    document.documentElement.setAttribute(this.themeAttribute, theme);
    
    // Dispatch theme change event
    const event = new CustomEvent('themechange', { detail: { theme } });
    document.dispatchEvent(event);
  }
  
  /**
   * Get current theme
   * @returns {string} - Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute(this.themeAttribute) || this.lightThemeClass;
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});