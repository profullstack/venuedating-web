/**
 * New Test Feature page functionality
 */

/**
 * Initialize the new-test-feature page
 */
function initNewTestFeaturePage() {
  console.log('Initializing new-test-feature page');
  
  // Get the form element
  const form = document.getElementById('new-test-feature-form');
  if (!form) {
    console.error('new-test-feature form not found');
    return;
  }
  
  // Get the result container
  const resultContainer = document.getElementById('form-result');
  if (!resultContainer) {
    console.error('Form result container not found');
    return;
  }
  
  // Add submit event listener to the form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    try {
      // Get form data
      const formData = new FormData(form);
      const formDataObj = Object.fromEntries(formData.entries());
      
      // Process the form data
      console.log('Form data:', formDataObj);
      
      // In a real application, you would send this data to a server
      // For this example, we'll just simulate a server response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      resultContainer.style.display = 'block';
      resultContainer.style.backgroundColor = '#d1fae5'; // Light green
      resultContainer.innerHTML = `
        <h3>Form Submitted Successfully</h3>
        <p>Thank you, ${formDataObj.name}! Your message has been received.</p>
        <p>We'll respond to ${formDataObj.email} as soon as possible.</p>
      `;
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error message
      resultContainer.style.display = 'block';
      resultContainer.style.backgroundColor = '#fee2e2'; // Light red
      resultContainer.innerHTML = `
        <h3>Error Submitting Form</h3>
        <p>Sorry, there was an error processing your submission.</p>
        <p>Error: ${error.message || 'Unknown error'}</p>
      `;
    } finally {
      // Reset button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
}

// Initialize the page when the DOM is loaded
initNewTestFeaturePage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener("spa-transition-end", initNewTestFeaturePage);