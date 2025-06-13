//alert('[auth-page.js] loaded!');
import { signInWithPhone, verifyPhoneOtp, signInWithGoogle } from './auth.js';
//alert('[auth-page.js] import succeeded!');


  // Handles UI for phone and Google login on auth.html

  // Helper to show status messages
  function showStatus(msg, isError = false) {
  let el = document.getElementById('auth-status-message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-status-message';
    el.style.marginTop = '14px';
    el.style.fontSize = '15px';
    el.style.textAlign = 'center';
    el.style.color = '#fff';
    el.style.background = isError ? '#F44B74' : '#4BB543';
    el.style.borderRadius = '8px';
    el.style.padding = '8px 16px';
    el.style.maxWidth = '340px';
    el.style.marginLeft = 'auto';
    el.style.marginRight = 'auto';
    document.querySelector('.auth-container').appendChild(el);
  }
  el.textContent = msg;
  el.style.background = isError ? '#F44B74' : '#4BB543';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// Phone login modal logic
function showPhoneModal() {
  let modal = document.getElementById('phone-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'phone-modal';
    modal.innerHTML = `
      <div class="modal-bg" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;">
        <div class="modal-content" style="background:#fff;padding:32px 18px 24px 18px;border-radius:16px;max-width:340px;width:90vw;text-align:center;position:relative;">
          <button id="close-modal-btn" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:22px;cursor:pointer;">&times;</button>
          <h2 style="margin-bottom:18px;font-size:22px;color:#F44B74;">Login with Phone</h2>
          <input id="phone-input" type="tel" placeholder="Enter phone number" style="width:90%;padding:10px 12px;font-size:16px;border-radius:8px;border:1px solid #eee;margin-bottom:16px;" />
          <button id="send-otp-btn" style="width:90%;padding:10px 0;background:#F44B74;color:#fff;border:none;border-radius:8px;font-size:16px;">Send OTP</button>
          <div id="otp-section" style="display:none;margin-top:18px;">
            <input id="otp-input" type="text" maxlength="6" placeholder="Enter OTP" style="width:90%;padding:10px 12px;font-size:16px;border-radius:8px;border:1px solid #eee;margin-bottom:12px;" />
            <button id="verify-otp-btn" style="width:90%;padding:10px 0;background:#4BB543;color:#fff;border:none;border-radius:8px;font-size:16px;">Verify OTP</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#close-modal-btn').onclick = () => modal.remove();
  }
  modal.style.display = 'flex';

  let phoneInput = modal.querySelector('#phone-input');
  let sendOtpBtn = modal.querySelector('#send-otp-btn');
  let otpSection = modal.querySelector('#otp-section');
  let otpInput = modal.querySelector('#otp-input');
  let verifyOtpBtn = modal.querySelector('#verify-otp-btn');

  sendOtpBtn.onclick = async () => {
    const phone = phoneInput.value.trim();
    if (!phone) return showStatus('Enter a valid phone number', true);
    sendOtpBtn.disabled = true;
    try {
      await signInWithPhone(phone);
      showStatus('OTP sent! Check your phone.');
      otpSection.style.display = 'block';
    } catch (err) {
      showStatus(err.message || 'Failed to send OTP', true);
    }
    sendOtpBtn.disabled = false;
  };

  verifyOtpBtn.onclick = async () => {
    const phone = phoneInput.value.trim();
    const otp = otpInput.value.trim();
    if (!otp) return showStatus('Enter the OTP', true);
    verifyOtpBtn.disabled = true;
    try {
      await verifyPhoneOtp(phone, otp);
      showStatus('Login successful!');
      setTimeout(() => window.location.href = '/feed', 1200);
    } catch (err) {
      showStatus(err.message || 'OTP verification failed', true);
    }
    verifyOtpBtn.disabled = false;
  };
}

// Attach events after DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  alert('[auth-page.js] DOMContentLoaded handler running');
  const phoneBtn = document.getElementById('phone-login-btn');
  const googleBtn = document.getElementById('google-login-btn');

  if (!phoneBtn) {
    alert('[auth-page.js] Phone login button not found');
  } else {
    phoneBtn.addEventListener('click', () => {
      alert('[auth-page.js] Phone login button clicked');
      showPhoneModal();
    });
    alert('[auth-page.js] Phone login button event attached');
  }
  if (!googleBtn) {
    alert('[auth-page.js] Google login button not found');
  } else {
    googleBtn.addEventListener('click', async (e) => {
      alert('[auth-page.js] Google login button clicked');
      e.preventDefault();
      try {
        await signInWithGoogle();
      } catch (err) {
        showStatus(err.message || 'Google login failed', true);
      }
    });
    alert('[auth-page.js] Google login button event attached');
  }
});
