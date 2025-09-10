/**
 * Edit Profile Page Initialization
 */

// Global variables
let userId = null;
let userProfileData = null;
let selectedDate = null;
let selectedFile = null;

// Initialize the edit profile page
async function initEditProfilePage() {
  console.log('Initializing edit profile page...');
  
  // Initialize user data
  await initializeUser();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize date picker
  initDatePicker();
  
  // Initialize countries dropdown
  await populateCountries();
}

// Initialize user data from Supabase or localStorage
async function initializeUser() {
  try {
    // First try to get user ID from URL parameters (for testing/development)
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    if (urlUserId) {
      console.log('Using user ID from URL parameter:', urlUserId);
      userId = urlUserId;
      await loadUserProfile();
      return;
    }

    // Try to get user from localStorage first as it's faster
    const localUser = JSON.parse(localStorage.getItem('barcrush_user') || 'null');
    if (localUser && localUser.id) {
      console.log('Using user ID from localStorage:', localUser.id);
      userId = localUser.id;
      await loadUserProfile();
      return;
    }

    // If no localStorage user, try Supabase session
    const { supabaseClientPromise } = await import('./supabase-client.js');
    const supabase = await supabaseClientPromise;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      // Create a temporary user ID for testing if needed
      userId = 'temp-' + Math.random().toString(36).substring(2, 15);
      console.warn('Using temporary user ID for testing:', userId);
      await loadUserProfile();
    } else if (!session) {
      console.log('No active session found');
      // Create a temporary user ID for testing if needed
      userId = 'temp-' + Math.random().toString(36).substring(2, 15);
      console.warn('Using temporary user ID for testing:', userId);
      await loadUserProfile();
    } else {
      // User is authenticated
      userId = session.user.id;
      await loadUserProfile();
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    // Create a temporary user ID for testing if needed
    userId = 'temp-' + Math.random().toString(36).substring(2, 15);
    console.warn('Using temporary user ID for testing:', userId);
    await loadUserProfile();
  }
}

// Load user profile data from Supabase
async function loadUserProfile() {
  try {
    // Check if we're using a temporary user ID
    if (userId && userId.startsWith('temp-')) {
      console.log('Using temporary user ID, skipping profile fetch');
      userProfileData = {};
      populateFormWithUserData(userProfileData);
      return;
    }

    const { supabaseClientPromise } = await import('./supabase-client.js');
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      if (error.code === 'PGRST116') {
        // Profile doesn't exist yet, use empty data
        userProfileData = {};
        populateFormWithUserData(userProfileData);
        console.log('No existing profile found. Please fill in your information.');
        return;
      }
      throw error;
    }
    
    if (!data || Object.keys(data).length === 0) {
      // No data returned
      console.log('Could not load your profile information. Please fill in your details.');
      userProfileData = {};
      populateFormWithUserData(userProfileData);
      return;
    }
    
    console.log('Profile data loaded:', data);
    userProfileData = data;
    populateFormWithUserData(userProfileData);
  } catch (error) {
    console.error('Error loading profile data:', error);
    // Use empty data if loading fails
    userProfileData = {};
    populateFormWithUserData(userProfileData);
    console.log('Failed to load your profile information. Please fill in your details.');
  }
}

// Populate form with user data
function populateFormWithUserData(data) {
  console.log('Populating form with data:', data);
  
  // Set first name
  if (data.first_name) {
    document.getElementById('first-name').value = data.first_name;
  }
  
  // Set last name
  if (data.last_name) {
    document.getElementById('last-name').value = data.last_name;
  }
  
  // Set phone number
  if (data.phone_number) {
    document.getElementById('phone-number').value = data.phone_number;
  }
  
  // Set country code
  if (data.country_code) {
    document.getElementById('country-code-input').value = data.country_code;
    document.getElementById('selected-code').textContent = data.country_code;
  }
  
  // Set birthday
  if (data.birthday) {
    selectedDate = new Date(data.birthday);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('birthday-btn').querySelector('span').textContent = 
      selectedDate.toLocaleDateString('en-US', options);
    document.getElementById('birthday-btn').classList.add('has-value');
  }
  
  // Set location
  if (data.location) {
    document.getElementById('location-btn').querySelector('span').textContent = data.location;
    document.getElementById('location-btn').classList.add('has-value');
  }
  
  // Set profile image
  if (data.profile_image_url) {
    document.getElementById('profile-image').src = data.profile_image_url;
  }
}

// Set up event listeners for the form
function setupEventListeners() {
  // Photo upload
  const cameraBtn = document.querySelector('.camera-btn');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', function() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = handlePhotoUpload;
      fileInput.click();
    });
  }

  // Location button
  const locationBtn = document.getElementById('location-btn');
  if (locationBtn) {
    locationBtn.addEventListener('click', handleLocationSelection);
  }

  // Confirm button
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', saveUserProfile);
  }

  // Country dropdown
  const countrySelect = document.getElementById('country-select');
  if (countrySelect) {
    countrySelect.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const countryDropdown = document.getElementById('country-dropdown');
      const isVisible = countryDropdown.style.display === 'block';
      
      if (isVisible) {
        countryDropdown.style.display = 'none';
        this.classList.remove('active');
      } else {
        countryDropdown.style.display = 'block';
        this.classList.add('active');
      }
    });
  }

  // Close country dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const countryDropdown = document.getElementById('country-dropdown');
    const countrySelect = document.getElementById('country-select');
    if (countryDropdown && countrySelect && !countrySelect.contains(event.target) && !countryDropdown.contains(event.target)) {
      countryDropdown.style.display = 'none';
      countrySelect.classList.remove('active');
    }
  });
}

// Handle photo upload
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return;
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB.');
    return;
  }

  selectedFile = file;
  
  // Preview the image
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('profile-image').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Handle location selection
async function handleLocationSelection() {
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get location name
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await response.json();
        const location = `${data.city}, ${data.countryName}`;
        document.getElementById('location-btn').querySelector('span').textContent = location;
        document.getElementById('location-btn').classList.add('has-value');
      } catch (error) {
        console.error('Error getting location name:', error);
        const location = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        document.getElementById('location-btn').querySelector('span').textContent = location;
        document.getElementById('location-btn').classList.add('has-value');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to manual entry
      const location = prompt('Please enter your location:');
      if (location) {
        document.getElementById('location-btn').querySelector('span').textContent = location;
        document.getElementById('location-btn').classList.add('has-value');
      }
    }
  } else {
    // Geolocation not supported, use manual entry
    const location = prompt('Please enter your location:');
    if (location) {
      document.getElementById('location-btn').querySelector('span').textContent = location;
      document.getElementById('location-btn').classList.add('has-value');
    }
  }
}

// Save user profile
async function saveUserProfile() {
  const confirmBtn = document.getElementById('confirm-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Saving...';

  try {
    // Validate required fields
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    
    if (!firstName || !lastName) {
      alert('Please fill in your first and last name.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
      return;
    }

    // Prepare profile data
    const profileData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      phone_number: document.getElementById('phone-number').value,
      country_code: document.getElementById('country-code-input').value,
      location: document.getElementById('location-btn').querySelector('span').textContent,
      updated_at: new Date().toISOString()
    };

    // Add birthday if selected
    if (selectedDate) {
      profileData.birthday = selectedDate.toISOString().split('T')[0];
    }

    console.log('Saving profile data:', profileData);

    // Check if we're using a temporary user ID
    if (userId && userId.startsWith('temp-')) {
      console.log('Using temporary user ID, saving to localStorage instead of database');
      // Save to localStorage instead
      localStorage.setItem('temp_profile_data', JSON.stringify(profileData));
      
      // Handle image separately
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
          localStorage.setItem('temp_profile_image', e.target.result);
        };
        reader.readAsDataURL(selectedFile);
      }
      
      // Success feedback
      confirmBtn.textContent = 'Saved!';
      setTimeout(() => {
        window.location.href = '/discover';
      }, 1000);
      return;
    }

    // If not using a temporary ID, save to Supabase
    const { supabaseClientPromise } = await import('./supabase-client.js');
    const supabase = await supabaseClientPromise;

    // Show saving indicator
    const savingIndicator = document.createElement('div');
    savingIndicator.className = 'saving-indicator';
    savingIndicator.innerHTML = `
      <div class="saving-spinner"></div>
      <div class="saving-text">Saving to Supabase...</div>
    `;
    savingIndicator.style.position = 'fixed';
    savingIndicator.style.top = '20px';
    savingIndicator.style.right = '20px';
    savingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    savingIndicator.style.color = 'white';
    savingIndicator.style.padding = '10px 20px';
    savingIndicator.style.borderRadius = '5px';
    savingIndicator.style.zIndex = '9999';
    savingIndicator.style.display = 'flex';
    savingIndicator.style.alignItems = 'center';
    savingIndicator.style.gap = '10px';
    
    // Add spinner animation styles
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      .saving-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);
    
    document.body.appendChild(savingIndicator);

    try {
      // Upload profile image if selected
      if (selectedFile) {
        console.log('Uploading profile image to Supabase storage...');
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        
        // Update saving indicator
        savingIndicator.querySelector('.saving-text').textContent = 'Uploading image...';
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile, { upsert: true });
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        } else {
          console.log('Image uploaded successfully, getting public URL...');
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          profileData.profile_image_url = publicUrl;
          console.log('Image public URL:', publicUrl);
        }
      }

      // Update saving indicator
      savingIndicator.querySelector('.saving-text').textContent = 'Saving profile data...';

      // Update profile in database
      console.log('Saving profile data to Supabase:', profileData);
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { returning: 'minimal' });

      if (error) {
        throw error;
      }
      
      console.log('Profile data saved successfully');
      
      // Update saving indicator to show success
      savingIndicator.style.backgroundColor = '#4CAF50';
      savingIndicator.querySelector('.saving-text').textContent = 'Profile updated successfully!';
      
      // Remove the indicator after a delay
      setTimeout(() => {
        if (document.body.contains(savingIndicator)) {
          document.body.removeChild(savingIndicator);
        }
      }, 2000);
    } catch (error) {
      console.error('Error in Supabase operations:', error);
      
      // Update saving indicator to show error
      savingIndicator.style.backgroundColor = '#F44336';
      savingIndicator.querySelector('.saving-text').textContent = `Error: ${error.message || 'Failed to save profile'}`;
      
      // Remove the indicator after a delay
      setTimeout(() => {
        if (document.body.contains(savingIndicator)) {
          document.body.removeChild(savingIndicator);
        }
      }, 3000);
      
      throw error;
    }

    // Success feedback
    confirmBtn.textContent = 'Saved!';
    setTimeout(() => {
      window.location.href = '/discover';
    }, 1000);

  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Error saving profile. Please try again.');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm';
  }
}

// Populate countries dropdown
async function populateCountries() {
  try {
    // Try to import countries from data directory first
    let countries;
    try {
      const module = await import('./data/countries.js');
      countries = module.countries;
    } catch (e) {
      // Fallback to direct import
      const module = await import('./countries.js');
      countries = module.countries;
    }
    
    const dropdown = document.querySelector('.country-list-container');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    countries.forEach(country => {
      const option = document.createElement('div');
      option.className = 'country-option';
      option.innerHTML = `
        <span class="country-flag">${country.flag}</span>
        <span class="country-name">${country.name}</span>
        <span class="country-code">${country.dialCode}</span>
      `;
      option.addEventListener('click', () => selectCountry(country));
      dropdown.appendChild(option);
    });

    // Setup country search functionality
    const searchInput = document.getElementById('country-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const countryOptions = dropdown.querySelectorAll('.country-option');
        
        countryOptions.forEach(option => {
          const countryName = option.querySelector('.country-name').textContent.toLowerCase();
          if (countryName.includes(searchTerm)) {
            option.style.display = 'flex';
          } else {
            option.style.display = 'none';
          }
        });
      });
    }
  } catch (error) {
    console.error('Error loading countries:', error);
  }
}

// Select country
function selectCountry(country) {
  document.getElementById('selected-flag').textContent = country.flag;
  document.getElementById('selected-code').textContent = country.dialCode;
  document.getElementById('country-code-input').value = country.dialCode;
  document.getElementById('country-dropdown').style.display = 'none';
}

// Date picker functions
function initDatePicker() {
  // Initialize date picker when needed
  window.showDatePicker = function() {
    console.log('showDatePicker called');
    const datePickerModal = document.getElementById('birthday-picker-modal');
    if (datePickerModal) {
      datePickerModal.style.display = 'flex';
      // Use a timeout to trigger the animation after display is set
      setTimeout(() => {
        datePickerModal.classList.add('visible');
      }, 10);
      renderCalendarDays();
    } else {
      console.error('Date picker modal not found');
    }
  };

  // Toggle year selector
  window.toggleYearSelector = function() {
    const yearSelector = document.getElementById('year-selector');
    const monthSelector = document.getElementById('month-selector');
    const calendarGrid = document.getElementById('calendar-grid');
    const saveBtn = document.getElementById('save-date-btn');
    
    // Hide month selector if visible
    monthSelector.classList.remove('active');
    
    // Toggle year selector
    if (yearSelector.classList.contains('active')) {
      yearSelector.classList.remove('active');
      calendarGrid.style.display = 'grid';
      // Show the save button again
      saveBtn.style.display = 'block';
    } else {
      yearSelector.classList.add('active');
      calendarGrid.style.display = 'none';
      // Hide the save button
      saveBtn.style.display = 'none';
      populateYears();
    }
  };

  // Toggle month selector
  window.toggleMonthSelector = function() {
    const yearSelector = document.getElementById('year-selector');
    const monthSelector = document.getElementById('month-selector');
    const calendarGrid = document.getElementById('calendar-grid');
    const saveBtn = document.getElementById('save-date-btn');
    
    // Close year selector if open
    yearSelector.classList.remove('active');
    
    if (monthSelector.classList.contains('active')) {
      monthSelector.classList.remove('active');
      calendarGrid.style.display = 'grid';
      // Show the save button again
      saveBtn.style.display = 'block';
    } else {
      monthSelector.classList.add('active');
      calendarGrid.style.display = 'none';
      // Hide the save button
      saveBtn.style.display = 'none';
      populateMonths();
    }
  };

  // Close modal
  window.closeModal = function() {
    const modal = document.getElementById('birthday-picker-modal');
    modal.classList.remove('visible');
    
    // Wait for animation to finish before hiding
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300); // Match the CSS transition duration
  };

  // Save date selection
  window.saveDateSelection = function() {
    const birthdayBtn = document.getElementById('birthday-btn');
    
    if (selectedDate) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const birthdayBtnText = birthdayBtn.querySelector('span');
      birthdayBtnText.textContent = selectedDate.toLocaleDateString('en-US', options);
      birthdayBtn.classList.add('has-value');
      birthdayBtn.setAttribute('data-birthday', selectedDate.toISOString().split('T')[0]);
    }
    
    window.closeModal();
  };

  // Initialize calendar
  if (!selectedDate) {
    // Default to 18 years ago
    const today = new Date();
    selectedDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  // Set up event handlers for calendar days
  setupCalendarEventHandlers();
}

// Populate years for date picker
function populateYears() {
  const container = document.getElementById('year-scroll-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 100; year <= currentYear; year++) {
    const yearItem = document.createElement('div');
    yearItem.className = 'year-item';
    if (selectedDate && selectedDate.getFullYear() === year) {
      yearItem.classList.add('selected');
    }
    yearItem.textContent = year;
    yearItem.onclick = () => selectYear(year);
    container.appendChild(yearItem);
  }
}

// Populate months for date picker
function populateMonths() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
  const container = document.getElementById('month-scroll-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  months.forEach((month, index) => {
    const monthItem = document.createElement('div');
    monthItem.className = 'month-item';
    if (selectedDate && selectedDate.getMonth() === index) {
      monthItem.classList.add('selected');
    }
    monthItem.textContent = month;
    monthItem.onclick = () => selectMonth(index);
    container.appendChild(monthItem);
  });
}

// Select year
function selectYear(year) {
  selectedDate.setFullYear(year);
  updateDateDisplay();
  renderCalendarDays();
  window.toggleYearSelector();
}

// Select month
function selectMonth(month) {
  selectedDate.setMonth(month);
  updateDateDisplay();
  renderCalendarDays();
  window.toggleMonthSelector();
}

// Update date display
function updateDateDisplay() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('selected-year').textContent = selectedDate.getFullYear();
  document.getElementById('selected-month').textContent = months[selectedDate.getMonth()];
}

// Render calendar days
function renderCalendarDays() {
  const calendar = document.getElementById('calendar-grid');
  if (!calendar) return;
  
  calendar.innerHTML = '';
  
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    calendar.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    dayElement.textContent = day;
    
    if (selectedDate && selectedDate.getDate() === day) {
      dayElement.classList.add('selected');
    }
    
    dayElement.onclick = () => selectDay(day);
    calendar.appendChild(dayElement);
  }
}

// Select day
function selectDay(day) {
  selectedDate.setDate(day);
  
  // Update UI
  document.querySelectorAll('.day').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Find the clicked day and add selected class
  const dayElements = document.querySelectorAll('.day');
  for (let i = 0; i < dayElements.length; i++) {
    if (parseInt(dayElements[i].textContent) === day) {
      dayElements[i].classList.add('selected');
      break;
    }
  }
}

// Set up calendar event handlers
function setupCalendarEventHandlers() {
  // Set up event handlers for the save and cancel buttons
  const saveBtn = document.getElementById('save-date-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', window.saveDateSelection);
  }
  
  const cancelBtn = document.getElementById('cancel-date-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', window.closeModal);
  }
}

// Export the initialization function
window.initEditProfilePage = initEditProfilePage;

// Auto-initialize if not loaded through the router
if (document.readyState === 'complete') {
  initEditProfilePage();
} else {
  window.addEventListener('DOMContentLoaded', initEditProfilePage);
}
