/**
 * Initialize the API keys page
 */
function initApiKeysPage() {
  // Set up main tab switching
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
  
  // Make sure the first tab content is visible by default
  const firstTabContent = document.getElementById("manage-tab");
  if (firstTabContent) {
    firstTabContent.style.display = "block";
  }
  
  // Set up code example tabs
  const codeTabsContainers = document.querySelectorAll(".code-tabs");
  codeTabsContainers.forEach((container) => {
    const codeTabs = container.querySelectorAll(".code-tab");
    const codeContents = container.closest(".code-examples").querySelectorAll(".code-content");
    
    codeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const codeType = tab.dataset.code;
        console.log("Code tab clicked:", codeType);
        
        // Remove active class from all tabs in this container
        codeTabs.forEach((t) => t.classList.remove("active"));
        
        // Add active class to clicked tab
        tab.classList.add("active");
        
        // Hide all code content for this container
        codeContents.forEach((content) => {
          content.style.display = "none";
        });
        
        // Show selected code content
        const codeContent = Array.from(codeContents).find(
          (content) => content.dataset.code === codeType
        );
        
        if (codeContent) {
          codeContent.style.display = "block";
        }
      });
    });
  });
}

// Initialize the page when the DOM is loaded
initApiKeysPage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener("spa-transition-end", initApiKeysPage);
