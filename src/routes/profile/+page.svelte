<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // Form data
  let firstName = '';
  let lastName = '';
  let phoneNumber = '';
  let selectedCountry = {
    code: 'us',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸'
  };
  let selectedBirthday = null;
  let selectedLocation = null;
  let profileImageSrc = '/images/default-profile.png';

  // UI state
  let showCountryDropdown = false;
  let showDatePicker = false;
  let currentYear = new Date().getFullYear() - 18;
  let currentMonth = new Date().getMonth();
  let selectedDate = null;

  // Countries data (simplified for demo)
  const countries = [
    { code: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'ca', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'au', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'de', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'fr', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'jp', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'kr', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' }
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  function handleSkip() {
    // Navigate to next step or home
    goto('/');
  }

  function handleProfileImageClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          profileImageSrc = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
    input.click();
  }

  function selectCountry(country) {
    selectedCountry = country;
    showCountryDropdown = false;
    formatPhoneNumber();
  }

  function formatPhoneNumber() {
    // Format phone number based on country (US format for demo)
    let digits = phoneNumber.replace(/\D/g, '');
    if (digits.length <= 3) {
      phoneNumber = digits;
    } else if (digits.length <= 6) {
      phoneNumber = digits.slice(0, 3) + '-' + digits.slice(3);
    } else {
      phoneNumber = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
    }
  }

  function handlePhoneInput(e) {
    phoneNumber = e.target.value;
    formatPhoneNumber();
  }

  function showBirthdayPicker() {
    showDatePicker = true;
  }

  function closeDatePicker() {
    showDatePicker = false;
  }

  function selectDate(day) {
    selectedDate = new Date(currentYear, currentMonth, day);
  }

  function saveBirthday() {
    if (selectedDate) {
      selectedBirthday = selectedDate;
    }
    closeDatePicker();
  }

  function formatBirthday(date) {
    if (!date) return 'Choose birthday date';
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  function handleLocationClick() {
    // TODO: Implement location picker
    alert('Location picker not implemented yet');
  }

  function handleConfirm() {
    if (!firstName || !lastName) {
      alert('Please fill in all required fields');
      return;
    }

    const profileData = {
      firstName,
      lastName,
      phoneNumber: `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`,
      birthday: selectedBirthday?.toISOString().split('T')[0],
      location: selectedLocation,
      profileImage: profileImageSrc
    };

    console.log('Profile data:', profileData);
    
    // Navigate to next step (gender selection or home)
    goto('/profile-gender');
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function generateYears() {
    const years = [];
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 18; // Legal age requirement
    const minYear = currentYear - 100;
    
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }
    return years;
  }

  onMount(() => {
    // Initialize with current date minus 18 years
    const today = new Date();
    currentYear = today.getFullYear() - 18;
    currentMonth = today.getMonth();
  });
</script>

<svelte:head>
  <title>BarCrush - Profile Setup</title>
</svelte:head>

<div class="profile-container">
  <div class="profile-header">
    <h1>Profile info</h1>
    <button class="skip-btn" on:click={handleSkip}>Skip</button>
  </div>
  
  <div class="profile-photo-container">
    <div class="profile-photo">
      <img src={profileImageSrc} alt="Profile Photo" />
      <button class="camera-btn" on:click={handleProfileImageClick}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div class="profile-photo-text">Profile Photo</div>
  </div>
  
  <div class="profile-form">
    <div class="input-group">
      <label for="first-name">First name</label>
      <input type="text" id="first-name" bind:value={firstName} placeholder="Jane" />
    </div>
    
    <div class="input-group">
      <label for="last-name">Last name</label>
      <input type="text" id="last-name" bind:value={lastName} placeholder="Doe" />
    </div>

    <div class="input-group">
      <label for="phone-number">Phone number</label>
      <div class="phone-input-container">
        <div class="country-select" class:active={showCountryDropdown}>
          <button class="selected-country" on:click={() => showCountryDropdown = !showCountryDropdown}>
            <div class="country-flag">{selectedCountry.flag}</div>
            <div class="country-code">{selectedCountry.dialCode}</div>
            <div class="dropdown-arrow">▼</div>
          </button>
          {#if showCountryDropdown}
            <div class="country-dropdown">
              <div class="country-list-container">
                {#each countries as country}
                  <button class="country-option" on:click={() => selectCountry(country)}>
                    <div class="country-option-flag">{country.flag}</div>
                    <div class="country-option-name">{country.name}</div>
                    <div class="country-option-code">{country.dialCode}</div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <input 
          type="tel" 
          id="phone-number" 
          bind:value={phoneNumber}
          on:input={handlePhoneInput}
          placeholder="123-456-7890" 
          class="phone-input" 
        />
      </div>
    </div>
    
    <button class="option-btn birthday-btn" class:has-value={selectedBirthday} on:click={showBirthdayPicker}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 2V6" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 2V6" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 10H21" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{formatBirthday(selectedBirthday)}</span>
    </button>
    
    <button class="option-btn location-btn" on:click={handleLocationClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Choose your location</span>
    </button>
    
    <button class="confirm-btn" on:click={handleConfirm}>Confirm</button>
  </div>
</div>

<!-- Date Picker Modal -->
{#if showDatePicker}
  <div class="date-picker-modal" class:visible={showDatePicker}>
    <div class="date-picker-container">
      <div class="handle-bar"></div>
      <h2>Birthday</h2>
      
      <div class="year-month-selector">
        <div class="selected-year">{currentYear}</div>
        <div class="selected-month">{monthNames[currentMonth]}</div>
      </div>
      
      <div class="calendar-grid">
        {#each Array(getDaysInMonth(currentYear, currentMonth)) as _, i}
          <button 
            class="day" 
            class:selected={selectedDate && selectedDate.getDate() === i + 1}
            on:click={() => selectDate(i + 1)}
          >
            {i + 1}
          </button>
        {/each}
      </div>
      
      <button class="save-btn" on:click={saveBirthday}>Save</button>
    </div>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
  
  .profile-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    background-color: var(--bg-color, #fff);
    font-family: 'Roboto', sans-serif;
    padding: 16px;
    padding-top: 0;
    box-sizing: border-box;
  }
  
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-top: 16px;
  }
  
  .profile-header h1 {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
    color: var(--text-color, #333);
  }
  
  .skip-btn {
    color: #F44B74;
    font-size: 14px;
    font-weight: 400;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .profile-photo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .profile-photo {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f3f3f3;
    margin-bottom: 8px;
    border: 1px solid #eaeaea;
  }
  
  .profile-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-photo-text {
    font-size: 13px;
    color: var(--muted-text, #888);
    text-align: center;
  }
  
  .camera-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #F44B74;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    padding: 0;
  }
  
  .camera-btn svg {
    width: 14px;
    height: 14px;
  }
  
  .profile-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
  }
  
  .input-group {
    margin-bottom: 15px;
  }
  
  .input-group label {
    display: block;
    font-size: 12px;
    color: var(--muted-text, #888);
    margin-bottom: 4px;
  }
  
  .input-group input {
    width: 100%;
    height: 42px;
    border-radius: 8px;
    border: 1px solid var(--border-color, #e0e0e0);
    padding: 0 15px;
    font-size: 16px;
    box-sizing: border-box;
    color: var(--text-color, #333);
    background-color: var(--bg-color, #fff);
  }

  .phone-input-container {
    display: flex;
    gap: 8px;
  }

  .country-select {
    position: relative;
    flex-shrink: 0;
  }

  .selected-country {
    display: flex;
    align-items: center;
    height: 42px;
    padding: 0 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    background: var(--bg-color, #fff);
    cursor: pointer;
    gap: 6px;
  }

  .country-flag {
    font-size: 16px;
  }

  .country-code {
    font-size: 14px;
    color: var(--text-color, #333);
  }

  .dropdown-arrow {
    font-size: 10px;
    color: var(--muted-text, #888);
  }

  .country-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-color, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
  }

  .country-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    gap: 8px;
    text-align: left;
  }

  .country-option:hover {
    background-color: var(--hover-bg, #f5f5f5);
  }

  .country-option-flag {
    font-size: 16px;
  }

  .country-option-name {
    flex: 1;
    font-size: 14px;
    color: var(--text-color, #333);
  }

  .country-option-code {
    font-size: 12px;
    color: var(--muted-text, #888);
  }

  .phone-input {
    flex: 1;
  }
  
  .option-btn {
    display: flex;
    align-items: center;
    width: 100%;
    height: 44px;
    border-radius: 8px;
    border: none;
    background-color: var(--secondary-bg, #f9f9f9);
    margin-bottom: 12px;
    padding: 0 15px;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    box-shadow: none;
  }
  
  .option-btn svg {
    margin-right: 10px;
    width: 18px;
    height: 18px;
  }
  
  .birthday-btn span {
    color: #F44B74;
  }
  
  .option-btn.has-value {
    background-color: rgba(248, 92, 138, 0.05);
    border: 1px solid rgba(248, 92, 138, 0.1);
  }
  
  .location-btn span {
    color: var(--text-color, #333);
  }
  
  .confirm-btn {
    width: 100%;
    height: 44px;
    border-radius: 22px;
    border: none;
    background-color: #F44B74;
    color: white;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 30px;
    box-shadow: 0 2px 8px rgba(248, 92, 138, 0.3);
  }

  /* Date Picker Styles */
  .date-picker-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .date-picker-container {
    background-color: var(--bg-color, white);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 100%;
    padding: 24px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
  }
  
  .date-picker-modal.visible .date-picker-container {
    transform: translateY(0);
  }
  
  .handle-bar {
    width: 40px;
    height: 4px;
    background-color: #ddd;
    border-radius: 2px;
    margin-bottom: 16px;
  }

  .date-picker-container h2 {
    font-size: 18px;
    color: var(--text-color, #333);
    margin: 0 0 20px;
    font-weight: 500;
    text-align: center;
  }
  
  .year-month-selector {
    display: block;
    width: 100%;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .selected-year {
    font-size: 20px;
    font-weight: 700;
    color: #F44B74;
    margin-bottom: 4px;
  }
  
  .selected-month {
    font-size: 22px;
    color: #F44B74;
    font-weight: 400;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    width: 100%;
    margin-bottom: 30px;
  }
  
  .day {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
    border-radius: 50%;
    color: var(--text-color, #333);
    border: none;
    background: none;
  }
  
  .day:hover {
    background-color: var(--hover-bg, #f0f0f0);
  }
  
  .day.selected {
    background-color: #F44B74;
    color: white;
  }
  
  .save-btn {
    width: 100%;
    height: 50px;
    border-radius: 25px;
    border: none;
    background-color: #F44B74;
    color: white;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 10px;
    box-shadow: 0 4px 10px rgba(248, 92, 138, 0.3);
  }
  
  @media (max-width: 600px) {
    .profile-header h1 {
      font-size: 17px;
    }
  }
</style>