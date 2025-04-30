/**
 * Translation Helper Utility
 * 
 * Handles translation of HTML content using the i18n system
 */

/**
 * Translates all i18n elements in the provided container
 * @param {HTMLElement} container - The container element with i18n attributes
 * @param {string} language - The language code to translate to
 * @returns {void}
 */
export function translateContainer(container, language) {
  if (!window.app || !window.app._t || !window.app.localizer) {
    console.warn('Translation system not available');
    return;
  }
  
  console.log(`Translating container to ${language}`);
  
  // Force language application
  window.app.localizer.setLanguage(language);
  
  // Translate elements with data-i18n attribute
  container.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = window.app._t(key);
  });
  
  // Translate other i18n attributes
  container.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = window.app._t(key);
  });
  
  container.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = window.app._t(key);
  });
  
  container.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    element.innerHTML = window.app._t(key);
  });
  
  // Handle elements with data-i18n-params attribute (for interpolation)
  container.querySelectorAll('[data-i18n-params]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    
    try {
      const paramsAttr = element.getAttribute('data-i18n-params');
      const params = JSON.parse(paramsAttr);
      element.textContent = window.app._t(key, params);
    } catch (error) {
      console.error(`Error parsing data-i18n-params for key ${key}:`, error);
    }
  });
}

/**
 * Applies the stored language to the document
 * @returns {string|null} The applied language code or null if not available
 */
export function applyStoredLanguage() {
  const storedLang = localStorage.getItem('convert2doc-language');
  
  if (storedLang && window.app && window.app.localizer) {
    console.log(`Applying stored language: ${storedLang}`);
    window.app.localizer.setLanguage(storedLang);
    
    // Force language application
    if (window.app.localizer.getLanguage() !== storedLang) {
      console.log(`Language mismatch, forcing to: ${storedLang}`);
      window.app.localizer.setLanguage(storedLang);
    }
    
    return storedLang;
  }
  
  return null;
}

export default {
  translateContainer,
  applyStoredLanguage
};