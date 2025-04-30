/**
 * Initialize the API keys page
 */
function initApiKeysPage() {
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

  const apiKeyManager = document.querySelector("api-key-manager");
  if (apiKeyManager) {
    // Try to force a re-render
    apiKeyManager.render();

    // Also try to reload the API keys
    if (typeof apiKeyManager._loadApiKeys === "function") {
      apiKeyManager._loadApiKeys();
    }

    console.log("API key manager refreshed");
  } else {
    console.error("API key manager component not found");

    // Try to create it dynamically if it doesn't exist
    const container = document.getElementById("api-key-container");
    if (container) {
      console.log("Creating API key manager component dynamically");
      const apiKeyManagerElement = document.createElement("api-key-manager");
      container.innerHTML = "";
      container.appendChild(apiKeyManagerElement);
    }
  }
}

// Initialize the page when the DOM is loaded
initApiKeysPage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener("spa-transition-end", initApiKeysPage);
