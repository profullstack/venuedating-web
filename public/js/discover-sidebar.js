// discover-sidebar.js: Handles sidebar open/close logic on Discover page

// discover-sidebar.js - Handles the hamburger menu click to open sidebar

// Debug function to check if the sidebar component is properly registered
function debugSidebarComponent() {
  console.log('DEBUG: Checking if discover-sidebar is registered:', customElements.get('discover-sidebar'));
  const sidebarInstance = document.querySelector('discover-sidebar');
  console.log('DEBUG: Sidebar instance found:', sidebarInstance);
  if (sidebarInstance) {
    console.log('DEBUG: Sidebar open method exists:', typeof sidebarInstance.open === 'function');
    console.log('DEBUG: Sidebar prototype:', Object.getPrototypeOf(sidebarInstance));
  }
}

// Run debug immediately
debugSidebarComponent();

// Also run after a short delay to ensure components are loaded
setTimeout(debugSidebarComponent, 1000);

document.addEventListener('DOMContentLoaded', function() {
  console.log('DEBUG: DOMContentLoaded event fired');
  
  // Debug the DOM state
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  console.log('DEBUG: Hamburger button found:', hamburgerBtn);
  
  function setupSidebarOpenEvent() {
    const discoverSidebar = document.querySelector('discover-sidebar');
    console.log('DEBUG: Looking for sidebar component, found:', discoverSidebar);
    
    if (!discoverSidebar) {
      // If sidebar component isn't loaded yet, try again in next frame
      console.log('Waiting for discover-sidebar component to load...');
      requestAnimationFrame(setupSidebarOpenEvent);
      return;
    }
    
    console.log('Discover sidebar component found, setting up click handler');
    console.log('DEBUG: Sidebar open method exists:', typeof discoverSidebar.open === 'function');
    
    if (hamburgerBtn) {
      console.log('DEBUG: Adding click listener to hamburger button');
      
      // Remove any existing click listeners to prevent duplicates
      hamburgerBtn.removeEventListener('click', hamburgerClickHandler);
      
      // Add the click handler
      hamburgerBtn.addEventListener('click', hamburgerClickHandler);
    } else {
      console.error('Hamburger button not found in the DOM');
    }
  }
  
  // Separate the click handler function so we can remove/add it
  function hamburgerClickHandler() {
    console.log('DEBUG: Hamburger button clicked!');
    const discoverSidebar = document.querySelector('discover-sidebar');
    
    if (!discoverSidebar) {
      console.error('DEBUG: Sidebar component not found when button clicked!');
      return;
    }
    
    console.log('DEBUG: Attempting to open sidebar');
    // Check if open method exists
    if (typeof discoverSidebar.open === 'function') {
      console.log('DEBUG: Calling sidebar.open() method');
      discoverSidebar.open();
    } else {
      console.error('discover-sidebar component does not have an open() method');
    }
  }

  // Start the setup process
  setupSidebarOpenEvent();
  
  // Also try again after a short delay to ensure everything is loaded
  setTimeout(setupSidebarOpenEvent, 1000);
});
