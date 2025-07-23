/**
 * Test script for verifying language switching functionality
 * This script will:
 * 1. Log the current language
 * 2. Attempt to switch languages
 * 3. Verify that elements with data-i18n attributes are updated
 */

document.addEventListener('DOMContentLoaded', () => {
  // Create a test UI for language switching
  const testContainer = document.createElement('div');
  testContainer.style.position = 'fixed';
  testContainer.style.bottom = '100px';
  testContainer.style.right = '20px';
  testContainer.style.zIndex = '10000';
  testContainer.style.background = 'rgba(255, 255, 255, 0.9)';
  testContainer.style.padding = '10px';
  testContainer.style.borderRadius = '5px';
  testContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  testContainer.style.maxWidth = '300px';
  
  testContainer.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Language Test Panel</div>
    <div id="current-language-display" style="margin-bottom: 8px;">Current: </div>
    <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
      <button class="test-lang-btn" data-lang="en">English</button>
      <button class="test-lang-btn" data-lang="fr">French</button>
      <button class="test-lang-btn" data-lang="es">Spanish</button>
      <button class="test-lang-btn" data-lang="de">German</button>
      <button class="test-lang-btn" data-lang="ar">Arabic</button>
    </div>
    <div id="i18n-status" style="font-size: 12px; margin-top: 5px;">Status: Ready</div>
  `;
  
  document.body.appendChild(testContainer);
  
  // Style the buttons
  const buttons = testContainer.querySelectorAll('.test-lang-btn');
  buttons.forEach(btn => {
    btn.style.padding = '5px 10px';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '3px';
    btn.style.background = '#f0f0f0';
    btn.style.cursor = 'pointer';
    
    // Add click event to change language
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      changeLanguage(lang);
    });
  });
  
  updateCurrentLanguageDisplay();
  
  // Function to change language
  function changeLanguage(lang) {
    try {
      const statusEl = document.getElementById('i18n-status');
      statusEl.textContent = `Status: Changing to ${lang}...`;
      
      if (window.app && window.app.localizer) {
        window.app.localizer.setLanguage(lang);
        
        // Update status with count of translated elements
        setTimeout(() => {
          const translatedElements = document.querySelectorAll('[data-i18n]').length;
          statusEl.textContent = `Status: Changed to ${lang}. Found ${translatedElements} i18n elements.`;
          updateCurrentLanguageDisplay();
        }, 500);
      } else {
        statusEl.textContent = 'Status: Error - localizer not found';
      }
    } catch (error) {
      console.error('Error changing language:', error);
      document.getElementById('i18n-status').textContent = `Status: Error - ${error.message}`;
    }
  }
  
  // Function to update the current language display
  function updateCurrentLanguageDisplay() {
    const currentLangEl = document.getElementById('current-language-display');
    let currentLang = 'unknown';
    
    if (window.app && window.app.localizer) {
      currentLang = window.app.localizer.getLanguage();
    } else if (localStorage.getItem('convert2doc-language')) {
      currentLang = localStorage.getItem('convert2doc-language');
    }
    
    currentLangEl.textContent = `Current: ${currentLang}`;
    
    // Highlight the current language button
    buttons.forEach(btn => {
      if (btn.dataset.lang === currentLang) {
        btn.style.background = '#F44B74';
        btn.style.color = 'white';
        btn.style.borderColor = '#F44B74';
      } else {
        btn.style.background = '#f0f0f0';
        btn.style.color = 'inherit';
        btn.style.borderColor = '#ccc';
      }
    });
  }
  
  // Log i18n setup information
  console.log('i18n test script loaded');
  if (window.app && window.app.localizer) {
    console.log('Localizer found:', window.app.localizer);
    console.log('Current language:', window.app.localizer.getLanguage());
    console.log('Available languages:', window.app.localizer.getAvailableLanguages());
  } else {
    console.warn('Localizer not found. Make sure i18n-setup.js is loaded first.');
  }
});
