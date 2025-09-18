import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Theme store for managing dark/light mode
 */
function createThemeStore() {
  const { subscribe, set, update } = writable({
    mode: 'dark', // default to dark mode
    colors: {
      primary: '#ff6b35',
      secondary: '#4a90e2',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#404040',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
  });

  const themes = {
    dark: {
      mode: 'dark',
      colors: {
        primary: '#ff6b35',
        secondary: '#4a90e2',
        background: '#1a1a1a',
        surface: '#2a2a2a',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#404040',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      }
    },
    light: {
      mode: 'light',
      colors: {
        primary: '#ff6b35',
        secondary: '#4a90e2',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#1a1a1a',
        textSecondary: '#666666',
        border: '#e0e0e0',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      }
    }
  };

  return {
    subscribe,

    /**
     * Initialize theme from localStorage or system preference
     */
    init() {
      if (!browser) return;

      let savedTheme = null;
      
      try {
        savedTheme = localStorage.getItem('theme-mode');
      } catch (error) {
        console.error('Error reading theme from localStorage:', error);
      }

      // Use saved theme, or detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeMode = savedTheme || (prefersDark ? 'dark' : 'light');
      
      this.setTheme(themeMode);

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme-mode')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    },

    /**
     * Set theme mode
     * @param {string} mode - 'dark' or 'light'
     */
    setTheme(mode) {
      if (!themes[mode]) {
        console.error(`Invalid theme mode: ${mode}`);
        return;
      }

      const theme = themes[mode];
      set(theme);

      if (browser) {
        // Save to localStorage
        try {
          localStorage.setItem('theme-mode', mode);
        } catch (error) {
          console.error('Error saving theme to localStorage:', error);
        }

        // Apply CSS custom properties
        this.applyCSSVariables(theme.colors);
        
        // Update document class
        document.documentElement.className = `theme-${mode}`;
        document.body.className = `theme-${mode}`;
      }
    },

    /**
     * Toggle between dark and light themes
     */
    toggle() {
      update(currentTheme => {
        const newMode = currentTheme.mode === 'dark' ? 'light' : 'dark';
        this.setTheme(newMode);
        return themes[newMode];
      });
    },

    /**
     * Apply CSS custom properties to document root
     * @param {object} colors 
     */
    applyCSSVariables(colors) {
      if (!browser) return;

      const root = document.documentElement;
      
      Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      });
    },

    /**
     * Get current theme mode
     * @returns {string}
     */
    getMode() {
      let currentMode = 'dark';
      this.subscribe(theme => {
        currentMode = theme.mode;
      })();
      return currentMode;
    },

    /**
     * Check if current theme is dark
     * @returns {boolean}
     */
    isDark() {
      return this.getMode() === 'dark';
    }
  };
}

export const themeStore = createThemeStore();

/**
 * CSS utility classes based on current theme
 */
export const themeClasses = {
  // Background classes
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    surface: 'bg-surface',
    background: 'bg-background'
  },
  
  // Text classes
  text: {
    primary: 'text-primary',
    secondary: 'text-secondary',
    default: 'text-default',
    muted: 'text-muted'
  },
  
  // Border classes
  border: {
    default: 'border-default',
    primary: 'border-primary'
  },
  
  // State classes
  state: {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  }
};

/**
 * Theme-aware CSS styles
 */
export const themeStyles = `
  :root {
    /* Default dark theme variables */
    --color-primary: #ff6b35;
    --color-secondary: #4a90e2;
    --color-background: #1a1a1a;
    --color-surface: #2a2a2a;
    --color-text: #ffffff;
    --color-text-secondary: #b0b0b0;
    --color-border: #404040;
    --color-success: #4caf50;
    --color-warning: #ff9800;
    --color-error: #f44336;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    
    /* Border radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 1rem;
    --radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    
    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 500ms ease;
  }
  
  /* Theme utility classes */
  .bg-primary { background-color: var(--color-primary); }
  .bg-secondary { background-color: var(--color-secondary); }
  .bg-surface { background-color: var(--color-surface); }
  .bg-background { background-color: var(--color-background); }
  
  .text-primary { color: var(--color-primary); }
  .text-secondary { color: var(--color-secondary); }
  .text-default { color: var(--color-text); }
  .text-muted { color: var(--color-text-secondary); }
  .text-success { color: var(--color-success); }
  .text-warning { color: var(--color-warning); }
  .text-error { color: var(--color-error); }
  
  .border-default { border-color: var(--color-border); }
  .border-primary { border-color: var(--color-primary); }
  
  /* Base styles */
  body {
    background-color: var(--color-background);
    color: var(--color-text);
    transition: background-color var(--transition-normal), color var(--transition-normal);
  }
  
  /* Component styles */
  .card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
  }
  
  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: 500;
  }
  
  .button-primary {
    background-color: var(--color-primary);
    color: white;
  }
  
  .button-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .button-secondary {
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  
  .button-secondary:hover {
    background-color: var(--color-surface);
  }
  
  .input {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text);
    transition: border-color var(--transition-fast);
  }
  
  .input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  .input::placeholder {
    color: var(--color-text-secondary);
  }
`;