/**
 * Initialize the new Stripe payment page
 */
export function initStripePaymentNewPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  
  if (paymentStatus === 'success') {
    window.showFloatingAlert('Payment successful! Your subscription is now active.', 'success');
    // Remove the query parameter from the URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (paymentStatus === 'cancel') {
    window.showFloatingAlert('Payment cancelled. You can try again when you\'re ready.', 'info');
    // Remove the query parameter from the URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Initialize the page when the module is imported
initStripePaymentNewPage();