console.log('🔥 SCRIPT DEBUG: matching-controller.js is being loaded!');

/**
 * BarCrush Matching Controller
 * 
 * Handles the matching functionality including:
 * - Loading potential matches
 * - Handling like/dislike actions
 * - Displaying the match screen when a match occurs
 * - Managing navigation to chat when a match is accepted
 */

import { 
  getPotentialMatches, 
  likeProfile, 
  dislikeProfile,
  getMatches
} from './api/matches.js';
import { getCurrentUser } from './api/supabase-client.js';
import supabase from './api/supabase-client.js';

// Store for matching data
let currentUser = null;
let potentialMatches = [];
let currentCardIndex = 0;
let cardStack = null;
let matchesSubscription = null;

/**
 * Create a demo session for testing
 */
async function createDemoSession() {
  try {
    console.log('🔧 DEMO: Creating session for demo@barcrush.app...');
    
    // Try different demo account passwords that might have been used
    const possiblePasswords = ['demo123', 'demo12345', 'demo'];
    
    // Try each password for the demo account
    for (const password of possiblePasswords) {
      try {
        console.log(`🔧 DEMO: Trying to sign in with password: ${password}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'demo@barcrush.app',
          password: password
        });
        
        if (!error) {
          console.log('✅ DEMO: Demo user signed in successfully');
          return data.user;
        } else {
          console.log(`🔧 DEMO: Password "${password}" didn't work: ${error.message}`);
        }
      } catch (e) {
        console.log(`🔧 DEMO: Error trying password "${password}": ${e.message}`);
      }
    }
    
    // Try alternate demo account with phone number
    try {
      console.log('🔧 DEMO: Trying to sign in with phone OTP...');
      
      const phone = '+15555555555';
      const token = '123456'; // Known good demo token
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone, 
        token,
        type: 'sms'
      });
      
      if (!error) {
        console.log('✅ DEMO: Demo phone user verified successfully');
        return data.user;
      } else {
        console.log('🔧 DEMO: Phone verification failed:', error.message);
      }
    } catch (e) {
      console.log('🔧 DEMO: Error with phone verification:', e.message);
    }
    
    // Set demo account flag and return simple mock user
    console.log('🔧 DEMO: All authentication methods failed, using localStorage flag');
    localStorage.setItem('demo_account', 'true');
    
    return null;
  } catch (error) {
    console.error('❌ DEMO: Error creating demo session:', error);
    return null;
  }
}

/**
 * Initialize the matching page
 */
async function initMatching() {
  // Get current user
  currentUser = await getCurrentUser();
  
  // If no current user, try to create demo session
  if (!currentUser) {
    currentUser = await createDemoSession();
  }
  
  if (!currentUser) {
    // Redirect to login if no valid session can be created
    window.location.href = '/phone-login';
    return;
  }
  
  // Set up UI elements
  cardStack = document.getElementById('card-stack');
  
  if (!cardStack) {
    console.error('Card stack element not found!');
    return;
  }
  
  // Load potential matches
  await loadPotentialMatches();
  
  // Set up event listeners
  setupEventListeners();
  
  // Subscribe to real-time match updates
  subscribeToMatches();
  
  console.log('Matching page initialized');
}

/**
 * Load potential matches from the API
 */
async function loadPotentialMatches() {
  try {
    // Get potential matches from the API
    const options = {
      limit: 20,
      offset: 0,
      distance: 50
    };
    
    potentialMatches = await getPotentialMatches(options);
    
    // Reset the current card index
    currentCardIndex = 0;
    
    // Render the card stack
    renderCardStack();
    
    console.log('Loaded potential matches:', potentialMatches.length);
  } catch (error) {
    console.error('Error loading potential matches:', error);
  }
}

/**
 * Render the card stack with potential matches
 */
function renderCardStack() {
  if (!cardStack) {
    console.error('Card stack element not found!');
    return;
  }
  
  // Clear the card stack
  cardStack.innerHTML = '';
  
  // If no potential matches, show empty state
  if (potentialMatches.length === 0) {
    showEmptyState();
    return;
  }
  
  // Create cards for each potential match
  potentialMatches.forEach((profile, index) => {
    const card = createProfileCard(profile, index);
    cardStack.appendChild(card);
  });
  
  // Initialize the current card
  updateCurrentCard();
}

/**
 * Create a profile card element
 */
function createProfileCard(profile, index) {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.index = index;
  
  // Calculate distance in miles
  const distance = profile.distance ? `${Math.round(profile.distance)} miles away` : 'Unknown distance';
  
  // Determine if card is active
  const isActive = index === currentCardIndex;
  if (!isActive) {
    card.style.display = 'none';
  }
  
  // Get primary image URL
  const imageUrl = profile.images && profile.images.length > 0 
    ? profile.images[0] 
    : '/images/default-avatar.jpg';
  
  card.innerHTML = `
    <div class="card-image" style="background-image: url('${imageUrl}')">
      <div class="card-overlay">
        <div class="profile-info">
          <div class="profile-name-age">
            <h2>${profile.display_name || 'Unknown'}, ${profile.age || '??'}</h2>
            <p>${distance}</p>
          </div>
          <div class="profile-bio">
            <p>${profile.bio || ''}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="like-badge" style="display: none;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <path d="M4.5 12.5L10 18L19.5 8.5" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="dislike-badge" style="display: none;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18" stroke="#FF3B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="#FF3B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;
  
  return card;
}

/**
 * Show empty state when no more potential matches are available
 */
function showEmptyState() {
  if (!cardStack) return;
  
  cardStack.innerHTML = `
    <div class="empty-matches">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="var(--color-primary-light)" stroke="var(--color-primary)" stroke-width="2"/>
        </svg>
      </div>
      <h3>No More Matches</h3>
      <p>We're finding new people near you. Check back later!</p>
      <button class="refresh-button" onclick="loadPotentialMatches()">Refresh</button>
    </div>
  `;
}

/**
 * Update the current visible card
 */
function updateCurrentCard() {
  // Hide all cards
  const allCards = document.querySelectorAll('.profile-card');
  allCards.forEach(card => {
    card.style.display = 'none';
  });
  
  // Show current card if it exists
  if (currentCardIndex < potentialMatches.length) {
    const currentCard = document.querySelector(`.profile-card[data-index="${currentCardIndex}"]`);
    if (currentCard) {
      currentCard.style.display = 'block';
    } else {
      console.error('Current card element not found!');
    }
  } else {
    // No more cards, show empty state
    showEmptyState();
  }
}

/**
 * Handle like action for current profile
 */
async function handleLike() {
  if (currentCardIndex >= potentialMatches.length) return;
  
  const currentProfile = potentialMatches[currentCardIndex];
  const currentCard = document.querySelector(`.profile-card[data-index="${currentCardIndex}"]`);
  
  try {
    // Show like badge
    if (currentCard) {
      const likeBadge = currentCard.querySelector('.like-badge');
      if (likeBadge) {
        likeBadge.style.display = 'flex';
      }
    }
    
    // Send like to API
    const result = await likeProfile(currentProfile.id);
    
    // Check if it's a match
    if (result && result.isMatch) {
      // It's a match! Show match screen
      showMatchScreen(currentProfile);
    } else {
      // Move to the next card after a delay
      setTimeout(() => {
        currentCardIndex++;
        updateCurrentCard();
      }, 500);
    }
  } catch (error) {
    console.error('Error handling like:', error);
    
    // Still move to the next card
    setTimeout(() => {
      currentCardIndex++;
      updateCurrentCard();
    }, 500);
  }
}

/**
 * Handle dislike action for current profile
 */
async function handleDislike() {
  if (currentCardIndex >= potentialMatches.length) return;
  
  const currentProfile = potentialMatches[currentCardIndex];
  const currentCard = document.querySelector(`.profile-card[data-index="${currentCardIndex}"]`);
  
  try {
    // Show dislike badge
    if (currentCard) {
      const dislikeBadge = currentCard.querySelector('.dislike-badge');
      if (dislikeBadge) {
        dislikeBadge.style.display = 'flex';
      }
    }
    
    // Send dislike to API
    await dislikeProfile(currentProfile.id);
    
    // Move to the next card after a delay
    setTimeout(() => {
      currentCardIndex++;
      updateCurrentCard();
    }, 500);
  } catch (error) {
    console.error('Error handling dislike:', error);
    
    // Still move to the next card
    setTimeout(() => {
      currentCardIndex++;
      updateCurrentCard();
    }, 500);
  }
}

/**
 * Show the match screen with profile data
 */
function showMatchScreen(matchedProfile) {
  const matchScreen = document.getElementById('match-screen');
  if (!matchScreen) return;
  
  // Hide card stack
  if (cardStack) {
    cardStack.style.display = 'none';
  }
  
  // Update match screen with profile data
  const userAvatar = matchScreen.querySelector('.user-avatar img');
  if (userAvatar) {
    userAvatar.src = currentUser.avatar_url || '/images/default-avatar.jpg';
    userAvatar.alt = currentUser.display_name || 'You';
  }
  
  const matchAvatar = matchScreen.querySelector('.match-avatar img');
  if (matchAvatar) {
    matchAvatar.src = matchedProfile.avatar_url || '/images/default-avatar.jpg';
    matchAvatar.alt = matchedProfile.display_name || 'Match';
  }
  
  const matchTitle = matchScreen.querySelector('.match-message h1');
  if (matchTitle) {
    matchTitle.textContent = `It's a match, ${matchedProfile.display_name || 'there'}!`;
  }
  
  // Store matched profile ID for navigation
  matchScreen.dataset.profileId = matchedProfile.id;
  
  // Show match screen
  matchScreen.style.display = 'flex';
}

/**
 * Hide the match screen and continue matching
 */
function hideMatchScreen() {
  const matchScreen = document.getElementById('match-screen');
  if (!matchScreen) return;
  
  // Hide match screen
  matchScreen.style.display = 'none';
  
  // Show card stack
  if (cardStack) {
    cardStack.style.display = 'block';
  }
  
  // Move to the next card
  currentCardIndex++;
  updateCurrentCard();
}

/**
 * Navigate to chat with the matched user
 */
function navigateToChat(profileId) {
  if (!profileId) return;
  
  // In a real app, we would create or get an existing conversation
  // For now, we'll just navigate to the chat page
  window.location.href = `/views/chat.html`;
}

/**
 * Subscribe to new matches
 */
function subscribeToMatches() {
  if (!currentUser) return;
  
  // Unsubscribe from previous subscription if exists
  if (matchesSubscription) {
    supabase.removeSubscription(matchesSubscription);
  }
  
  // Subscribe to new matches
  matchesSubscription = supabase
    .channel(`public:matches:user_id_eq_${currentUser.id}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'matches',
      filter: `user_id=eq.${currentUser.id}`
    }, (payload) => {
      handleNewMatch(payload.new);
    })
    .subscribe();
}

/**
 * Handle a new match event
 */
async function handleNewMatch(matchData) {
  try {
    // Get the matched profile
    const matchedProfileId = matchData.matched_user_id;
    
    // Find the matched profile in the potential matches
    const matchedProfile = potentialMatches.find(profile => profile.id === matchedProfileId);
    
    if (matchedProfile) {
      // Show match screen with the matched profile
      showMatchScreen(matchedProfile);
    }
  } catch (error) {
    console.error('Error handling new match:', error);
  }
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Like button
  const likeButton = document.getElementById('like-button');
  if (likeButton) {
    likeButton.addEventListener('click', handleLike);
  }
  
  // Dislike button
  const dislikeButton = document.getElementById('dislike-button');
  if (dislikeButton) {
    dislikeButton.addEventListener('click', handleDislike);
  }
  
  // Say hello button (on match screen)
  const sayHelloButton = document.getElementById('say-hello-button');
  if (sayHelloButton) {
    sayHelloButton.addEventListener('click', () => {
      const matchScreen = document.getElementById('match-screen');
      const profileId = matchScreen ? matchScreen.dataset.profileId : null;
      navigateToChat(profileId);
    });
  }
  
  // Keep swiping button (on match screen)
  const keepSwipingButton = document.getElementById('keep-swiping-button');
  if (keepSwipingButton) {
    keepSwipingButton.addEventListener('click', hideMatchScreen);
  }
}

// Initialize when DOM is loaded (fallback for direct page loads)
document.addEventListener('DOMContentLoaded', initMatching);

// Expose initMatching as window.initMatchingPage for router compatibility
window.initMatchingPage = initMatching;

console.log('🔥 SCRIPT DEBUG: window.initMatchingPage exposed:', typeof window.initMatchingPage);

// Export functions for external use
export { 
  initMatching, 
  handleLike, 
  handleDislike, 
  showMatchScreen, 
  hideMatchScreen 
};
