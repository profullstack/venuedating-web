// Test script for the country picker on the profile page
import { countries } from '/js/data/countries.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Testing country picker on profile page...');
  
  // Check if the country picker elements exist
  const countrySelect = document.getElementById('country-select');
  const countryDropdown = document.getElementById('country-dropdown');
  const phoneInput = document.getElementById('phone-number');
  const countryCodeInput = document.getElementById('country-code-input');
  const fullPhoneInput = document.getElementById('full-phone');
  
  if (!countrySelect || !countryDropdown || !phoneInput) {
    console.error('Country picker elements not found');
    return;
  }
  
  console.log('Country picker elements found');
  
  // Initialize country dropdown
  await populateCountries();
  
  // Set up event handlers
  setupEventHandlers();
  
  // Test opening the dropdown
  console.log('Testing dropdown open/close...');
  countrySelect.click();
  
  // Check if the dropdown is visible
  setTimeout(() => {
    const isVisible = countryDropdown.classList.contains('show') &&
                     countryDropdown.style.display !== 'none';
    
    console.log(`Dropdown visible: ${isVisible}`);
    
    // Test selecting a country
    const countryOptions = countryDropdown.querySelectorAll('.country-option');
    
    if (countryOptions.length === 0) {
      console.error('No country options found in dropdown');
      return;
    }
    
    console.log(`Found ${countryOptions.length} country options`);
    
    // Select a different country (e.g., United Kingdom)
    const ukOption = Array.from(countryOptions).find(option =>
      option.getAttribute('data-country') === 'gb'
    );
    
    if (ukOption) {
      console.log('Selecting United Kingdom...');
      ukOption.click();
      
      // Check if the selected country was updated
      setTimeout(() => {
        const countryFlag = countrySelect.querySelector('.country-flag');
        const countryCode = countrySelect.querySelector('.country-code');
        
        console.log(`Selected flag: ${countryFlag.textContent}`);
        console.log(`Selected code: ${countryCode.textContent}`);
        console.log(`Hidden input value: ${countryCodeInput.value}`);
        
        // Test phone number formatting
        console.log('Testing phone number formatting...');
        phoneInput.value = '2071234567';
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        phoneInput.dispatchEvent(inputEvent);
        
        // Check formatted phone number
        console.log(`Formatted phone number: ${phoneInput.value}`);
        
        // Check full phone number
        console.log(`Full phone number: ${fullPhoneInput.value}`);
        
        console.log('Country picker test completed');
      }, 100);
    } else {
      console.error('United Kingdom option not found');
    }
  }, 100);
});

// Populate countries dropdown
async function populateCountries() {
  try {
    console.log('Populating countries dropdown...');
    
    // Clear existing options
    const countryDropdown = document.getElementById('country-dropdown');
    countryDropdown.innerHTML = '';
    
    // Add popular countries first (US, UK, Canada, Australia)
    const popularCountryCodes = ['us', 'gb', 'ca', 'au'];
    const popularCountries = countries.filter(country =>
      popularCountryCodes.includes(country.code)
    );
    
    if (popularCountries.length > 0) {
      // Add popular countries
      popularCountries.forEach(country => {
        addCountryOption(country, countryDropdown);
      });
      
      // Add separator
      const separator = document.createElement('div');
      separator.style.borderBottom = '1px solid #e0e0e0';
      separator.style.margin = '5px 0';
      countryDropdown.appendChild(separator);
    }
    
    // Add all countries alphabetically
    countries
      .filter(country => !popularCountryCodes.includes(country.code))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(country => {
        addCountryOption(country, countryDropdown);
      });
    
    // Set default country to US
    setSelectedCountry({
      code: 'us',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸'
    });
    
    console.log('Countries dropdown populated successfully');
  } catch (err) {
    console.error('Error populating countries dropdown:', err);
  }
}

// Helper function to add a country option to the dropdown
function addCountryOption(country, container) {
  const option = document.createElement('div');
  option.className = 'country-option';
  option.setAttribute('data-code', country.dialCode);
  option.setAttribute('data-country', country.code);
  option.setAttribute('data-flag', country.flag);
  
  option.innerHTML = `
    <div class="country-option-flag">${country.flag}</div>
    <div class="country-option-name">${country.name}</div>
    <div class="country-option-code">${country.dialCode}</div>
  `;
  
  option.addEventListener('click', function() {
    setSelectedCountry(country);
    const countryDropdown = document.getElementById('country-dropdown');
    const countrySelect = document.getElementById('country-select');
    countryDropdown.classList.remove('show');
    countryDropdown.style.display = 'none';
    countrySelect.classList.remove('active');
  });
  
  container.appendChild(option);
}

// Helper function to set the selected country
function setSelectedCountry(country) {
  const countrySelect = document.getElementById('country-select');
  const countryCodeInput = document.getElementById('country-code-input');
  
  const countryFlag = countrySelect.querySelector('.country-flag');
  const countryCode = countrySelect.querySelector('.country-code');
  
  countryFlag.textContent = country.flag;
  countryCode.textContent = country.dialCode;
  countryCodeInput.value = country.dialCode;
  
  // Update full phone number
  updateFullPhoneNumber();
}

// Function to update the full phone number
function updateFullPhoneNumber() {
  const phoneInput = document.getElementById('phone-number');
  const countryCodeInput = document.getElementById('country-code-input');
  const fullPhoneInput = document.getElementById('full-phone');
  
  const phoneNumber = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
  
  if (phoneNumber) {
    fullPhoneInput.value = `${countryCodeInput.value}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
  } else {
    fullPhoneInput.value = '';
  }
}

// Format phone number as user types (US format by default)
function formatPhoneNumberInput(input) {
  // Get only digits from input
  let digits = input.value.replace(/\D/g, '');
  
  // Don't format if empty
  if (!digits) {
    input.value = '';
    return;
  }
  
  // Format based on length
  if (digits.length <= 3) {
    input.value = digits;
  } else if (digits.length <= 6) {
    input.value = digits.slice(0, 3) + '-' + digits.slice(3);
  } else {
    input.value = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
  }
  
  // Limit to 10 digits (plus formatting)
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
    input.value = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  }
}

// Set up event handlers
function setupEventHandlers() {
  const countrySelect = document.getElementById('country-select');
  const countryDropdown = document.getElementById('country-dropdown');
  const phoneInput = document.getElementById('phone-number');
  
  // Toggle country dropdown
  countrySelect.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isVisible = countryDropdown.classList.contains('show');
    
    if (isVisible) {
      countryDropdown.classList.remove('show');
      countryDropdown.style.display = 'none';
      this.classList.remove('active');
    } else {
      countryDropdown.style.display = 'block';
      // Use setTimeout to ensure display:block takes effect before adding the show class
      setTimeout(() => {
        countryDropdown.classList.add('show');
        this.classList.add('active');
      }, 10);
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!countrySelect.contains(e.target) && !countryDropdown.contains(e.target)) {
      countryDropdown.classList.remove('show');
      countryDropdown.style.display = 'none';
      countrySelect.classList.remove('active');
    }
  });
  
  // Update full phone when phone input changes
  phoneInput.addEventListener('input', function() {
    formatPhoneNumberInput(this);
    updateFullPhoneNumber();
  });
  
  // Add focus/blur events to phone input to style country select
  phoneInput.addEventListener('focus', function() {
    countrySelect.classList.add('phone-focused');
  });
  
  phoneInput.addEventListener('blur', function() {
    countrySelect.classList.remove('phone-focused');
  });
}