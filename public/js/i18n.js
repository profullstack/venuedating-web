/**
 * Internationalization (i18n) module for the PDF project
 * Uses the @profullstack/localizer library for translations
 */

// Import the localizer library
// In production, this would be imported from the npm package
// import { localizer, _t } from '@profullstack/localizer';
// For development, we'll use ESM imports
import { localizer, _t } from 'https://esm.sh/@profullstack/localizer@0.1.0';

// Store available languages
const AVAILABLE_LANGUAGES = ['en', 'fr', 'de'];
const DEFAULT_LANGUAGE = 'en';

/**
 * Flatten a nested object into a flat object with dot notation keys
 * @param {Object} obj - The object to flatten
 * @param {string} [prefix=''] - The prefix to use for keys
 * @returns {Object} - The flattened object
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {});
}

// Initialize the localizer
async function initI18n() {
  console.log('Initializing i18n...');
  
  try {
    // Load translations for all available languages
    for (const lang of AVAILABLE_LANGUAGES) {
      const response = await fetch(`/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json: ${response.status}`);
      }
      
      const translations = await response.json();
      // Flatten the nested translations
      const flattenedTranslations = flattenObject(translations);
      
      // Load the flattened translations
      localizer.loadTranslations(lang, flattenedTranslations);
    }
    
    console.log('Translations loaded successfully');
    
    // Set initial language based on browser preference or localStorage
    setInitialLanguage();
    
    // Apply translations to the current page
    translatePage();
    
    // Set up language switcher if it exists
    setupLanguageSwitcher();
    
    // Listen for DOM changes to translate dynamically added content
    observeDomChanges();
    
    console.log('i18n initialized successfully');
    
    // Dispatch an event to notify that i18n is ready
    window.dispatchEvent(new CustomEvent('i18n-ready'));
    
    return true;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    return false;
  }
}

/**
 * Set the initial language based on browser preference or localStorage
 */
function setInitialLanguage() {
  // Check if language is stored in localStorage
  const storedLang = localStorage.getItem('profullstack-language');
  
  if (storedLang && AVAILABLE_LANGUAGES.includes(storedLang)) {
    console.log(`Using stored language preference: ${storedLang}`);
    localizer.setLanguage(storedLang);
    return;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  
  if (AVAILABLE_LANGUAGES.includes(browserLang)) {
    console.log(`Using browser language: ${browserLang}`);
    localizer.setLanguage(browserLang);
  } else {
    console.log(`Browser language ${browserLang} not available, using default: ${DEFAULT_LANGUAGE}`);
    localizer.setLanguage(DEFAULT_LANGUAGE);
  }
}

/**
 * Change the current language
 * @param {string} language - The language code to switch to
 */
function changeLanguage(language) {
  if (!AVAILABLE_LANGUAGES.includes(language)) {
    console.error(`Language ${language} is not available`);
    return false;
  }
  
  console.log(`Changing language to: ${language}`);
  localizer.setLanguage(language);
  
  // Store the language preference
  localStorage.setItem('profullstack-language', language);
  
  // Apply translations to the current page
  translatePage();
  
  // Dispatch an event to notify that language has changed
  window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: { language } 
  }));
  
  return true;
}

/**
 * Apply translations to the current page
 */
function translatePage() {
  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = _t(key);
  });
  
  // Translate elements with data-i18n-placeholder attribute (for input placeholders)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = _t(key);
  });
  
  // Translate elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = _t(key);
  });
  
  // Translate elements with data-i18n-html attribute (for HTML content)
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    element.innerHTML = _t(key);
  });
  
  // Handle elements with data-i18n-params attribute (for interpolation)
  document.querySelectorAll('[data-i18n-params]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    
    try {
      const paramsAttr = element.getAttribute('data-i18n-params');
      const params = JSON.parse(paramsAttr);
      element.textContent = _t(key, params);
    } catch (error) {
      console.error(`Error parsing data-i18n-params for key ${key}:`, error);
    }
  });
}

/**
 * Set up language switcher if it exists in the DOM
 */
function setupLanguageSwitcher() {
  const languageSwitcher = document.getElementById('language-switcher');
  if (!languageSwitcher) return;
  
  // Clear existing options
  languageSwitcher.innerHTML = '';
  
  // Add options for each available language
  AVAILABLE_LANGUAGES.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = getLanguageName(lang);
    option.selected = localizer.getLanguage() === lang;
    languageSwitcher.appendChild(option);
  });
  
  // Add change event listener
  languageSwitcher.addEventListener('change', (event) => {
    changeLanguage(event.target.value);
  });
}

/**
 * Get the display name of a language
 * @param {string} langCode - The language code
 * @returns {string} The language name
 */
function getLanguageName(langCode) {
  const names = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch'
  };
  
  return names[langCode] || langCode;
}

/**
 * Observe DOM changes to translate dynamically added content
 */
function observeDomChanges() {
  // Create a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldTranslate = false;
    
    // Check if any of the mutations added nodes with data-i18n attributes
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node or any of its children have data-i18n attributes
            if (
              node.hasAttribute && (
                node.hasAttribute('data-i18n') ||
                node.hasAttribute('data-i18n-placeholder') ||
                node.hasAttribute('data-i18n-title') ||
                node.hasAttribute('data-i18n-html') ||
                node.hasAttribute('data-i18n-params') ||
                node.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html], [data-i18n-params]')
              )
            ) {
              shouldTranslate = true;
            }
          }
        });
      }
    });
    
    // If we found elements to translate, update the page
    if (shouldTranslate) {
      translatePage();
    }
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export the API
export {
  initI18n,
  changeLanguage,
  translatePage,
  _t,
  localizer,
  AVAILABLE_LANGUAGES
};

// Initialize i18n when the DOM is loaded
document.addEventListener('DOMContentLoaded', initI18n);

// Also initialize immediately if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initI18n();
}