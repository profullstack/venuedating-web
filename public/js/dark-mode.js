/**
 * Dark Mode Handler
 * 
 * Manages dark/light mode functionality across the app.
 * - Toggles dark mode
 * - Persists user preference in localStorage
 * - Initializes theme on page load
 * - Dispatches theme change events
 */

// Initialize dark mode immediately
initDarkMode();

// Also initialize when document is loaded (for components that load later)
document.addEventListener('DOMContentLoaded', initDarkMode);

// Listen for dark mode toggle events from components
document.addEventListener('darkModeToggle', handleDarkModeToggle);

/**
 * Initialize dark mode from saved preference
 */
function initDarkMode() {
  // Check localStorage for saved preference
  const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
  
  // Set initial state
  if (darkModeEnabled) {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateToggleState(true);
    console.log('Dark mode enabled from localStorage');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    updateToggleState(false);
    console.log('Light mode enabled from localStorage or default');
  }
  
  // Ensure localStorage is set either way
  localStorage.setItem('darkMode', darkModeEnabled ? 'enabled' : 'disabled');
}

/**
 * Handle dark mode toggle events from components
 */
function handleDarkModeToggle(event) {
  const isDarkMode = event.detail.darkMode;
  console.log('Dark mode toggle event received:', isDarkMode);
  
  if (isDarkMode) {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
}

/**
 * Enable dark mode
 */
function enableDarkMode() {
  // Update DOM
  document.documentElement.setAttribute('data-theme', 'dark');
  
  // Update localStorage
  localStorage.setItem('darkMode', 'enabled');
  
  // Update all toggles
  updateToggleState(true);
  
  // Dispatch theme change event
  dispatchThemeChangeEvent('dark');
  
  console.log('Dark mode enabled');
}

/**
 * Disable dark mode
 */
function disableDarkMode() {
  // Update DOM
  document.documentElement.setAttribute('data-theme', 'light');
  
  // Update localStorage
  localStorage.setItem('darkMode', 'disabled');
  
  // Update all toggles
  updateToggleState(false);
  
  // Dispatch theme change event
  dispatchThemeChangeEvent('light');
  
  console.log('Dark mode disabled');
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  if (isDarkMode) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

/**
 * Update all dark mode toggle states in the document
 * This is useful when multiple components have toggle switches
 */
function updateToggleState(checked) {
  // Find any toggle inputs within side-menu components
  // Use shadowRoot query if possible, otherwise wait for components to be defined
  const sideMenus = document.querySelectorAll('side-menu');
  
  if (sideMenus.length > 0) {
    sideMenus.forEach(menu => {
      if (menu.shadowRoot) {
        const toggle = menu.shadowRoot.querySelector('.dark-mode-toggle input');
        if (toggle) {
          toggle.checked = checked;
        }
      }
    });
  }
}

/**
 * Dispatch theme change event
 */
function dispatchThemeChangeEvent(theme) {
  // Create and dispatch a custom event that other components can listen for
  const event = new CustomEvent('themechange', {
    detail: { theme },
    bubbles: true
  });
  document.dispatchEvent(event);
}

// Export functions for use in other modules
window.darkModeHandler = {
  toggle: toggleDarkMode,
  enable: enableDarkMode,
  disable: disableDarkMode,
  init: initDarkMode
};
