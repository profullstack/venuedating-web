/**
 * Progress Indicator Component
 * 
 * Creates a step indicator for the profile onboarding flow
 */

export function createProgressIndicator(currentStep) {
  // Steps in our onboarding flow
  const steps = [
    { id: 'profile', label: 'Profile' },
    { id: 'gender', label: 'Gender' },
    { id: 'interests', label: 'Interests' },
    { id: 'verify', label: 'Verify' }
  ];
  
  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  if (currentStepIndex === -1) {
    console.error(`Invalid step: ${currentStep}`);
    return null;
  }
  
  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  
  // Create progress bar background
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressContainer.appendChild(progressBar);
  
  // Create filled progress bar
  const progressFilled = document.createElement('div');
  progressFilled.className = 'progress-filled';
  progressContainer.appendChild(progressFilled);
  
  // Create step elements
  steps.forEach((step, index) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'step';
    if (index < currentStepIndex) {
      stepElement.classList.add('completed');
    }
    if (index === currentStepIndex) {
      stepElement.classList.add('active');
    }
    
    // Step number or checkmark
    const stepNumber = document.createElement('span');
    stepNumber.className = 'step-number';
    stepNumber.textContent = index + 1;
    stepElement.appendChild(stepNumber);
    
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.innerHTML = '✓';
    stepElement.appendChild(checkmark);
    
    // Step label
    const stepLabel = document.createElement('div');
    stepLabel.className = 'step-label';
    stepLabel.textContent = step.label;
    stepElement.appendChild(stepLabel);
    
    progressContainer.appendChild(stepElement);
  });
  
  // Set the width of filled bar based on current step
  // We want to fill up to the active step
  // For the first step (index 0), we want 0% filled
  // For the last step (index 3), we want 100% filled
  const progressPercentage = currentStepIndex > 0 
    ? ((currentStepIndex) / (steps.length - 1)) * 100 
    : 0;
  
  // Apply the width after a short delay to allow for transition animation
  setTimeout(() => {
    progressFilled.style.width = `${progressPercentage}%`;
  }, 100);
  
  return progressContainer;
}

// Initialize the progress indicator on a page
export function initProgressIndicator(currentStep, targetElement) {
  // Import the CSS file
  if (!document.getElementById('progress-indicator-css')) {
    const link = document.createElement('link');
    link.id = 'progress-indicator-css';
    link.rel = 'stylesheet';
    link.href = '/css/progress-indicator.css';
    document.head.appendChild(link);
  }
  
  // Create the progress indicator
  const progressIndicator = createProgressIndicator(currentStep);
  
  if (progressIndicator && targetElement) {
    // If targetElement is a string, treat it as a selector
    if (typeof targetElement === 'string') {
      targetElement = document.querySelector(targetElement);
    }
    
    // Insert at the beginning of the target element
    if (targetElement) {
      if (targetElement.firstChild) {
        targetElement.insertBefore(progressIndicator, targetElement.firstChild);
      } else {
        targetElement.appendChild(progressIndicator);
      }
    }
  }
  
  return progressIndicator;
}
