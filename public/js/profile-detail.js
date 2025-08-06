/**
 * profile-detail.js
 * Handle functionality for the profile detail view
 */
import { getProfileById } from './api/profiles.js';
import { supabaseClientPromise } from './supabase-client.js';
import authMiddleware from './auth-middleware.js';

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
    likeButton.addEventListener('click', async () => {
      const profileId = likeButton.dataset.profileId;
      console.log('Profile liked:', profileId);
      
      // Disable button to prevent double-clicks
      likeButton.disabled = true;
      
      try {
        animateLike();
        const result = await likeProfile(profileId);
        console.log('✅ Profile liked successfully');
        
        // Check if it's a match
        if (result.isMatch) {
          console.log('🎉 It\'s a match!');
          showMatchedScreen(profileId);
        } else {
          // No match, go back to matching page
          setTimeout(() => history.back(), 500);
        }
      } catch (error) {
        console.error('Error liking profile:', error);
        // Re-enable button on error
        likeButton.disabled = false;
        return;
      }
    });
  }
  
  if (dislikeButton) {
    dislikeButton.addEventListener('click', async () => {
      const profileId = dislikeButton.dataset.profileId;
      console.log('Profile disliked:', profileId);
      
      // Disable button to prevent double-clicks
      dislikeButton.disabled = true;
      
      try {
        animateDislike();
        await dislikeProfile(profileId);
        console.log('❌ Profile disliked successfully');
      } catch (error) {
        console.error('Error disliking profile:', error);
        // Re-enable button on error
        dislikeButton.disabled = false;
        return;
      }
      
      setTimeout(() => history.back(), 500);
    });
  }
}

// Animate like action with heart effect
function animateLike() {
  const likeButton = document.querySelector('.btn-like');
  if (!likeButton) return;
  
  // Add animation class
  likeButton.classList.add('liked');
  
  // Create floating heart animation
  const heart = document.createElement('div');
  heart.innerHTML = '❤️';
  heart.style.cssText = `
    position: fixed;
    font-size: 2rem;
    pointer-events: none;
    z-index: 1000;
    animation: floatHeart 1s ease-out forwards;
  `;
  
  // Position heart at button location
  const rect = likeButton.getBoundingClientRect();
  heart.style.left = rect.left + rect.width / 2 - 16 + 'px';
  heart.style.top = rect.top + rect.height / 2 - 16 + 'px';
  
  document.body.appendChild(heart);
  
  // Remove heart after animation
  setTimeout(() => {
    if (heart.parentNode) {
      heart.parentNode.removeChild(heart);
    }
  }, 1000);
  
  // Add CSS animation if not already present
  if (!document.querySelector('#heart-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'heart-animation-styles';
    style.textContent = `
      @keyframes floatHeart {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-100px) scale(1.5);
          opacity: 0;
        }
      }
      .btn-like.liked {
        background: var(--accent-color) !important;
        transform: scale(0.95);
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Animate dislike action with fade effect
function animateDislike() {
  const dislikeButton = document.querySelector('.btn-dislike');
  const profileCard = document.querySelector('.profile-detail');
  
  if (dislikeButton) {
    dislikeButton.classList.add('disliked');
  }
  
  if (profileCard) {
    profileCard.style.transform = 'translateX(-100px)';
    profileCard.style.opacity = '0.5';
    profileCard.style.transition = 'all 0.3s ease';
  }
  
  // Add CSS animation if not already present
  if (!document.querySelector('#dislike-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'dislike-animation-styles';
    style.textContent = `
      .btn-dislike.disliked {
        background: var(--error-color) !important;
        transform: scale(0.95);
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// API call to like a profile
async function likeProfile(profileId) {
  try {
    const user = authMiddleware.getUser();
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    
    console.log(`👍 Liking profile ${profileId} for user ${user.id}`);
    
    // Get Supabase client
    const supabase = await supabaseClientPromise;
    
    // Insert the like into the database
    const { data: likeData, error: likeError } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        liked_user_id: profileId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (likeError) {
      console.error('Error inserting like:', likeError);
      throw likeError;
    }
    
    console.log('✅ Like recorded in database:', likeData);
    
    // Check if it's a mutual like (match)
    const isMatch = await checkForMutualLike(user.id, profileId);
    
    return { success: true, isMatch };
  } catch (error) {
    console.error('Error in likeProfile:', error);
    throw error;
  }
}

// Check if two users have liked each other (mutual like = match)
async function checkForMutualLike(currentUserId, likedUserId) {
  try {
    const supabase = await supabaseClientPromise;
    
    // Check if the liked user has also liked the current user
    const { data, error } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', likedUserId)
      .eq('liked_user_id', currentUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking for mutual like:', error);
      throw error;
    }
    
    const isMatch = !!data; // Convert to boolean
    
    if (isMatch) {
      console.log('🎉 Mutual like detected! Creating match record...');
      
      // Create a match record in the matches table
      await createMatchRecord(currentUserId, likedUserId);
    }
    
    console.log(`💕 Mutual like check: ${isMatch ? 'MATCH!' : 'No match yet'}`);
    return isMatch;
    
  } catch (error) {
    console.error('Error in checkForMutualLike:', error);
    // Don't throw error here - we don't want to break the like flow
    // Just return false if we can't check
    return false;
  }
}

// Create a match record when two users like each other
async function createMatchRecord(user1Id, user2Id) {
  try {
    const supabase = await supabaseClientPromise;
    
    // Check if match already exists (to avoid duplicates)
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();
    
    if (existingMatch) {
      console.log('Match record already exists');
      return existingMatch;
    }
    
    // Create new match record
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        matched_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();
    
    if (matchError) {
      console.error('Error creating match record:', matchError);
      throw matchError;
    }
    
    console.log('✅ Match record created:', matchData);
    
    // TODO: Create notifications for both users about the match
    // await createMatchNotifications(user1Id, user2Id);
    
    return matchData;
    
  } catch (error) {
    console.error('Error in createMatchRecord:', error);
    // Don't throw - we don't want to break the match flow
    return null;
  }
}

// API call to dislike a profile
async function dislikeProfile(profileId) {
  try {
    const user = authMiddleware.getUser();
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    
    console.log(`👎 Disliking profile ${profileId} for user ${user.id}`);
    
    // Get Supabase client
    const supabase = await supabaseClientPromise;
    
    // Insert the dislike into the database
    const { data: dislikeData, error: dislikeError } = await supabase
      .from('user_dislikes')
      .insert({
        user_id: user.id,
        disliked_user_id: profileId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dislikeError) {
      console.error('Error inserting dislike:', dislikeError);
      throw dislikeError;
    }
    
    console.log('✅ Dislike recorded in database:', dislikeData);
    
    return { success: true };
  } catch (error) {
    console.error('Error in dislikeProfile:', error);
    throw error;
  }
}

// Show matched screen when users like each other back
function showMatchedScreen(profileId) {
  // Get current profile data
  const currentProfile = getCurrentProfileData();
  
  // Create matched screen modal
  const matchedModal = document.createElement('div');
  matchedModal.className = 'matched-modal';
  matchedModal.innerHTML = `
    <div class="matched-overlay"></div>
    <div class="matched-content">
      <div class="matched-header">
        <h1 class="matched-title">It's a Match!</h1>
        <p class="matched-subtitle">You and ${currentProfile?.full_name || 'this person'} liked each other</p>
      </div>
      
      <div class="matched-profiles">
        <div class="matched-profile-card left">
          <div class="profile-image">
            <img src="${currentProfile?.avatar_url || '/images/default-avatar.png'}" alt="${currentProfile?.full_name || 'Profile'}" />
          </div>
        </div>
        
        <div class="matched-heart">
          <div class="heart-icon">💖</div>
        </div>
        
        <div class="matched-profile-card right">
          <div class="profile-image">
            <!-- Current user's profile image would go here -->
            <div class="profile-placeholder">You</div>
          </div>
        </div>
      </div>
      
      <div class="matched-actions">
        <button class="btn btn-primary matched-message-btn" onclick="startConversation('${profileId}')">
          Send Message
        </button>
        <button class="btn btn-secondary matched-continue-btn" onclick="closeMatchedScreen()">
          Keep Swiping
        </button>
      </div>
    </div>
  `;
  
  // Add matched screen styles
  addMatchedScreenStyles();
  
  // Add to DOM
  document.body.appendChild(matchedModal);
  
  // Trigger animation
  setTimeout(() => {
    matchedModal.classList.add('show');
  }, 100);
  
  // Add confetti effect
  createConfettiEffect();
}

// Close matched screen and return to matching page
function closeMatchedScreen() {
  const matchedModal = document.querySelector('.matched-modal');
  if (matchedModal) {
    matchedModal.classList.remove('show');
    setTimeout(() => {
      matchedModal.remove();
      history.back();
    }, 300);
  }
}

// Start conversation with matched user
function startConversation(profileId) {
  console.log('Starting conversation with:', profileId);
  // TODO: Navigate to chat/conversation page
  // For now, close modal and go back
  closeMatchedScreen();
}

// Get current profile data from the page
function getCurrentProfileData() {
  const nameElement = document.querySelector('.profile-name');
  const imageElement = document.querySelector('.profile-image img');
  
  return {
    full_name: nameElement?.textContent?.split(',')[0] || 'Unknown',
    avatar_url: imageElement?.src || null
  };
}

// Add CSS styles for matched screen
function addMatchedScreenStyles() {
  if (document.querySelector('#matched-screen-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'matched-screen-styles';
  style.textContent = `
    .matched-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
    }
    
    .matched-modal.show {
      opacity: 1;
      transform: scale(1);
    }
    
    .matched-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0.95;
    }
    
    .matched-content {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: white;
      text-align: center;
    }
    
    .matched-title {
      font-size: 3rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .matched-subtitle {
      font-size: 1.2rem;
      margin: 0 0 3rem 0;
      opacity: 0.9;
    }
    
    .matched-profiles {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .matched-profile-card {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid white;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    
    .matched-profile-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .profile-placeholder {
      width: 100%;
      height: 100%;
      background: var(--accent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
    }
    
    .matched-heart {
      font-size: 3rem;
      animation: heartBeat 1s ease-in-out infinite;
    }
    
    @keyframes heartBeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    .matched-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 300px;
    }
    
    .matched-actions .btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 50px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .matched-message-btn {
      background: white;
      color: var(--accent-color);
    }
    
    .matched-message-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    
    .matched-continue-btn {
      background: transparent;
      color: white;
      border: 2px solid white;
    }
    
    .matched-continue-btn:hover {
      background: white;
      color: var(--accent-color);
    }
    
    @media (max-width: 768px) {
      .matched-title {
        font-size: 2.5rem;
      }
      
      .matched-profile-card {
        width: 100px;
        height: 100px;
      }
      
      .matched-heart {
        font-size: 2.5rem;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Create confetti effect for celebration
function createConfettiEffect() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        z-index: 10001;
        border-radius: 50%;
        pointer-events: none;
        animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
      `;
      
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 5000);
    }, i * 100);
  }
  
  // Add confetti animation if not already present
  if (!document.querySelector('#confetti-animation')) {
    const style = document.createElement('style');
    style.id = 'confetti-animation';
    style.textContent = `
      @keyframes confettiFall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Animate like button when clicked


// Animate dislike button when clicked


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
    } else {
      age = profile.age;
    }
    
    nameElement.textContent = `${profile.full_name || 'Unknown'}, ${age}`;
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
