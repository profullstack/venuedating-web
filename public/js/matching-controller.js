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
  likeUser, 
  dislikeUser,
  getUserMatches
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
  const loadingSpinner = document.getElementById('loading-spinner');
  const cardStack = document.getElementById('card-stack');
  
  try {
    // Show loading spinner
    if (loadingSpinner) {
      loadingSpinner.style.display = 'flex';
    }
    if (cardStack) {
      cardStack.style.display = 'none';
    }
    
    console.log('🔄 Loading potential matches...');
    
    // Get potential matches from the API
    const options = {
      limit: 20,
      offset: 0,
      distance: 50
    };
    
    potentialMatches = await getPotentialMatches(options);
    
    console.log('✅ Loaded potential matches:', potentialMatches.length, potentialMatches);
    
    // Reset the current card index
    currentCardIndex = 0;
    
    // Hide loading spinner
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    if (cardStack) {
      cardStack.style.display = 'block';
    }
    
    // Render the card stack
    renderCardStack();
    
  } catch (error) {
    console.error('❌ Error loading potential matches:', error);
    
    // Hide loading spinner on error
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    if (cardStack) {
      cardStack.style.display = 'block';
    }
    
    // Show error state
    showErrorState(error.message || 'Failed to load matches');
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
 * Calculate age from birth_date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Create a profile card element
 */
function createProfileCard(profile, index) {
  const card = document.createElement('div');
  card.className = 'match-card';
  card.dataset.index = index;
  
  console.log('Creating card for profile:', profile.full_name, 'Avatar URL:', profile.avatar_url);
  
  // Calculate distance in miles
  const distance = profile.distance ? `${Math.round(profile.distance)} miles away` : 'Unknown distance';
  
  // Calculate age from birth_date
  const age = profile.age;
  
  // Set up card stacking - show up to 3 cards in stack
  const stackPosition = index - currentCardIndex;
  
  if (stackPosition < 0) {
    // Cards that have been swiped - hide them
    card.style.display = 'none';
  } else if (stackPosition < 3) {
    // Cards in the visible stack (current + next 2)
    card.style.display = 'block';
    card.style.position = 'absolute';
    card.style.top = '0';
    card.style.left = '0';
    card.style.width = '100%';
    card.style.height = '100%';
    
    // Stack layering - current card on top
    card.style.zIndex = 100 - stackPosition;
    
    // Subtle offset and scale for cards behind
    if (stackPosition > 0) {
      const offset = stackPosition * 4;
      const scale = 1 - (stackPosition * 0.02);
      card.style.transform = `translateY(${offset}px) scale(${scale})`;
      card.style.opacity = 1 - (stackPosition * 0.1);
    }
  } else {
    // Cards too far back - hide them
    card.style.display = 'none';
  }
  
  // Get avatar URL from API response
  const imageUrl = profile.avatar_url || '/images/default-avatar.jpg';
  
  // Set the background image
  card.style.backgroundImage = `url('${imageUrl}')`;
  card.style.backgroundSize = 'cover';
  card.style.backgroundPosition = 'center';
  card.style.backgroundRepeat = 'no-repeat';
  
  card.innerHTML = `
    <!-- Distance badge -->
    <div class="card-distance">
      <span class="distance-text">${distance}</span>
    </div>
    
    <!-- Card info section -->
    <div class="card-info">
      <h2 class="profile-name">${profile.full_name || 'Unknown'}${age ? `, ${age}` : ''}</h2>
      <p class="venue-name">${profile.bio || 'Looking for connections'}</p>
    </div>
    
    <!-- Like/Dislike badges -->
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
    <div class="empty-state">
      <div class="empty-icon">💔</div>
      <h3>No more matches</h3>
      <p>Check back later for new people!</p>
      <button class="refresh-button" onclick="location.reload()">Refresh</button>
    </div>
  `;
  
  console.log('Showing empty state - no more potential matches');
}

/**
 * Show error state when loading matches fails
 */
function showErrorState(errorMessage) {
  if (!cardStack) return;
  
  cardStack.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>${errorMessage}</p>
      <button class="retry-button" onclick="location.reload()">Try Again</button>
    </div>
  `;
  
  console.log('Showing error state:', errorMessage);
}

/**
 * Update the current visible card stack
 */
function updateCurrentCard() {
  const allCards = document.querySelectorAll('.match-card');
  
  // Check if we have more cards
  if (currentCardIndex >= potentialMatches.length) {
    // No more cards, show empty state
    showEmptyState();
    return;
  }
  
  // Update all cards to reflect new stack positions
  allCards.forEach((card, index) => {
    const cardIndex = parseInt(card.dataset.index);
    const stackPosition = cardIndex - currentCardIndex;
    
    if (stackPosition < 0) {
      // Cards that have been swiped - hide them
      card.style.display = 'none';
    } else if (stackPosition < 3) {
      // Cards in the visible stack (current + next 2)
      card.style.display = 'block';
      card.style.position = 'absolute';
      card.style.top = '0';
      card.style.left = '0';
      card.style.width = '100%';
      card.style.height = '100%';
      
      // Stack layering - current card on top
      card.style.zIndex = 100 - stackPosition;
      
      // Reset any transforms from swiping
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      
      // Subtle offset and scale for cards behind
      if (stackPosition > 0) {
        const offset = stackPosition * 4;
        const scale = 1 - (stackPosition * 0.02);
        card.style.transform = `translateY(${offset}px) scale(${scale})`;
        card.style.opacity = 1 - (stackPosition * 0.1);
      } else {
        // Current card - no offset
        card.style.transform = 'translateY(0) scale(1)';
        card.style.opacity = '1';
      }
    } else {
      // Cards too far back - hide them
      card.style.display = 'none';
    }
  });
  
  console.log(`🃏 Updated card stack - showing card ${currentCardIndex + 1} of ${potentialMatches.length}`);
}

/**
 * Handle like action for current profile
 */
async function handleLike() {
  if (currentCardIndex >= potentialMatches.length) return;
  
  const currentProfile = potentialMatches[currentCardIndex];
  const currentCard = document.querySelector(`.match-card[data-index="${currentCardIndex}"]`);
  
  try {
    console.log('👍 Liking profile:', currentProfile.display_name || currentProfile.id);
    
    // Show like badge
    if (currentCard) {
      const likeBadge = currentCard.querySelector('.like-badge');
      if (likeBadge) {
        likeBadge.style.display = 'flex';
        likeBadge.style.opacity = '1';
      }
    }
    
    // Send like to API
    const result = await likeUser(currentProfile.id);
    
    // Check if it's a match
    if (result && result.isMatch) {
      console.log('🎉 It\'s a match!', result);
      // It's a match! Show match screen
      showMatchScreen(currentProfile);
    } else {
      console.log('👍 Like sent, no match yet');
      // Card transition is handled by animateCardExit in swipe gesture
    }
  } catch (error) {
    console.error('❌ Error handling like:', error);
    // Card transition is handled by animateCardExit in swipe gesture
  }
}

/**
 * Handle dislike action for current profile
 */
async function handleDislike() {
  if (currentCardIndex >= potentialMatches.length) return;
  
  const currentProfile = potentialMatches[currentCardIndex];
  const currentCard = document.querySelector(`.match-card[data-index="${currentCardIndex}"]`);
  
  try {
    console.log('👎 Disliking profile:', currentProfile.display_name || currentProfile.id);
    
    // Show dislike badge
    if (currentCard) {
      const dislikeBadge = currentCard.querySelector('.dislike-badge');
      if (dislikeBadge) {
        dislikeBadge.style.display = 'flex';
        dislikeBadge.style.opacity = '1';
      }
    }
    
    // Send dislike to API
    await dislikeUser(currentProfile.id);
    
    console.log('👎 Dislike sent');
    
    // Card transition is handled by animateCardExit in swipe gesture
  } catch (error) {
    console.error('❌ Error handling dislike:', error);
    // Card transition is handled by animateCardExit in swipe gesture
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
  
  // Set up swipe gestures for cards
  setupSwipeGestures();
}

/**
 * Set up swipe gesture handlers for cards
 */
function setupSwipeGestures() {
  if (!cardStack) return;
  
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isDragging = false;
  let currentCard = null;
  
  // Touch events for mobile
  cardStack.addEventListener('touchstart', handleTouchStart, { passive: false });
  cardStack.addEventListener('touchmove', handleTouchMove, { passive: false });
  cardStack.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Mouse events for desktop
  cardStack.addEventListener('mousedown', handleMouseDown);
  cardStack.addEventListener('mousemove', handleMouseMove);
  cardStack.addEventListener('mouseup', handleMouseUp);
  cardStack.addEventListener('mouseleave', handleMouseUp);
  
  function handleTouchStart(e) {
    if (currentCardIndex >= potentialMatches.length) return;
    
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = startX;
    currentY = startY;
    isDragging = true;
    
    currentCard = document.querySelector(`.match-card[data-index="${currentCardIndex}"]`);
    if (currentCard) {
      currentCard.style.transition = 'none';
    }
    
    e.preventDefault();
  }
  
  function handleTouchMove(e) {
    if (!isDragging || !currentCard) return;
    
    const touch = e.touches[0];
    currentX = touch.clientX;
    currentY = touch.clientY;
    
    updateCardPosition();
    e.preventDefault();
  }
  
  function handleTouchEnd(e) {
    if (!isDragging || !currentCard) return;
    
    handleSwipeEnd();
    e.preventDefault();
  }
  
  function handleMouseDown(e) {
    if (currentCardIndex >= potentialMatches.length) return;
    
    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;
    isDragging = true;
    
    currentCard = document.querySelector(`.match-card[data-index="${currentCardIndex}"]`);
    if (currentCard) {
      currentCard.style.transition = 'none';
      currentCard.style.cursor = 'grabbing';
    }
    
    e.preventDefault();
  }
  
  function handleMouseMove(e) {
    if (!isDragging || !currentCard) return;
    
    currentX = e.clientX;
    currentY = e.clientY;
    
    updateCardPosition();
  }
  
  function handleMouseUp(e) {
    if (!isDragging || !currentCard) return;
    
    handleSwipeEnd();
  }
  
  function updateCardPosition() {
    if (!currentCard) return;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const rotation = deltaX * 0.1; // Slight rotation based on horizontal movement
    
    currentCard.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg)`;
    
    // Show like/dislike badges based on swipe direction
    const likeBadge = currentCard.querySelector('.like-badge');
    const dislikeBadge = currentCard.querySelector('.dislike-badge');
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swiping right (like)
        if (likeBadge) {
          likeBadge.style.display = 'flex';
          likeBadge.style.opacity = Math.min(Math.abs(deltaX) / 150, 1);
        }
        if (dislikeBadge) {
          dislikeBadge.style.display = 'none';
        }
      } else {
        // Swiping left (dislike)
        if (dislikeBadge) {
          dislikeBadge.style.display = 'flex';
          dislikeBadge.style.opacity = Math.min(Math.abs(deltaX) / 150, 1);
        }
        if (likeBadge) {
          likeBadge.style.display = 'none';
        }
      }
    } else {
      // Hide badges when not swiping far enough
      if (likeBadge) likeBadge.style.display = 'none';
      if (dislikeBadge) dislikeBadge.style.display = 'none';
    }
  }
  
  function handleSwipeEnd() {
    if (!currentCard) return;
    
    const deltaX = currentX - startX;
    const swipeThreshold = 100; // Minimum distance to trigger swipe
    
    // Reset card styling
    currentCard.style.cursor = 'grab';
    
    if (Math.abs(deltaX) > swipeThreshold) {
      // Swipe detected
      if (deltaX > 0) {
        // Swipe right (like)
        animateCardExit(currentCard, 'right');
        handleLike();
      } else {
        // Swipe left (dislike)
        animateCardExit(currentCard, 'left');
        handleDislike();
      }
    } else {
      // Snap back to center
      currentCard.style.transition = 'transform 0.3s ease';
      currentCard.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
      
      // Hide badges
      const likeBadge = currentCard.querySelector('.like-badge');
      const dislikeBadge = currentCard.querySelector('.dislike-badge');
      if (likeBadge) likeBadge.style.display = 'none';
      if (dislikeBadge) dislikeBadge.style.display = 'none';
    }
    
    // Reset dragging state
    isDragging = false;
    currentCard = null;
  }
  
  function animateCardExit(card, direction) {
    if (!card) return;
    
    const exitDistance = window.innerWidth;
    const exitX = direction === 'right' ? exitDistance : -exitDistance;
    const rotation = direction === 'right' ? 30 : -30;
    
    // Faster animation for instant feel
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    card.style.transform = `translateX(${exitX}px) rotate(${rotation}deg)`;
    card.style.opacity = '0';
    card.style.zIndex = '200'; // Bring to front during exit
    
    // Immediately update the card stack to show next card
    setTimeout(() => {
      currentCardIndex++;
      updateCurrentCard();
    }, 50); // Very short delay for smooth transition
    
    // Remove card after animation
    setTimeout(() => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    }, 300);
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
