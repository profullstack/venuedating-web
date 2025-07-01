/**
 * Menu and Navigation Interaction Handler
 * This script manages the interaction between the side menu and bottom navigation
 * to prevent overlapping UI elements.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get reference to the bottom navigation
  const bottomNav = document.querySelector('bottom-navigation');
  
  if (!bottomNav) return;
  
  // Listen for side menu open event
  document.addEventListener('sideMenuOpened', () => {
    // Hide the bottom navigation when menu is open
    bottomNav.style.opacity = '0';
    bottomNav.style.visibility = 'hidden';
    bottomNav.style.transition = 'opacity 0.3s, visibility 0.3s';
  });
  
  // Listen for side menu close event
  document.addEventListener('sideMenuClosed', () => {
    // Show the bottom navigation when menu is closed
    bottomNav.style.opacity = '1';
    bottomNav.style.visibility = 'visible';
  });
});
