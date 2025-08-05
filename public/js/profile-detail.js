/**
 * profile-detail.js
 * Handle functionality for the profile detail view
 */
import { getProfileById } from './api/profiles.js';

// Initialize the profile detail page
export async function initProfileDetail() {
  console.log('Initializing profile detail page');
  setupBackNavigation();
  setupActionButtons();
  
  // Get profile ID from URL or sessionStorage
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  
  if (profileId) {
    try {
      // First try to get from sessionStorage if available
      let profileData = null;
      const storedProfile = sessionStorage.getItem('profile_detail_data');
      
      if (storedProfile) {
        try {
          profileData = JSON.parse(storedProfile);
          console.log('Profile data retrieved from sessionStorage:', profileData);
        } catch (e) {
          console.error('Error parsing profile data from sessionStorage:', e);
        }
      }
      
      // If no data in sessionStorage, fetch from API
      if (!profileData) {
        console.log('Fetching profile data from API for ID:', profileId);
        profileData = await getProfileById(profileId);
      }
      
      // Update the UI with the profile data
      if (profileData) {
        updateProfileUI(profileData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  } else {
    console.error('No profile ID provided in URL');
  }
}

// Set up back button navigation
function setupBackNavigation() {
  const backButton = document.querySelector('.back-btn');
  if (backButton) {
    backButton.addEventListener('click', () => {
      console.log('Back button clicked');
      history.back();
    });
  }
}

// Set up like and dislike buttons
function setupActionButtons() {
  const likeButton = document.querySelector('.btn-like');
  const dislikeButton = document.querySelector('.btn-dislike');
  
  if (likeButton) {
    likeButton.addEventListener('click', () => {
      const profileId = likeButton.dataset.profileId;
      console.log('Profile liked:', profileId);
      animateLike();
      
      // Here you would call your API to record the like
      // likeProfile(profileId);
      
      setTimeout(() => history.back(), 500);
    });
  }
  
  if (dislikeButton) {
    dislikeButton.addEventListener('click', () => {
      const profileId = dislikeButton.dataset.profileId;
      console.log('Profile disliked:', profileId);
      animateDislike();
      
      // Here you would call your API to record the dislike
      // dislikeProfile(profileId);
      
      setTimeout(() => history.back(), 500);
    });
  }
}

// Animate like button when clicked
function animateLike() {
  const likeButton = document.querySelector('.btn-like');
  if (likeButton) {
    likeButton.classList.add('animate-like');
    setTimeout(() => {
      likeButton.classList.remove('animate-like');
    }, 500);
  }
}

// Animate dislike button when clicked
function animateDislike() {
  const dislikeButton = document.querySelector('.btn-dislike');
  if (dislikeButton) {
    dislikeButton.classList.add('animate-dislike');
    setTimeout(() => {
      dislikeButton.classList.remove('animate-dislike');
    }, 500);
  }
}

// Update the UI with profile data
function updateProfileUI(profile) {
  console.log('Updating profile UI with data:', profile);
  
  // Update profile image
  const profileImg = document.querySelector('.profile-bg-img');
  if (profileImg && profile.avatar_url) {
    profileImg.src = profile.avatar_url;
  }
  
  // Update name and age
  const nameElement = document.querySelector('.profile-header-name');
  if (nameElement) {
    // Calculate age if we have a birthdate
    let age = '';
    if (profile.birthdate) {
      const birthDate = new Date(profile.birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      // Adjust age if birthday hasn't occurred yet this year
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      age = `, ${age}`;
    }
    
    nameElement.textContent = `${profile.full_name || 'Unknown'}${age}`;
  }
  
  // Update location
  const locationElement = document.querySelector('.profile-header-location');
  if (locationElement) {
    locationElement.textContent = profile.location ? profile.location.toUpperCase() : 'LOCATION UNKNOWN';
  }
  
  // Update distance
  const distanceElement = document.querySelector('.distance-pill span');
  if (distanceElement) {
    // Calculate distance if available, otherwise use placeholder
    distanceElement.textContent = profile.distance || '< 1 mi';
  }
  
  // Update about section
  const aboutElement = document.querySelector('.section-body');
  if (aboutElement) {
    aboutElement.textContent = profile.bio || 'No bio available';
  }
  
  // Update interests
  const interestsContainer = document.querySelector('.interest-tags');
  if (interestsContainer && profile.interests && profile.interests.length > 0) {
    // Clear existing interests
    interestsContainer.innerHTML = '';
    
    // Add new interests
    profile.interests.forEach(interest => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      
      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = interest.icon || '🔍';
      
      tag.appendChild(emoji);
      tag.appendChild(document.createTextNode(` ${interest.name || interest}`));
      
      interestsContainer.appendChild(tag);
    });
  }
  
  // Set up like/dislike actions with profile ID
  const likeButton = document.querySelector('.btn-like');
  const dislikeButton = document.querySelector('.btn-dislike');
  
  if (likeButton) {
    likeButton.dataset.profileId = profile.id;
  }
  
  if (dislikeButton) {
    dislikeButton.dataset.profileId = profile.id;
  }
}

// Load profile data from a specific profile ID
export async function loadProfileData(profileId) {
  try {
    return await getProfileById(profileId);
  } catch (error) {
    console.error(`Error loading profile ${profileId}:`, error);
    // Return placeholder data if API fails
    return {
      id: profileId || '1',
      full_name: 'Unknown User',
      bio: 'Profile information unavailable',
      interests: [{ name: 'Unknown' }],
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop'
    };
  }
}

// Initialize when DOM is loaded if we're not in a module context
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initProfileDetail);
}
