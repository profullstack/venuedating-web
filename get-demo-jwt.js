#!/usr/bin/env node

/**
 * Instructions to get JWT token from demo account
 * Usage: node get-demo-jwt.js
 */

console.log('🔑 How to get JWT token from demo account:\n');

console.log('📋 Step-by-step instructions:');
console.log('1. Start your server: npm start');
console.log('2. Go to: http://localhost:8097/phone-login');
console.log('3. Enter phone number: 5555555555');
console.log('4. Click "Send Verification Code"');
console.log('5. Enter ANY verification code (demo account accepts any code)');
console.log('6. After login, open browser Developer Tools (F12)');
console.log('7. Go to Console tab');
console.log('8. Run this command:');
console.log('   const { data } = await supabase.auth.getSession(); console.log(data.session.access_token);');
console.log('9. Copy the JWT token that appears');
console.log('10. Update test-checkout-endpoint.js with the real token\n');

console.log('🧪 Alternative: Test directly in browser console on discover page:');
console.log('fetch("/api/create-checkout-session", {');
console.log('  method: "POST",');
console.log('  headers: {');
console.log('    "Content-Type": "application/json",');
console.log('    "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`');
console.log('  }');
console.log('}).then(r => r.json()).then(console.log);');

console.log('\n✅ The demo account phone number is: +15555555555 (or just 5555555555)');
