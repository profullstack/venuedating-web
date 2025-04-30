/**
 * Initialize the API keys page
 */
async function initApiKeysPage() {
  console.log("Initializing API keys page");
  
  // Ensure the api-key-manager component is loaded
  try {
    // Import the api-key-manager component
    await import('../components/api-key-manager.js');
    console.log("API key manager component imported");
    
    // Make sure the component is defined and registered
    if (!customElements.get('api-key-manager')) {
      console.error("API key manager component not registered");
    } else {
      console.log("API key manager component is registered");
    }
    
    // Force re-render of the component if it exists
    const apiKeyManager = document.querySelector('api-key-manager');
    if (apiKeyManager) {
      console.log("Found api-key-manager element, forcing render");
      // If the component has a render method, call it
      if (typeof apiKeyManager.render === 'function') {
        apiKeyManager.render();
      }
      // Otherwise, try to re-initialize it by removing and re-adding it
      else {
        const container = document.getElementById('api-key-container');
        if (container) {
          const newManager = document.createElement('api-key-manager');
          container.innerHTML = '';
          container.appendChild(newManager);
          console.log("Re-created api-key-manager element");
        }
      }
    } else {
      console.log("No api-key-manager element found, creating one");
      const container = document.getElementById('api-key-container');
      if (container) {
        const newManager = document.createElement('api-key-manager');
        container.innerHTML = '';
        container.appendChild(newManager);
        console.log("Created new api-key-manager element");
      }
    }
  } catch (error) {
    console.error("Error loading api-key-manager component:", error);
  }
  
  // Set up tab switching
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      console.log("Tab button clicked:", button.dataset.tab);

      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Hide all tab content
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.style.display = "none";
      });

      // Show selected tab content
      const tabId = button.dataset.tab;
      const tabContent = document.getElementById(`${tabId}-tab`);

      if (tabContent) {
        tabContent.style.display = "block";
        console.log("Tab content displayed:", tabId);
      } else {
        console.error("Tab content not found:", tabId);
      }
    });
  });
}

// Initialize the page when the DOM is loaded
initApiKeysPage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener("spa-transition-end", initApiKeysPage);
