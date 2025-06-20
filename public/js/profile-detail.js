/**
 * profile-detail.js
 * Handle functionality for the profile detail view
 */

// Initialize the profile detail page
export async function initProfileDetail() {
  console.log('Initializing profile detail page');
  setupBackNavigation();
  setupActionButtons();
}

// Set up back button navigation
function setupBackNavigation() {
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      console.log('Back button clicked');
      history.back();
    });
  }
}

// Set up like and dislike buttons
function setupActionButtons() {
  const likeButton = document.querySelector('.action-button.like');
  const dislikeButton = document.querySelector('.action-button.dislike');
  
  if (likeButton) {
    likeButton.addEventListener('click', () => {
      console.log('Profile liked');
      animateLike();
      setTimeout(() => history.back(), 500);
    });
  }
  
  if (dislikeButton) {
    dislikeButton.addEventListener('click', () => {
      console.log('Profile disliked');
      animateDislike();
      setTimeout(() => history.back(), 500);
    });
  }
}

// Animate like button when clicked
function animateLike() {
  const likeButton = document.querySelector('.action-button.like');
  if (likeButton) {
    likeButton.classList.add('animate-like');
    setTimeout(() => {
      likeButton.classList.remove('animate-like');
    }, 500);
  }
}

// Animate dislike button when clicked
function animateDislike() {
  const dislikeButton = document.querySelector('.action-button.dislike');
  if (dislikeButton) {
    dislikeButton.classList.add('animate-dislike');
    setTimeout(() => {
      dislikeButton.classList.remove('animate-dislike');
    }, 500);
  }
}

// Load profile data from a specific profile ID
export async function loadProfileData(profileId) {
  // This would fetch the profile from an API in a real app
  console.log(`Loading profile data for ID: ${profileId}`);
  
  // For now, return static data matching the design
  return {
    id: profileId || '1',
    name: 'Camila Snow',
    age: 23,
    location: 'DALLAS, UNITED STATES',
    distance: '2.5 m',
    about: 'A good listener. I love having a good talk to know each other\'s side 😊.',
    interests: [
      { icon: '🌿', name: 'Nature' },
      { icon: '🌎', name: 'Travel' },
      { icon: '✍️', name: 'Writing' },
      { icon: '👥', name: 'People' }
    ],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop'
  };
}

// Initialize when DOM is loaded if we're not in a module context
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initProfileDetail);
}
