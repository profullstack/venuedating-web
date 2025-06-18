// Test script for phone authentication endpoints

async function testCheckPhoneExists() {
  console.log('Testing check-phone-exists endpoint...');
  
  // Test with a phone number that should exist (replace with a valid test phone number)
  const testPhone = '+15551234567';
  
  try {
    const response = await fetch('/api/1/auth/check-phone-exists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: testPhone })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      document.getElementById('result').innerHTML += `<p class="error">Error: ${JSON.stringify(errorData)}</p>`;
      return;
    }
    
    const data = await response.json();
    console.log('Response:', data);
    
    document.getElementById('result').innerHTML += `
      <p>Phone: ${testPhone}</p>
      <p>Exists: ${data.exists}</p>
      <p>Message: ${data.message}</p>
      <hr>
    `;
  } catch (err) {
    console.error('Error testing endpoint:', err);
    document.getElementById('result').innerHTML += `<p class="error">Error: ${err.message}</p>`;
  }
}

// Run tests when the page loads
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('run-test').addEventListener('click', testCheckPhoneExists);
});