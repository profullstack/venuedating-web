/**
 * Profile completion page functionality
 */

/**
 * Initialize the profile completion page
 */
export function initProfileCompletePage() {
  console.log('Initializing profile complete page');
  
  // Get profile data from localStorage
  const profileData = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  // Update the greeting with the user's name if available
  const nameElement = document.getElementById('user-name');
  if (nameElement && profileData.first_name) {
    nameElement.textContent = profileData.first_name;
  }
  
  // Start the confetti animation
  startConfetti();
  
  // Redirect to home page after 5 seconds
  setTimeout(() => {
    window.location.href = '/discover';
  }, 5000);
}

/**
 * Start the confetti animation
 */
function startConfetti() {
  const confettiContainer = document.getElementById('confetti-container');
  if (!confettiContainer) return;
  
  const colors = ['#F44B74', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 5 + 's';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confettiContainer.appendChild(confetti);
  }
}