/**
 * Match Modal Component
 * 
 * Displays a beautiful "It's a Match!" overlay when two users match with each other.
 * Handles animation and user actions (say hello / keep swiping).
 */
export class MatchModal {
  constructor() {
    this.matchScreen = document.getElementById('match-screen');
    this.leftProfileImg = this.matchScreen.querySelector('.left-profile .profile-image img');
    this.rightProfileImg = this.matchScreen.querySelector('.right-profile .profile-image img');
    this.matchTitle = this.matchScreen.querySelector('.match-title');
    this.matchSubtitle = this.matchScreen.querySelector('.match-subtitle');
    this.sayHelloBtn = document.getElementById('say-hello-button');
    this.keepSwipingBtn = document.getElementById('keep-swiping-button');
    
    // Default callbacks - can be overridden
    this.onSayHello = () => console.log('Say hello clicked - override this');
    this.onKeepSwiping = () => console.log('Keep swiping clicked - override this');
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the modal buttons
   */
  setupEventListeners() {
    // Say hello button - start conversation
    this.sayHelloBtn.addEventListener('click', () => {
      console.log('Say hello clicked');
      this.hide();
      this.onSayHello();
    });
    
    // Keep swiping button - hide modal and continue
    this.keepSwipingBtn.addEventListener('click', () => {
      console.log('Keep swiping clicked');
      this.hide();
      this.onKeepSwiping();
    });
  }
  
  /**
   * Show the match modal with user profiles
   * @param {Object} currentUser - Current user profile
   * @param {Object} matchedUser - Matched user profile
   */
  show(currentUser, matchedUser) {
    console.log('Showing match modal', { currentUser, matchedUser });
    
    // Set profile images
    if (currentUser && currentUser.avatar_url) {
      this.leftProfileImg.src = currentUser.avatar_url;
      this.leftProfileImg.alt = currentUser.full_name || 'Your profile';
    }
    
    if (matchedUser && matchedUser.avatar_url) {
      this.rightProfileImg.src = matchedUser.avatar_url;
      this.rightProfileImg.alt = matchedUser.full_name || 'Match profile';
    }
    
    // Set match title with the matched user's name
    if (matchedUser && matchedUser.full_name) {
      const firstName = matchedUser.full_name.split(' ')[0];
      this.matchTitle.textContent = `It's a match, ${firstName}!`;
    }
    
    // Set match subtitle with a random message
    const matchMessages = [
      "Want to meet on the dance floor?",
      "Ready to make some memories?",
      "Start a conversation and see where it leads!",
      "The perfect time for a drink together!",
      "You both have great taste!"
    ];
    this.matchSubtitle.textContent = matchMessages[Math.floor(Math.random() * matchMessages.length)];
    
    // Show the match screen with animation
    this.matchScreen.style.display = 'flex';
    this.matchScreen.style.opacity = '0';
    
    // Animate entrance
    setTimeout(() => {
      this.matchScreen.style.transition = 'opacity 0.5s ease';
      this.matchScreen.style.opacity = '1';
    }, 10);
  }
  
  /**
   * Hide the match modal with animation
   */
  hide() {
    // Animate exit
    this.matchScreen.style.transition = 'opacity 0.3s ease';
    this.matchScreen.style.opacity = '0';
    
    // After animation, hide completely
    setTimeout(() => {
      this.matchScreen.style.display = 'none';
    }, 300);
  }
}

export default MatchModal;
