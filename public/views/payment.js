// Payment page logic

// Get subscriptionId from query param or sessionStorage
function getSubscriptionId() {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('subscription');
  if (!id) {
    id = sessionStorage.getItem('pending_subscription_id');
  }
  return id;
}

async function fetchSubscriptionData(subscriptionId) {
  const response = await fetch(`/api/subscriptions/${subscriptionId}`);
  console.log('Fetched subscription data:', response);
  if (!response.ok) throw new Error('Failed to fetch subscription');
  return response.json();
}

function renderPaymentInfo(subscription) {
  const paymentInfoSection = document.getElementById('payment-info-section');
  const paymentAddress = subscription.payment_address;
  const coin = subscription.payment_method.toUpperCase();
  const cryptoAmount = subscription.crypto_amount;
  const exchangeRate = subscription.exchange_rate_usd;

  paymentInfoSection.innerHTML = `
    <div class="payment-info-box">
      <div class="mb-3">
        <label class="fw-bold mb-2">Amount:</label>
        <div class="input-group">
          <input type="text" class="form-control" value="${cryptoAmount} ${coin}" readonly>
          <button class="btn btn-outline-secondary copy-btn" data-copy="${cryptoAmount}">Copy Amount</button>
        </div>
      </div>
      <div class="mb-3">
        <label class="fw-bold mb-2">Address:</label>
        <div class="input-group">
          <input type="text" class="form-control" value="${paymentAddress}" readonly>
          <button class="btn btn-outline-secondary copy-btn" data-copy="${paymentAddress}">Copy Address</button>
        </div>
      </div>
      <div class="text-muted small mb-3">Exchange rate: 1 ${coin} = $${exchangeRate}</div>
      <button id="check-payment-btn" class="btn btn-primary" style="margin-top:24px;width:100%;font-size:1.1em;">I have paid</button>
    </div>
  `;
}

function setupCopyButtons() {
  const paymentInfoSection = document.getElementById('payment-info-section');
  paymentInfoSection.addEventListener('click', e => {
    if (e.target.classList.contains('copy-btn')) {
      const textToCopy = e.target.dataset.copy;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          e.target.textContent = 'Copied!';
          setTimeout(() => {
            e.target.textContent = e.target.textContent.includes('Amount') ? 'Copy Amount' : 'Copy Address';
          }, 2000);
        })
        .catch(err => console.error('Failed to copy:', err));
    }
  });
}

function showStatusMessage(msg, type = 'info') {
  const statusDiv = document.getElementById('payment-status-message');
  statusDiv.className = `alert alert-${type}`;
  statusDiv.textContent = msg;
}

async function pollPaymentStatus(subscriptionId) {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/status`);
    const data = await response.json();
    if (data.status === 'active') {
      showStatusMessage('Payment received! Redirecting...','success');
      setTimeout(() => window.router.navigate('/api-keys'), 1500);
      return;
    }
    setTimeout(() => pollPaymentStatus(subscriptionId), 30000);
  } catch (err) {
    showStatusMessage('Error checking payment status.','danger');
  }
}

async function initPaymentPage() {
  const subscriptionId = getSubscriptionId();
  if (!subscriptionId) {
    showStatusMessage('No payment session found. Please register again.','danger');
    return;
  }
  try {
    const { subscription } = await fetchSubscriptionData(subscriptionId);
    renderPaymentInfo(subscription);
    setupCopyButtons();
    showStatusMessage('After you have paid, click the button below to check for payment.','info');
    setupCheckPaymentButton(subscriptionId);
  } catch (err) {
    showStatusMessage('Failed to load payment info.','danger');
  }
}

// SPA: only run if on /payment
if (window.location.pathname.endsWith('/payment') || window.location.pathname.endsWith('/payment.html')) {
  initPaymentPage();
}
