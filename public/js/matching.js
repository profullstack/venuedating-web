/**
 * matching.js
 * Handles the matching page functionality including card swiping and like/dislike actions
 */

// Sample user data - this would come from an API in a real app
const users = [
  {
    id: 1,
    name: "Camila Snow",
    age: 23,
    venue: "Moonlight Lounge",
    distance: 1.5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Jessica Parks",
    age: 24,
    venue: "Electric Owl",
    distance: 2.5,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Emma Wilson",
    age: 22,
    venue: "Deep Ellum Art Co",
    distance: 3.2,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Olivia Martinez",
    age: 25,
    venue: "Velvet Room",
    distance: 0.8,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop"
  },
  {
    id: 5,
    name: "Sophie Chen",
    age: 24,
    venue: "The Blue Note",
    distance: 1.3,
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&auto=format&fit=crop"
  },
  {
    id: 6,
    name: "Maya Johnson",
    age: 27,
    venue: "Skybar Lounge",
    distance: 2.1,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop"
  },
  {
    id: 7,
    name: "Zoe Williams",
    age: 26,
    venue: "The Basement",
    distance: 1.7,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop"
  },
  {
    id: 8,
    name: "Taylor Reid",
    age: 23,
    venue: "Neon Lounge",
    distance: 3.5,
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop"
  }
];

// Initialize the matching page
function initMatchingPage() {
  console.log('Initialize matching page');
  // Ensure we're working with the right elements
  const cardStack = document.getElementById('card-stack');
  if (!cardStack) {
    console.error('Card stack not found');
    return;
  }
  
  // Generate cards from users array
  generateCards();
  
  // Setup the core functionality
  setupCards();
  setupActionButtons();
  setupBottomNavigation();
  
  console.log('Matching page initialized successfully');
}

// Generate cards from the users array
function generateCards() {
  console.log('Generating cards from users data');
  const cardStack = document.getElementById('card-stack');
  
  // Clear any existing cards first
  cardStack.innerHTML = '';
  
  // Create a card for each user
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.setAttribute('data-id', user.id);
    
    // Set background image
    card.style.backgroundImage = `url(${user.image})`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    
    // Create distance badge
    const distanceBadge = document.createElement('div');
    distanceBadge.className = 'card-distance';
    distanceBadge.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span class="distance-text">${user.distance} miles</span>
    `;
    
    // Create user info
    const userInfo = document.createElement('div');
    userInfo.className = 'card-info';
    userInfo.innerHTML = `
      <h3 class="profile-name">${user.name}, ${user.age}</h3>
      <p class="venue-name">At ${user.venue}</p>
    `;
    
    // Add everything to the card
    card.appendChild(distanceBadge);
    card.appendChild(userInfo);
    
    // Add the card to the stack
    cardStack.appendChild(card);
  });
  
  console.log(`Generated ${users.length} cards`);
}

// Add background images to cards if needed
function updateCardImages() {
  const cards = document.querySelectorAll('.match-card');
  cards.forEach((card, index) => {
    // Get the user data or use a default image
    const userData = users[index] || users[0];
    if (!card.style.backgroundImage) {
      card.style.backgroundImage = `url(${userData.image})`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }
  });
}

// Setup cards in the stack
function setupCards() {
  console.log('Setting up cards');
  
  // Clear any existing badges first to prevent duplicates
  document.querySelectorAll('.like-badge').forEach(badge => badge.remove());
  
  const cards = document.querySelectorAll('.match-card');
  console.log(`Found ${cards.length} cards to set up`);
  
  if (cards.length === 0) {
    console.error('No cards found in the DOM');
    return;
  }
  
  // Add the swipe functionality to each card
  cards.forEach((card, index) => {
    console.log(`Setting up card ${index + 1}`);
    
    // Add touch-action: none to prevent browser handling of touch events
    card.style.touchAction = 'none';
    card.style.userSelect = 'none';
    
    // Add hidden like/dislike badges to each card if they don't already exist
    
    // Add like (heart) badge
    if (!card.querySelector('.like-badge')) {
      const likeBadge = document.createElement('div');
      likeBadge.className = 'like-badge';
      likeBadge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      `;
      card.appendChild(likeBadge);
    }
    
    // Add dislike (X) badge
    if (!card.querySelector('.dislike-badge')) {
      const dislikeBadge = document.createElement('div');
      dislikeBadge.className = 'dislike-badge';
      dislikeBadge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      card.appendChild(dislikeBadge);
    }
    
    // Make card visibly interactive
    card.addEventListener('mouseenter', () => {
      if (card === getTopCard()) {
        card.style.cursor = 'grab';
      }
    });
    
    // Set up dragging AFTER adding the badge
    setupCardDragging(card);
  });
  
  // Initialize card positions
  updateCardPositions();
  console.log('Cards setup complete');
}

// Setup like and dislike buttons
function setupActionButtons() {
  const likeButton = document.getElementById('like-button');
  const rejectButton = document.getElementById('reject-button');
  
  if (likeButton) {
    likeButton.addEventListener('click', () => {
      const topCard = getTopCard();
      if (topCard) {
        // Show the like badge
        const likeBadge = topCard.querySelector('.like-badge');
        if (likeBadge) likeBadge.style.opacity = '1';
        
        // Swipe the card right
        setTimeout(() => {
          swipeCard(topCard, 'right');
        }, 300);
      }
    });
  }
  
  if (rejectButton) {
    rejectButton.addEventListener('click', () => {
      const topCard = getTopCard();
      if (topCard) {
        swipeCard(topCard, 'left');
      }
    });
  }
}

// Set up bottom navigation
function setupBottomNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetHref = this.getAttribute('href');
      console.log('Navigation to:', targetHref);
      
      // Actually navigate to the target page
      if (targetHref && targetHref !== '#') {
        window.location.href = targetHref;
      }
    });
  });
}

// Get the current top card
function getTopCard() {
  const cards = document.querySelectorAll('.match-card');
  if (cards.length === 0) return null;
  
  // Return the card with highest z-index
  return cards[0]; // In our stack, first element has highest z-index
}

// Function to swipe a card left or right
function swipeCard(card, direction) {
  const translateX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
  const rotation = direction === 'right' ? 30 : -30;
  
  // Animate the card off screen
  card.style.transition = 'transform 0.6s ease';
  card.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)`;
  
  // After animation completes, move the next card to top position
  setTimeout(() => {
    // Remove the card
    card.parentNode.removeChild(card);
    
    // Check if we should load new cards
    if (document.querySelectorAll('.match-card').length <= 1) {
      // In a real app, we'd load more user profiles here
      console.log('Would load more profiles in a real app');
    }
    
    // Update positions of remaining cards
    updateCardPositions();
  }, 600);
}

// Update positions of cards in the stack
function updateCardPositions() {
  const cards = document.querySelectorAll('.match-card');
  cards.forEach((card, index) => {
    // Move the next card to top position with animation
    if (index === 0) {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateZ(10px) rotate(0deg)';
      card.style.zIndex = '10';
    } else if (index === 1) {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateZ(5px) rotate(5deg) translateX(10px)';
      card.style.zIndex = '9';
    }
  });
}

// Setup drag functionality for card
function setupCardDragging(card) {
  if (!card) {
    console.error('Cannot setup dragging: card is null');
    return;
  }
  
  console.log(`Setting up drag for card ${card.getAttribute('data-id')}`);
  
  // First remove any existing event listeners to prevent duplicates
  const clone = card.cloneNode(true);
  card.parentNode.replaceChild(clone, card);
  card = clone;
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let initialRotation = 0;
  
  // Force a basic initial style
  card.style.position = 'absolute';
  card.style.cursor = 'grab';
  
  // Add click handler to open profile detail
  card.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Card clicked, opening profile detail');
    
    // Get user ID from card's data attribute or index
    const userId = card.getAttribute('data-id') || 1;
    window.location.href = `/views/profile-detail.html?id=${userId}`;
  });
  
  // Add mouse/touch events for right swipe only
  card.addEventListener('mousedown', startDrag);
  card.addEventListener('touchstart', startDrag, {passive: false});
  
  // Variable to track if we're just tapping vs dragging
  let isTap = true;
  let startTime = 0;
  
  // Start dragging
  function startDrag(e) {
    console.log('Start drag triggered');
    e.stopPropagation();
    
    // Only allow dragging the top card
    if (card !== getTopCard()) {
      console.log('Not top card, ignoring drag');
      return;
    }
    
    // Prevent default to avoid text selection and other browser actions
    e.preventDefault();
    
    // Change cursor to grabbing
    card.style.cursor = 'grabbing';
    
    isDragging = true;
    isTap = true; // Assume it's a tap until proven otherwise
    startTime = new Date().getTime();
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    
    // Add move and end event listeners
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive: false});
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }
  
  // While dragging
  function onDrag(e) {
    if (!isDragging) return;
    
    // Prevent scrolling when dragging
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    currentX = touch.clientX;
    currentY = touch.clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // If moved more than a few pixels, it's not a tap
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isTap = false;
    }
    
    // Allow both left and right swipes
    // Move the card
    card.style.transition = 'none';
    card.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${deltaX * 0.1}deg)`;
    
    // Update the badge opacity based on swipe direction
    const likeBadge = card.querySelector('.like-badge');
    const dislikeBadge = card.querySelector('.dislike-badge');
    
    if (deltaX > 0) {
      // Right swipe - show like badge
      console.log(`Right dragging: deltaX=${deltaX}`);
      if (likeBadge) {
        const opacity = Math.min(1, deltaX / 80);
        likeBadge.style.opacity = opacity.toString();
      }
      // Hide dislike badge
      if (dislikeBadge) {
        dislikeBadge.style.opacity = '0';
      }
    } else if (deltaX < 0) {
      // Left swipe - show dislike badge
      console.log(`Left dragging: deltaX=${deltaX}`);
      if (dislikeBadge) {
        const opacity = Math.min(1, Math.abs(deltaX) / 80);
        dislikeBadge.style.opacity = opacity.toString();
      }
      // Hide like badge
      if (likeBadge) {
        likeBadge.style.opacity = '0';
      }
    } else {
      // No horizontal movement
      if (likeBadge) likeBadge.style.opacity = '0';
      if (dislikeBadge) dislikeBadge.style.opacity = '0';
    }
  }
  
  // End dragging
  function endDrag(e) {
    if (!isDragging) return;
    
    console.log('End drag');
    
    const endTime = new Date().getTime();
    const timeElapsed = endTime - startTime;
    
    isDragging = false;
    
    // Restore cursor
    card.style.cursor = 'grab';
    
    // Remove event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
    
    // If it was a tap (minimal movement and short duration), navigate to profile
    if (isTap && timeElapsed < 300) {
      console.log('Tap detected, opening profile');
      
      // Reset card position
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateZ(10px) rotate(0deg)';
      
      // Get user ID from card's data attribute or index
      const userId = card.getAttribute('data-id') || 1;
      window.location.href = `/views/profile-detail.html?id=${userId}`;
      return;
    }
    
    // Check if the card has been swiped far enough to trigger an action
    const deltaX = currentX - startX;
    const threshold = 50; // Minimum swipe distance to trigger action
    
    // Process both left and right swipes
    if (deltaX > threshold) {
      // Right swipe (like)
      console.log('Right swipe detected');
      swipeCard(card, 'right');
    } else if (deltaX < -threshold) {
      // Left swipe (dislike)
      console.log('Left swipe detected');
      swipeCard(card, 'left');
    } else {
      // Not swiped far enough - return to center
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateZ(10px) rotate(0deg)';
      
      // Hide both badges
      const likeBadge = card.querySelector('.like-badge');
      const dislikeBadge = card.querySelector('.dislike-badge');
      if (likeBadge) likeBadge.style.opacity = '0';
      if (dislikeBadge) dislikeBadge.style.opacity = '0';
    }
  }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', initMatchingPage);
