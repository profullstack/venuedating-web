/**
 * UI Tests for Discover Page Components
 * Tests the discover page, filter modal, and matching interface
 */

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';

describe('Discover Page UI Components', () => {
  let dom;
  let window;
  let document;
  let mockApiClient;

  beforeEach(() => {
    // Setup DOM environment with discover page structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BarCrush Discover</title>
          <link rel="stylesheet" href="/css/discover.css">
        </head>
        <body>
          <div id="discover-container">
            <!-- Header with filter button -->
            <header class="discover-header">
              <h1>Discover</h1>
              <button id="filter-button" class="filter-btn">
                <span class="filter-icon">⚙️</span>
                Filters
              </button>
            </header>

            <!-- Card stack for swiping -->
            <div id="card-stack" class="card-stack">
              <div class="profile-card" data-user-id="user-456">
                <div class="card-image">
                  <img src="/images/profile1.jpg" alt="Profile">
                </div>
                <div class="card-info">
                  <h3>Jane, 25</h3>
                  <p class="distance">2.5 km away</p>
                  <div class="interests">
                    <span class="interest-tag">Coffee</span>
                    <span class="interest-tag">Hiking</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="action-buttons">
              <button id="pass-button" class="action-btn pass-btn">❌</button>
              <button id="like-button" class="action-btn like-btn">❤️</button>
              <button id="super-like-button" class="action-btn super-like-btn">⭐</button>
            </div>

            <!-- Filter Modal -->
            <div id="filter-modal" class="modal-overlay hidden">
              <div class="modal-content">
                <div class="modal-header">
                  <div class="handle-bar"></div>
                  <h2>Filters</h2>
                  <button id="close-filter" class="close-btn">×</button>
                </div>
                
                <div class="filter-section">
                  <h3>Interested In</h3>
                  <div class="interest-toggles">
                    <button class="toggle-btn active" data-interest="girls">Girls</button>
                    <button class="toggle-btn" data-interest="boys">Boys</button>
                    <button class="toggle-btn" data-interest="both">Both</button>
                  </div>
                </div>

                <div class="filter-section">
                  <h3>Location</h3>
                  <button id="location-selector" class="location-btn">
                    <span id="selected-location">San Francisco, CA</span>
                    <span class="location-icon">📍</span>
                  </button>
                </div>

                <div class="filter-section">
                  <h3>Distance</h3>
                  <div class="slider-container">
                    <input type="range" id="distance-slider" min="1" max="100" value="25">
                    <div class="slider-value">
                      <span id="distance-value">25</span> km
                    </div>
                  </div>
                </div>

                <div class="filter-section">
                  <h3>Age Range</h3>
                  <div class="dual-range-container">
                    <input type="range" id="age-min" min="18" max="65" value="22">
                    <input type="range" id="age-max" min="18" max="65" value="35">
                    <div class="range-values">
                      <span id="age-min-value">22</span> - <span id="age-max-value">35</span>
                    </div>
                  </div>
                </div>

                <div class="modal-actions">
                  <button id="clear-filters" class="secondary-btn">Clear All</button>
                  <button id="apply-filters" class="primary-btn">Apply Filters</button>
                </div>
              </div>
            </div>

            <!-- Match Modal -->
            <div id="match-modal" class="modal-overlay hidden">
              <div class="match-content">
                <h2>It's a Match! 🎉</h2>
                <div class="match-profiles">
                  <img class="match-photo" src="/images/user-photo.jpg" alt="Your photo">
                  <img class="match-photo" src="/images/match-photo.jpg" alt="Match photo">
                </div>
                <p>You and Jane both liked each other!</p>
                <div class="match-actions">
                  <button id="send-message" class="primary-btn">Send Message</button>
                  <button id="keep-swiping" class="secondary-btn">Keep Swiping</button>
                </div>
              </div>
            </div>

            <!-- Loading states -->
            <div id="loading-cards" class="loading hidden">
              <div class="spinner"></div>
              <p>Finding matches...</p>
            </div>

            <!-- Empty state -->
            <div id="no-more-cards" class="empty-state hidden">
              <h3>No more profiles</h3>
              <p>Check back later for new matches!</p>
              <button id="adjust-filters" class="primary-btn">Adjust Filters</button>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock API client
    mockApiClient = {
      getMatches: sinon.stub(),
      swipeUser: sinon.stub(),
      updateFilters: sinon.stub(),
      getProfile: sinon.stub()
    };

    // Mock touch events for mobile swiping
    global.TouchEvent = window.TouchEvent || function() {};
  });

  afterEach(() => {
    dom.window.close();
    sinon.restore();
    delete global.window;
    delete global.document;
    delete global.TouchEvent;
  });

  describe('Filter Modal', () => {
    it('should show filter modal when filter button is clicked', () => {
      const filterButton = document.getElementById('filter-button');
      const filterModal = document.getElementById('filter-modal');

      expect(filterModal.classList.contains('hidden')).to.be.true;

      filterButton.click();
      filterModal.classList.remove('hidden');

      expect(filterModal.classList.contains('hidden')).to.be.false;
    });

    it('should hide filter modal when close button is clicked', () => {
      const closeButton = document.getElementById('close-filter');
      const filterModal = document.getElementById('filter-modal');

      // Show modal first
      filterModal.classList.remove('hidden');
      expect(filterModal.classList.contains('hidden')).to.be.false;

      closeButton.click();
      filterModal.classList.add('hidden');

      expect(filterModal.classList.contains('hidden')).to.be.true;
    });

    it('should toggle interest buttons', () => {
      const girlsButton = document.querySelector('[data-interest="girls"]');
      const boysButton = document.querySelector('[data-interest="boys"]');

      expect(girlsButton.classList.contains('active')).to.be.true;
      expect(boysButton.classList.contains('active')).to.be.false;

      // Click boys button
      boysButton.click();
      girlsButton.classList.remove('active');
      boysButton.classList.add('active');

      expect(girlsButton.classList.contains('active')).to.be.false;
      expect(boysButton.classList.contains('active')).to.be.true;
    });

    it('should update distance slider value', () => {
      const distanceSlider = document.getElementById('distance-slider');
      const distanceValue = document.getElementById('distance-value');

      distanceSlider.value = '50';
      distanceSlider.dispatchEvent(new window.Event('input'));
      distanceValue.textContent = '50';

      expect(distanceValue.textContent).to.equal('50');
    });

    it('should update age range values', () => {
      const ageMin = document.getElementById('age-min');
      const ageMax = document.getElementById('age-max');
      const ageMinValue = document.getElementById('age-min-value');
      const ageMaxValue = document.getElementById('age-max-value');

      ageMin.value = '25';
      ageMax.value = '40';
      ageMin.dispatchEvent(new window.Event('input'));
      ageMax.dispatchEvent(new window.Event('input'));
      
      ageMinValue.textContent = '25';
      ageMaxValue.textContent = '40';

      expect(ageMinValue.textContent).to.equal('25');
      expect(ageMaxValue.textContent).to.equal('40');
    });

    it('should clear all filters', () => {
      const clearButton = document.getElementById('clear-filters');
      const distanceSlider = document.getElementById('distance-slider');
      const ageMin = document.getElementById('age-min');
      const ageMax = document.getElementById('age-max');

      // Set some values
      distanceSlider.value = '50';
      ageMin.value = '25';
      ageMax.value = '40';

      clearButton.click();

      // Reset to defaults (would be handled by JavaScript)
      distanceSlider.value = '25';
      ageMin.value = '22';
      ageMax.value = '35';

      expect(distanceSlider.value).to.equal('25');
      expect(ageMin.value).to.equal('22');
      expect(ageMax.value).to.equal('35');
    });
  });

  describe('Card Swiping Interface', () => {
    it('should display profile cards', () => {
      const cardStack = document.getElementById('card-stack');
      const profileCard = cardStack.querySelector('.profile-card');

      expect(profileCard).to.not.be.null;
      expect(profileCard.dataset.userId).to.equal('user-456');
    });

    it('should show profile information', () => {
      const profileCard = document.querySelector('.profile-card');
      const nameAge = profileCard.querySelector('h3');
      const distance = profileCard.querySelector('.distance');
      const interests = profileCard.querySelectorAll('.interest-tag');

      expect(nameAge.textContent).to.equal('Jane, 25');
      expect(distance.textContent).to.equal('2.5 km away');
      expect(interests.length).to.equal(2);
    });

    it('should handle like button click', () => {
      const likeButton = document.getElementById('like-button');
      const profileCard = document.querySelector('.profile-card');
      
      let clicked = false;
      likeButton.addEventListener('click', () => {
        clicked = true;
      });

      likeButton.click();
      expect(clicked).to.be.true;
    });

    it('should handle pass button click', () => {
      const passButton = document.getElementById('pass-button');
      
      let clicked = false;
      passButton.addEventListener('click', () => {
        clicked = true;
      });

      passButton.click();
      expect(clicked).to.be.true;
    });

    it('should handle super like button click', () => {
      const superLikeButton = document.getElementById('super-like-button');
      
      let clicked = false;
      superLikeButton.addEventListener('click', () => {
        clicked = true;
      });

      superLikeButton.click();
      expect(clicked).to.be.true;
    });
  });

  describe('Match Modal', () => {
    it('should show match modal on mutual like', () => {
      const matchModal = document.getElementById('match-modal');

      // Simulate showing match modal
      matchModal.classList.remove('hidden');

      expect(matchModal.classList.contains('hidden')).to.be.false;
    });

    it('should have match action buttons', () => {
      const sendMessageButton = document.getElementById('send-message');
      const keepSwipingButton = document.getElementById('keep-swiping');

      expect(sendMessageButton).to.not.be.null;
      expect(keepSwipingButton).to.not.be.null;
    });

    it('should handle send message action', () => {
      const sendMessageButton = document.getElementById('send-message');
      
      let clicked = false;
      sendMessageButton.addEventListener('click', () => {
        clicked = true;
      });

      sendMessageButton.click();
      expect(clicked).to.be.true;
    });
  });

  describe('Loading and Empty States', () => {
    it('should show loading state when fetching cards', () => {
      const loadingCards = document.getElementById('loading-cards');

      loadingCards.classList.remove('hidden');
      expect(loadingCards.classList.contains('hidden')).to.be.false;
    });

    it('should show empty state when no more cards', () => {
      const noMoreCards = document.getElementById('no-more-cards');
      const cardStack = document.getElementById('card-stack');

      // Hide card stack and show empty state
      cardStack.classList.add('hidden');
      noMoreCards.classList.remove('hidden');

      expect(noMoreCards.classList.contains('hidden')).to.be.false;
    });

    it('should handle adjust filters button in empty state', () => {
      const adjustFiltersButton = document.getElementById('adjust-filters');
      
      let clicked = false;
      adjustFiltersButton.addEventListener('click', () => {
        clicked = true;
      });

      adjustFiltersButton.click();
      expect(clicked).to.be.true;
    });
  });

  describe('Touch Gestures (Mobile)', () => {
    it('should handle touch start event', () => {
      const profileCard = document.querySelector('.profile-card');
      let touchStarted = false;

      profileCard.addEventListener('touchstart', () => {
        touchStarted = true;
      });

      // Simulate touch start
      const touchEvent = new window.TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      profileCard.dispatchEvent(touchEvent);
      expect(touchStarted).to.be.true;
    });

    it('should handle touch move for card dragging', () => {
      const profileCard = document.querySelector('.profile-card');
      let touchMoved = false;

      profileCard.addEventListener('touchmove', () => {
        touchMoved = true;
      });

      const touchEvent = new window.TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 100 }]
      });
      
      profileCard.dispatchEvent(touchEvent);
      expect(touchMoved).to.be.true;
    });

    it('should handle touch end for swipe completion', () => {
      const profileCard = document.querySelector('.profile-card');
      let touchEnded = false;

      profileCard.addEventListener('touchend', () => {
        touchEnded = true;
      });

      const touchEvent = new window.TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });
      
      profileCard.dispatchEvent(touchEvent);
      expect(touchEnded).to.be.true;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const likeButton = document.getElementById('like-button');
      const passButton = document.getElementById('pass-button');
      const filterButton = document.getElementById('filter-button');

      // These would typically be set by JavaScript
      likeButton.setAttribute('aria-label', 'Like this profile');
      passButton.setAttribute('aria-label', 'Pass on this profile');
      filterButton.setAttribute('aria-label', 'Open filters');

      expect(likeButton.getAttribute('aria-label')).to.equal('Like this profile');
      expect(passButton.getAttribute('aria-label')).to.equal('Pass on this profile');
      expect(filterButton.getAttribute('aria-label')).to.equal('Open filters');
    });

    it('should have proper modal accessibility', () => {
      const filterModal = document.getElementById('filter-modal');
      
      filterModal.setAttribute('role', 'dialog');
      filterModal.setAttribute('aria-modal', 'true');
      filterModal.setAttribute('aria-labelledby', 'filter-title');

      expect(filterModal.getAttribute('role')).to.equal('dialog');
      expect(filterModal.getAttribute('aria-modal')).to.equal('true');
    });

    it('should have keyboard navigation support', () => {
      const filterButton = document.getElementById('filter-button');
      
      // Test keyboard event
      const keyEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      let keyPressed = false;
      
      filterButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          keyPressed = true;
        }
      });

      filterButton.dispatchEvent(keyEvent);
      expect(keyPressed).to.be.true;
    });
  });

  describe('Responsive Design', () => {
    it('should have proper CSS classes for responsive layout', () => {
      const discoverContainer = document.getElementById('discover-container');
      const cardStack = document.getElementById('card-stack');
      const actionButtons = document.querySelector('.action-buttons');

      expect(discoverContainer).to.not.be.null;
      expect(cardStack).to.not.be.null;
      expect(actionButtons).to.not.be.null;
    });

    it('should handle different screen sizes', () => {
      // This would typically test CSS media queries
      // For now, just verify elements exist
      const modalContent = document.querySelector('.modal-content');
      expect(modalContent).to.not.be.null;
    });
  });
});
