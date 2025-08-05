/**
 * Match Notification Modal Component
 * Shows a beautiful overlay when two users match
 */

class MatchModal {
  constructor() {
    this.modal = null;
    this.isVisible = false;
    this.onSayHello = null;
    this.onKeepSwiping = null;
  }

  /**
   * Show the match modal with user details
   * @param {Object} currentUser - Current user data
   * @param {Object} matchedUser - Matched user data
   */
  show(currentUser, matchedUser) {
    if (this.isVisible) return;

    console.log('🎉 Showing match modal for:', matchedUser.full_name);

    // Create modal HTML
    this.modal = document.createElement('div');
    this.modal.className = 'match-modal';
    this.modal.innerHTML = this.createModalHTML(currentUser, matchedUser);

    // Add to page
    document.body.appendChild(this.modal);

    // Add event listeners
    this.addEventListeners();

    // Show with animation
    requestAnimationFrame(() => {
      this.modal.classList.add('visible');
    });

    this.isVisible = true;
  }

  /**
   * Hide the match modal
   */
  hide() {
    if (!this.isVisible || !this.modal) return;

    this.modal.classList.remove('visible');
    
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.isVisible = false;
    }, 300);
  }

  /**
   * Create the modal HTML structure
   */
  createModalHTML(currentUser, matchedUser) {
    const currentUserAvatar = currentUser.avatar_url || '/images/default-avatar.png';
    const matchedUserAvatar = matchedUser.avatar_url || '/images/default-avatar.png';
    const matchedUserName = matchedUser.full_name || 'Someone';

    return `
      <div class="match-modal-overlay">
        <div class="match-modal-content">
          <!-- Profile Images with Hearts -->
          <div class="match-profiles">
            <div class="profile-image current-user">
              <img src="${currentUserAvatar}" alt="Your profile" />
              <div class="heart-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#FF4B77"/>
                </svg>
              </div>
            </div>
            
            <div class="profile-image matched-user">
              <img src="${matchedUserAvatar}" alt="${matchedUserName}" />
              <div class="heart-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#FF4B77"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Match Text -->
          <div class="match-text">
            <h1 class="match-title">It's a match, ${matchedUserName}!</h1>
            <p class="match-subtitle">Want to meet on dance floor?</p>
          </div>

          <!-- Action Buttons -->
          <div class="match-actions">
            <button class="btn-say-hello" data-action="say-hello">
              Say hello
            </button>
            <button class="btn-keep-swiping" data-action="keep-swiping">
              Keep swiping
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Add event listeners to modal buttons
   */
  addEventListeners() {
    if (!this.modal) return;

    const sayHelloBtn = this.modal.querySelector('[data-action="say-hello"]');
    const keepSwipingBtn = this.modal.querySelector('[data-action="keep-swiping"]');

    sayHelloBtn?.addEventListener('click', () => {
      console.log('💬 Say hello clicked');
      if (this.onSayHello) {
        this.onSayHello();
      }
      this.hide();
    });

    keepSwipingBtn?.addEventListener('click', () => {
      console.log('🔄 Keep swiping clicked');
      if (this.onKeepSwiping) {
        this.onKeepSwiping();
      }
      this.hide();
    });

    // Close on overlay click
    const overlay = this.modal.querySelector('.match-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Close on escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }
}

// Export for use in other modules
export default MatchModal;

// Also make it available globally for debugging
window.MatchModal = MatchModal;

console.log('✅ MatchModal class loaded and exported');
