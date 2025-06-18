/**
 * Profile page functionality
 * Handles user profile creation, photo upload, and data management
 * Integrates with Supabase for data storage and retrieval
 */
import { supabaseClientPromise } from './supabase-client.js';
import { initProgressIndicator } from './components/progress-indicator.js';
import { getCurrentUser } from './auth.js';
import { isNotEmpty, isValidLength, isValidEmail, isValidUsername, isValidAge, validationConfig, showValidationFeedback } from './utils/validation.js';
import { countries } from './data/countries.js';

// Session storage key for profile data during onboarding
const PROFILE_STORAGE_KEY = 'userProfile';

// Load Leaflet map library
function loadMapScript() {
  // Check if Leaflet is already loaded
  if (window.L) return;
  
  // Check if we're already loading Leaflet
  if (document.getElementById('leaflet-css') || document.getElementById('leaflet-js')) return;
  
  // Add Leaflet CSS
  const leafletCSS = document.createElement('link');
  leafletCSS.id = 'leaflet-css';
  leafletCSS.rel = 'stylesheet';
  leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  leafletCSS.crossOrigin = '';
  document.head.appendChild(leafletCSS);
  
  // Add Leaflet JS
  const leafletJS = document.createElement('script');
  leafletJS.id = 'leaflet-js';
  leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  leafletJS.crossOrigin = '';
  document.head.appendChild(leafletJS);
  
  console.log('Leaflet scripts loaded');
}

export async function initProfilePage() {
  // Progress indicator removed
  
  // Load validation CSS
  if (!document.getElementById('form-validation-css')) {
    const link = document.createElement('link');
    link.id = 'form-validation-css';
    link.rel = 'stylesheet';
    link.href = '/css/form-validation.css';
    document.head.appendChild(link);
  }
  
  // Load country dropdown CSS
  if (!document.getElementById('country-dropdown-css')) {
    const link = document.createElement('link');
    link.id = 'country-dropdown-css';
    link.rel = 'stylesheet';
    link.href = '/css/country-dropdown.css';
    document.head.appendChild(link);
  }
  
  // DOM elements
  const profileImage = document.getElementById('profile-image');
  const cameraBtn = document.querySelector('.camera-btn');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const phoneInput = document.getElementById('phone-number');
  const countrySelect = document.getElementById('country-select');
  const countryDropdown = document.getElementById('country-dropdown');
  const countryCodeInput = document.getElementById('country-code');
  const fullPhoneInput = document.getElementById('full-phone');
  const birthdayBtn = document.getElementById('birthday-btn');
  const locationBtn = document.querySelector('.location-btn');
  const confirmBtn = document.getElementById('confirm-btn');
  const skipBtn = document.querySelector('.skip-btn');
  
  // Initialize country picker
  if (countrySelect && countryDropdown) {
    console.log('Initializing country picker');
    
    // Populate country dropdown with all countries
    populateCountryDropdown();
    
    // Toggle dropdown
    countrySelect.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Country select clicked');
      countryDropdown.style.display = countryDropdown.style.display === 'none' ? 'block' : 'none';
      
      // If opening the dropdown, focus the search input
      if (countryDropdown.style.display === 'block') {
        const searchInput = document.getElementById('country-search-input');
        if (searchInput) {
          // Small delay to ensure the dropdown is visible
          setTimeout(() => {
            searchInput.focus();
          }, 50);
        }
      }
    });
    
    // Prevent dropdown from closing when clicking inside it
    countryDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Prevent dropdown from closing when typing in search
    countryDropdown.addEventListener('keydown', function(e) {
      e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      // Only close if the click is outside the country select and dropdown
      if (!countrySelect.contains(e.target) && !countryDropdown.contains(e.target)) {
        countryDropdown.classList.remove('show');
      }
    });
    
    // Function to populate country dropdown
    function populateCountryDropdown() {
      // Clear existing options
      countryDropdown.innerHTML = '';
      
      // Add search input at the top
      const searchContainer = document.createElement('div');
      searchContainer.className = 'country-search-container';
      searchContainer.style.padding = '8px';
      searchContainer.style.position = 'sticky';
      searchContainer.style.top = '0';
      searchContainer.style.backgroundColor = 'white';
      searchContainer.style.zIndex = '2';
      searchContainer.style.borderBottom = '1px solid #eee';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search countries...';
      searchInput.className = 'country-search';
      searchInput.style.width = '100%';
      searchInput.style.padding = '8px';
      searchInput.style.border = '1px solid #ddd';
      searchInput.style.borderRadius = '4px';
      searchInput.style.fontSize = '14px';
      
      searchContainer.appendChild(searchInput);
      countryDropdown.appendChild(searchContainer);
      
      // Add all countries
      countries.forEach(country => {
        const option = document.createElement('div');
        option.className = 'country-option';
        option.setAttribute('data-country', country.code);
        option.setAttribute('data-code', country.dialCode);
        option.setAttribute('data-flag', country.flag);
        
        option.innerHTML = `
          <div class="country-flag">${country.flag}</div>
          <div class="country-name">${country.name}</div>
          <div class="country-code">${country.dialCode}</div>
        `;
        
        // Add click event listener
        option.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Country option clicked:', this.getAttribute('data-country'));
          
          const countryCode = this.getAttribute('data-code');
          const countryFlag = this.getAttribute('data-flag');
          
          // Update the selected country display
          const selectedFlag = countrySelect.querySelector('.country-flag');
          const selectedCode = countrySelect.querySelector('.country-code');
          
          if (selectedFlag && selectedCode) {
            selectedFlag.textContent = countryFlag;
            selectedCode.textContent = countryCode;
            
            // Update hidden input
            if (countryCodeInput) {
              countryCodeInput.value = countryCode;
              
              // Update full phone number
              updateFullPhoneNumber();
            }
          }
          
          // Hide dropdown immediately
          countryDropdown.style.display = 'none';
        });
        
        countryDropdown.appendChild(option);
      });
      
      // Add search functionality
      searchInput.addEventListener('input', function(e) {
        // Stop propagation to prevent dropdown from closing
        e.stopPropagation();
        
        const searchTerm = this.value.toLowerCase();
        const options = countryDropdown.querySelectorAll('.country-option');
        
        options.forEach(option => {
          const countryName = option.querySelector('.country-name').textContent.toLowerCase();
          const countryCode = option.getAttribute('data-country').toLowerCase();
          const dialCode = option.querySelector('.country-code').textContent.toLowerCase();
          
          if (countryName.includes(searchTerm) ||
              countryCode.includes(searchTerm) ||
              dialCode.includes(searchTerm)) {
            option.style.display = 'flex';
          } else {
            option.style.display = 'none';
          }
        });
      });
      
      // Prevent dropdown from closing when clicking in search input
      searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
    
    // Update full phone when phone input changes
    phoneInput.addEventListener('input', updateFullPhoneNumber);
    
    // Function to update the full phone number with country code
    function updateFullPhoneNumber() {
      const countryCode = countryCodeInput.value;
      const phoneNumber = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
      
      if (phoneNumber) {
        fullPhoneInput.value = `${countryCode}${phoneNumber}`;
      } else {
        fullPhoneInput.value = '';
      }
      
      // Update profile data
      if (profileData) {
        profileData.phoneNumber = phoneInput.value;
        profileData.countryCode = countryCode;
        profileData.fullPhone = fullPhoneInput.value;
        localStorage.setItem('userProfile', JSON.stringify(profileData));
      }
    }
  }

  // State variables
  let selectedBirthday = null;
  let selectedLocation = null;
  let profileData = {};
  let fileToUpload = null;
  let mapInstance = null;
  let currentUser = null;
  let isNewUser = true;
  
  // Create status message container
  const statusContainer = document.createElement('div');
  statusContainer.className = 'status-container';
  statusContainer.style.display = 'none';
  statusContainer.style.padding = '10px';
  statusContainer.style.marginTop = '10px';
  statusContainer.style.borderRadius = '8px';
  statusContainer.style.textAlign = 'center';
  confirmBtn.parentNode.insertBefore(statusContainer, confirmBtn);

  // Check if user is logged in and load profile data
  try {
    // First try to get user from Supabase auth
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      console.log('User authenticated:', user.id);
      
      // Try to load existing profile data from Supabase
      const loadedProfile = await loadProfileData(user.id);
      if (loadedProfile) {
        isNewUser = false;
        showStatus('Loaded existing profile data', 'success');
        console.log('Loaded existing profile:', loadedProfile);
      } else {
        isNewUser = true;
        console.log('No existing profile found, creating new profile');
      }
    }
  } catch (err) {
    console.log('No authenticated user found, creating new profile', err);
    
    // Check if we have profile data in localStorage from sign-up flow
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (storedProfile) {
      try {
        profileData = JSON.parse(storedProfile);
        console.log('Found profile data in localStorage:', profileData);
        populateFormFromProfileData(profileData);
      } catch (parseErr) {
        console.error('Error parsing stored profile data:', parseErr);
      }
    }
  }
  
  // Load Leaflet map script for location selection
  loadMapScript();

  // Format phone number as user types
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      const x = e.target.value.replace(/\D/g, '').match(/([0-9]{0,3})([0-9]{0,3})([0-9]{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
  }

  // Create a single reusable file input for photo upload
  let fileInput = null;
  let isFileInputActive = false;
  
  // Photo upload functionality with improved preview and validation
  if (cameraBtn) {
    cameraBtn.addEventListener('click', function() {
      // Prevent multiple file inputs from being created
      if (isFileInputActive) {
        console.log('File input already active, ignoring click');
        return;
      }
      
      // Clean up any existing file inputs
      const existingInputs = document.querySelectorAll('input[type="file"].profile-upload');
      existingInputs.forEach(input => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      });
      
      // Create a hidden file input
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.capture = 'user'; // Prefer front camera on mobile
      fileInput.style.display = 'none';
      fileInput.className = 'profile-upload'; // Add class for easy selection
      document.body.appendChild(fileInput);
      
      // Set flag to prevent multiple dialogs
      isFileInputActive = true;
      
      // Add event listener for cancel/close dialog
      window.addEventListener('focus', function onFocus() {
        // Short delay to allow for file selection to complete
        setTimeout(() => {
          // If no files were selected, clean up
          if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
            cleanupFileInput();
          }
          // Remove this event listener
          window.removeEventListener('focus', onFocus);
        }, 300);
      });
      
      // Trigger click on the file input
      fileInput.click();
      
      // Handle file selection
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            showStatus('Image too large. Please select an image under 5MB', 'error');
            cleanupFileInput();
            return;
          }
          
          // Validate file type
          if (!file.type.match('image.*')) {
            showStatus('Please select a valid image file', 'error');
            cleanupFileInput();
            return;
          }
          
          fileToUpload = file;
          showStatus('Photo selected', 'success');
          
          // Preview the image with better error handling
          const reader = new FileReader();
          reader.onload = function(e) {
            profileImage.src = e.target.result;
            // Store in profile data
            profileData.avatar_preview = e.target.result;
            // Save to localStorage for persistence
            saveToLocalStorage();
            // Clean up after successful read
            cleanupFileInput();
          };
          reader.onerror = function() {
            showStatus('Error reading file', 'error');
            cleanupFileInput();
          };
          reader.readAsDataURL(file);
        } else {
          // No file selected
          cleanupFileInput();
        }
      });
    });
  }
  
  // Helper function to clean up file input
  function cleanupFileInput() {
    if (fileInput && document.body.contains(fileInput)) {
      document.body.removeChild(fileInput);
    }
    fileInput = null;
    isFileInputActive = false;
  }

  // Birthday date picker with improved UI
  if (birthdayBtn) {
    // birthdayBtn.addEventListener('click', function() {
    //   showDatePicker(function(date) {
    //     selectedBirthday = date;
    //     const formattedDate = formatDate(date);
    //     birthdayBtn.querySelector('span').textContent = formattedDate;
    //     birthdayBtn.classList.add('has-value');
        
    //     // Store in profile data
    //     profileData.birthday = date.toISOString();
    //     // Save to localStorage for persistence
    //     saveToLocalStorage();
    //   });
    // });
  }

  // Location picker with map integration
  if (locationBtn) {
    // Load Leaflet map script in advance
    loadMapScript();
    
    locationBtn.addEventListener('click', function() {
      // Show map modal for location selection
      showMapModal(function(location) {
        if (location) {
          selectedLocation = location;
          
          // Update location button text and style
          const locationText = location.name || 
            `Location set (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
          locationBtn.querySelector('span').textContent = locationText;
          locationBtn.classList.add('has-value');
          
          // Store latitude, longitude and location name in hidden fields if they exist
          const latitudeField = document.getElementById('latitude');
          const longitudeField = document.getElementById('longitude');
          const locationNameField = document.getElementById('location-name');
          
          if (latitudeField) latitudeField.value = location.latitude;
          if (longitudeField) longitudeField.value = location.longitude;
          if (locationNameField) locationNameField.value = location.name || '';
          
          // Update profile data
          profileData.location = location;
          profileData.latitude = location.latitude;
          profileData.longitude = location.longitude;
          profileData.locationName = location.name || '';
          localStorage.setItem('userProfile', JSON.stringify(profileData));
          
          console.log('Location selected:', location);
        }
      });
    });
  }

  // Skip button - store data in localStorage before skipping
  if (skipBtn) {
    skipBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Save current form data to localStorage before skipping
      const formData = collectFormData();
      if (formData) {
        saveToLocalStorage(formData);
      }
      
      // Navigate to next page
      window.location.href = '/profile-gender';
    });
  }

  // Confirm button with enhanced validation and data saving
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      // Collect and validate form data
      const formData = collectFormData();
      if (!formData) return; // Validation failed
      
      // Update UI to show saving state
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Saving...';
      showStatus('Saving your profile...', 'loading');
      
      try {
        // First save to localStorage for persistence across pages
        saveToLocalStorage(formData);
        
        // If user is authenticated, save to Supabase
        if (currentUser) {
          // Save profile data to Supabase
          await saveProfileData(formData);
          
          // Upload profile photo if selected
          if (fileToUpload) {
            const avatarUrl = await uploadProfilePhoto(fileToUpload);
            if (avatarUrl) {
              formData.avatar_url = avatarUrl;
              // Update localStorage with avatar URL
              saveToLocalStorage(formData);
            }
          }
          
          showStatus('Profile saved successfully!', 'success');
        } else {
          // No authenticated user yet, data is saved to localStorage only
          showStatus('Profile data saved locally', 'success');
        }
        
        // Short delay before redirecting to next step
        setTimeout(() => {
          window.location.href = '/profile-gender';
        }, 500);
      } catch (err) {
        console.error('Error saving profile:', err);
        showStatus('Failed to save profile. Please try again.', 'error');
        
        // Reset button state
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm';
      }
    });
  }
  
  // Helper function to collect and validate form data
  function collectFormData() {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phone = phoneInput.value.replace(/\D/g, '');
    let countryCode = '+1'; // Default to US
    
    // Get country code from the country picker if available
    if (countryCodeInput) {
      countryCode = countryCodeInput.value;
    }
    
    // Validation
    if (!firstName) {
      showStatus('Please enter your first name', 'error');
      firstNameInput.focus();
      return null;
    }
    
    if (!lastName) {
      showStatus('Please enter your last name', 'error');
      lastNameInput.focus();
      return null;
    }
    
    // Different countries have different phone number lengths
    // We'll do basic validation that it's not empty
    if (!phone) {
      showStatus('Please enter your phone number', 'error');
      phoneInput.focus();
      return null;
    }
    
    // Return validated data
    return {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      phoneNumber: phoneInput.value, // Store formatted phone
      countryCode: countryCode,      // Store country code separately
      fullPhone: `${countryCode}${phone}`, // Store full international number
      birthday: selectedBirthday ? selectedBirthday.toISOString() : null,
      location: selectedLocation,
      updated_at: new Date().toISOString()
    };
  }

  // Helper functions
  async function loadProfileData(userId) {
    try {
      const supabase = await supabaseClientPromise;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (data) {
        profileData = data;
        populateFormFromProfileData(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error loading profile data:', err);
      return null;
    }
  }

  // Populate form fields from profile data
  function populateFormFromProfileData(data) {
    // Populate form fields
    if (data.first_name) firstNameInput.value = data.first_name;
    if (data.last_name) lastNameInput.value = data.last_name;
    
    // Handle country code and phone number
    if (countrySelect && countryCodeInput) {
      // Set country code if available, default to +1 (US)
      const countryCode = data.countryCode || '+1';
      countryCodeInput.value = countryCode;
      
      // Find the country option with this code to get the flag
      let countryFlag = '🇺🇸'; // Default US flag
      const countryOption = document.querySelector(`.country-option[data-code="${countryCode}"]`);
      if (countryOption) {
        countryFlag = countryOption.getAttribute('data-flag');
      }
      
      // Update the UI
      const selectedFlag = countrySelect.querySelector('.country-flag');
      const selectedCode = countrySelect.querySelector('.country-code');
      if (selectedFlag && selectedCode) {
        selectedFlag.textContent = countryFlag;
        selectedCode.textContent = countryCode;
      }
    }
    
    // Format phone number
    if (data.phoneNumber || data.phone) {
      const phoneValue = data.phoneNumber || data.phone;
      const phoneDigits = phoneValue.replace(/\D/g, '');
      const x = phoneDigits.match(/([0-9]{0,3})([0-9]{0,3})([0-9]{0,4})/);
      phoneInput.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
      
      // Update full phone input
      if (fullPhoneInput && countryCodeInput) {
        const countryCode = countryCodeInput.value;
        fullPhoneInput.value = `${countryCode}${phoneDigits}`;
      }
    }
    
    // Set birthday if available
    if (data.birthday) {
      selectedBirthday = new Date(data.birthday);
      birthdayBtn.querySelector('span').textContent = formatDate(selectedBirthday);
      birthdayBtn.classList.add('has-value');
    }
    
    // Set location if available
    if (data.location) {
      selectedLocation = data.location;
      const locationText = data.location.name || 
        `Location set (${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)})`;
      locationBtn.querySelector('span').textContent = locationText;
      locationBtn.classList.add('has-value');
    }
    
    // Load profile image if available
    if (data.avatar_url) {
      loadProfileImage(data.avatar_url);
    }
  }

  // Save profile data to Supabase
  async function saveProfileData(data) {
    const supabase = await supabaseClientPromise;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user found');
      
      // Update or create profile
      const { error, data: savedData } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      console.log('Profile saved successfully:', savedData);
      return savedData;
    } catch (err) {
      console.error('Error saving profile data:', err);
      throw err;
    }
  }

  // Upload profile photo to Supabase storage
  async function uploadProfilePhoto(file) {
    const supabase = await supabaseClientPromise;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user found');
      
      // Compress image before uploading if it's too large
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        fileToUpload = await compressImage(file);
      }
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      showStatus('Uploading profile photo...', 'loading');
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileToUpload);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      if (!data || !data.publicUrl) throw new Error('Failed to get public URL');
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      showStatus('Profile photo uploaded!', 'success');
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      showStatus('Failed to upload photo', 'error');
      throw err;
    }
  }

  // Compress image before uploading
  async function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(blob => {
            if (blob) {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          }, 'image/jpeg', 0.7); // 0.7 quality gives good compression
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  // Load profile image with error handling
  function loadProfileImage(url) {
    // Create a new image to check if the URL is valid
    const img = new Image();
    img.onload = function() {
      profileImage.src = url;
    };
    img.onerror = function() {
      console.error('Failed to load profile image');
      // Keep default image
    };
    img.src = url;
  }

  // Save profile data to localStorage for persistence across pages
  function saveToLocalStorage(data = null) {
    const dataToSave = data || profileData;
    if (dataToSave) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Profile data saved to localStorage');
    }
  }

  // Show status message with different styles based on type
  function showStatus(message, type = 'info') {
    statusContainer.textContent = message;
    statusContainer.style.display = 'block';
    
    // Reset previous styles
    statusContainer.style.backgroundColor = '';
    statusContainer.style.color = '';
    
    // Apply styles based on type
    switch (type) {
      case 'error':
        statusContainer.style.backgroundColor = '#FFEBEE';
        statusContainer.style.color = '#F44336';
        break;
      case 'success':
        statusContainer.style.backgroundColor = '#E8F5E9';
        statusContainer.style.color = '#4CAF50';
        break;
      case 'loading':
        statusContainer.style.backgroundColor = '#E3F2FD';
        statusContainer.style.color = '#2196F3';
        break;
      default: // info
        statusContainer.style.backgroundColor = '#E3F2FD';
        statusContainer.style.color = '#2196F3';
    }
    
    // Hide after 5 seconds for non-loading messages
    if (type !== 'loading') {
      setTimeout(() => {
        statusContainer.style.display = 'none';
      }, 5000);
    }
  }
}

// Reference to the loadMapScript function defined at the top of the file

// Show map modal for location selection
function showMapModal(callback) {
  // Ensure Leaflet is loaded first
  loadMapScript();
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('map-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'map-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content map-modal-content">
        <h2>Select Location</h2>
        <div id="location-map" style="height: 300px; width: 100%; border-radius: 8px;"></div>
        <div class="location-info" style="margin: 10px 0; font-size: 14px;">
          <p>Click on the map to select your location or use your current location.</p>
          <p id="selected-location-text">No location selected</p>
        </div>
        <div class="modal-buttons">
          <button class="current-location-btn">Use Current Location</button>
          <br />
          <button class="cancel-btn">Cancel</button>
          <button class="confirm-btn" disabled>Confirm</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not already in document
    if (!document.getElementById('map-modal-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'map-modal-styles';
      styleEl.textContent = `
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }
        
        .modal.visible {
          opacity: 1;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s, transform 0.3s;
          width: 90%;
          max-width: 500px;
        }
        
        .modal.visible .modal-content {
          opacity: 1;
          transform: translateY(0);
        }
        
        .modal-buttons {
          display: block;
          justify-content: space-between;
          margin-top: 15px;
        }
        
        .modal-buttons button {
          padding: 8px 16px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        
        .current-location-btn {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .cancel-btn {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .confirm-btn {
          background-color: #F44B74;
          color: white;
        }
        
        .confirm-btn:disabled {
          background-color: #f0f0f0;
          color: #999;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Style the modal content for map
    const modalContent = modal.querySelector('.map-modal-content');
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '500px';
  }
  
  // Reset modal state
  const selectedLocationText = modal.querySelector('#selected-location-text');
  const confirmBtn = modal.querySelector('.confirm-btn');
  selectedLocationText.textContent = 'No location selected';
  confirmBtn.disabled = true;
  
  // Show modal
  modal.style.display = 'flex';
  
  setTimeout(() => {
    modal.classList.add('visible');
    initMap(modal, callback);
  }, 10);
}

// Initialize map in modal
function initMap(modal, callback) {
  // Wait for Leaflet to load
  const checkLeaflet = setInterval(() => {
    if (window.L) {
      clearInterval(checkLeaflet);
      
      const mapContainer = modal.querySelector('#location-map');
      const selectedLocationText = modal.querySelector('#selected-location-text');
      const confirmBtn = modal.querySelector('.confirm-btn');
      const cancelBtn = modal.querySelector('.cancel-btn');
      const currentLocationBtn = modal.querySelector('.current-location-btn');
      
      // Get existing profile data to check for saved location
      const profileData = JSON.parse(localStorage.getItem('userProfile')) || {};
      const savedLocation = profileData.location;
      
      // Set initial map view - use saved location if available
      let initialLat = 37.7749; // Default to San Francisco
      let initialLng = -122.4194;
      let initialZoom = 13;
      
      if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
        initialLat = savedLocation.latitude;
        initialLng = savedLocation.longitude;
        initialZoom = 15;
      }
      
      // Initialize map
      const map = L.map(mapContainer).setView([initialLat, initialLng], initialZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Store selected location
      let selectedLocation = savedLocation || null;
      let marker = null;
      
      // If we have a saved location, show it on the map
      if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
        marker = L.marker([savedLocation.latitude, savedLocation.longitude]).addTo(map);
        selectedLocationText.textContent = savedLocation.name ? 
          `Selected: ${savedLocation.name}` : 
          `Selected: (${savedLocation.latitude.toFixed(4)}, ${savedLocation.longitude.toFixed(4)})`;
        confirmBtn.disabled = false;
      }
      
      // Fix map display issue - force redraw after modal is visible
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
      
      // Add marker on click
      map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        
        // Remove existing marker
        if (marker) {
          map.removeLayer(marker);
        }
        
        // Add new marker
        marker = L.marker([lat, lng]).addTo(map);
        
        // Get location name using reverse geocoding
        selectedLocationText.textContent = 'Loading location info...';
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
          const data = await response.json();
          
          const locationName = data.address.city || data.address.town || data.address.village || 
                             data.address.county || data.address.state || 'Unknown location';
          selectedLocationText.textContent = `Selected: ${locationName}`;
          
          selectedLocation = {
            latitude: lat,
            longitude: lng,
            name: locationName,
            address: data.display_name
          };
        } catch (err) {
          console.error('Error getting location name:', err);
          selectedLocationText.textContent = `Selected: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          
          selectedLocation = {
            latitude: lat,
            longitude: lng
          };
        }
        
        // Enable confirm button
        confirmBtn.disabled = false;
      });
      
      // Use current location
      currentLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
          currentLocationBtn.textContent = 'Getting location...';
          currentLocationBtn.disabled = true;
          
          navigator.geolocation.getCurrentPosition(
            async function(position) {
              const { latitude, longitude } = position.coords;
              
              // Center map on user's location
              map.setView([latitude, longitude], 15);
              
              // Remove existing marker
              if (marker) {
                map.removeLayer(marker);
              }
              
              // Add new marker
              marker = L.marker([latitude, longitude]).addTo(map);
              
              // Get location name
              try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`);
                const data = await response.json();
                
                const locationName = data.address.city || data.address.town || data.address.village || 
                                   data.address.county || data.address.state || 'Unknown location';
                selectedLocationText.textContent = `Selected: ${locationName}`;
                
                selectedLocation = {
                  latitude,
                  longitude,
                  name: locationName,
                  address: data.display_name
                };
              } catch (err) {
                console.error('Error getting location name:', err);
                selectedLocationText.textContent = `Selected: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                
                selectedLocation = {
                  latitude,
                  longitude
                };
              }
              
              // Reset button
              currentLocationBtn.textContent = 'Use Current Location';
              currentLocationBtn.disabled = false;
              
              // Enable confirm button
              confirmBtn.disabled = false;
            },
            function(error) {
              console.error('Error getting location:', error);
              let errorMsg = 'Failed to get your location. ';
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg += 'Location permission denied.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg += 'Location information unavailable.';
                  break;
                case error.TIMEOUT:
                  errorMsg += 'Location request timed out.';
                  break;
                default:
                  errorMsg += 'Please try again or select on the map.';
              }
              
              selectedLocationText.textContent = errorMsg;
              
              // Reset button
              currentLocationBtn.textContent = 'Use Current Location';
              currentLocationBtn.disabled = false;
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          selectedLocationText.textContent = 'Geolocation is not supported by your browser.';
        }
      });
      
      // Confirm button
      confirmBtn.addEventListener('click', function() {
        modal.classList.remove('visible');
        
        setTimeout(() => {
          modal.style.display = 'none';
          
          if (selectedLocation) {
            callback(selectedLocation);
          }
        }, 300);
      });
      
      // Cancel button
      cancelBtn.addEventListener('click', function() {
        modal.classList.remove('visible');
        
        setTimeout(() => {
          modal.style.display = 'none';
        }, 300);
      });
    }
  }, 100);
}

// Format date as MM/DD/YYYY
function formatDate(date) {
  if (!date) return '';
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

// Show date picker modal
function showDatePicker(callback) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('date-picker-modanl');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'date-picker-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Select Birthday</h2>
        <input type="date" id="date-input">
        <div class="modal-buttons">
          <button class="cancel-btn">Cancel</button>
          <button class="confirm-btn">Confirm</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const dateInput = modal.querySelector('#date-input');
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    confirmBtn.addEventListener('click', function() {
      const selectedDate = new Date(dateInput.value);
      modal.classList.remove('visible');
      
      setTimeout(() => {
        modal.style.display = 'none';
        
        if (dateInput.value) {
          callback(selectedDate);
        }
      }, 300);
    });
    
    cancelBtn.addEventListener('click', function() {
      modal.classList.remove('visible');
      
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    });
  }
  
  // Set max date to today
  const dateInput = modal.querySelector('#date-input');
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 100); // 100 years ago
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 18); // 18 years ago
  
  dateInput.max = maxDate.toISOString().split('T')[0];
  dateInput.min = minDate.toISOString().split('T')[0];
  
  // Show modal
  modal.style.display = 'flex';
  
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);
}
