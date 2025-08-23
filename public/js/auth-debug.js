/**
 * Auth Debug Helper
 * Add this script to any page to debug authentication issues
 */

(function() {
  console.log('🔍 AUTH DEBUG TOOL ACTIVATED');
  
  // Check all localStorage items
  const inspectLocalStorage = () => {
    console.log('📋 ALL LOCALSTORAGE ITEMS:');
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      items[key] = value;
      
      // Special handling for known auth keys
      if (key === 'barcrush_session_token') {
        console.log(`🔑 ${key}: ${value ? value.substring(0, 10) + '...' : 'null'}`);
      } else if (key === 'barcrush_session_expires') {
        try {
          const expiresAt = parseInt(value);
          console.log(`⏰ ${key}: ${new Date(expiresAt).toISOString()}`);
        } catch (e) {
          console.log(`⏰ ${key}: ${value} (invalid date)`);
        }
      } else if (key === 'barcrush_user') {
        try {
          const userData = JSON.parse(value);
          console.log(`👤 ${key}: User ID: ${userData.id}`);
        } catch (e) {
          console.log(`👤 ${key}: ${value ? value.substring(0, 20) + '...' : 'null'} (parse error)`);
        }
      } else {
        console.log(`📌 ${key}: ${value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : 'null'}`);
      }
    }
    return items;
  };
  
  // Check JWT token specifically
  const checkTokens = () => {
    const token = localStorage.getItem('barcrush_session_token');
    const expires = localStorage.getItem('barcrush_session_expires');
    const user = localStorage.getItem('barcrush_user');
    
    console.log('🔑 JWT Token exists:', !!token);
    if (token) {
      console.log('🔑 JWT Token:', token.substring(0, 10) + '...');
      
      // Try to decode JWT token parts
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));
          console.log('🔑 JWT Header:', header);
          console.log('🔑 JWT Payload:', payload);
          
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            console.log('🔑 JWT Payload expiration:', expDate.toISOString());
          }
        }
      } catch (e) {
        console.log('❌ Could not decode JWT token:', e.message);
      }
    }
    
    console.log('⏰ JWT Expires exists:', !!expires);
    if (expires) {
      const expiresAt = parseInt(expires);
      const currentTime = Date.now();
      const isValid = currentTime < expiresAt;
      const timeRemaining = expiresAt - currentTime;
      
      console.log('⏰ JWT expiration time:', new Date(expiresAt).toISOString());
      console.log('⏰ Current time:', new Date(currentTime).toISOString());
      console.log('✅ JWT is valid:', isValid);
      console.log('⏳ Time remaining (ms):', timeRemaining);
      console.log('⏳ Time remaining:', Math.floor(timeRemaining / 1000 / 60) + ' minutes');
    }
    
    console.log('👤 User data exists:', !!user);
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('👤 User ID:', userData.id);
        console.log('👤 User data:', userData);
      } catch (e) {
        console.error('❌ Error parsing user data:', e);
      }
    }
    
    // Check for redirect URL
    const redirectUrl = localStorage.getItem('barcrush_redirect_after_login');
    console.log('🔄 Redirect URL exists:', !!redirectUrl);
    if (redirectUrl) {
      console.log('🔄 Redirect URL:', redirectUrl);
    }
  };
  
  // Run immediately
  inspectLocalStorage();
  checkTokens();
  
  // Create a visual debug panel
  const createDebugPanel = () => {
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '10px';
    panel.style.right = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.zIndex = '9999';
    panel.style.maxWidth = '300px';
    panel.style.maxHeight = '300px';
    panel.style.overflow = 'auto';
    panel.style.fontSize = '12px';
    panel.style.fontFamily = 'monospace';
    
    const updatePanel = () => {
      const token = localStorage.getItem('barcrush_session_token');
      const expires = localStorage.getItem('barcrush_session_expires');
      const user = localStorage.getItem('barcrush_user');
      
      let content = '<strong>AUTH DEBUG</strong><br>';
      content += `JWT: ${token ? '✅' : '❌'}<br>`;
      
      if (token && expires) {
        const expiresAt = parseInt(expires);
        const currentTime = Date.now();
        const isValid = currentTime < expiresAt;
        content += `Valid: ${isValid ? '✅' : '❌'}<br>`;
        
        if (isValid) {
          const minutes = Math.floor((expiresAt - currentTime) / 60000);
          content += `Expires in: ${minutes} min<br>`;
        } else {
          content += `Expired: ${Math.floor((currentTime - expiresAt) / 60000)} min ago<br>`;
        }
      }
      
      content += `User: ${user ? '✅' : '❌'}<br>`;
      if (user) {
        try {
          const userData = JSON.parse(user);
          content += `ID: ${userData.id.substring(0, 8)}...<br>`;
        } catch (e) {
          content += `Parse error<br>`;
        }
      }
      
      content += `<button id="auth-debug-refresh">Refresh</button> `;
      content += `<button id="auth-debug-clear">Clear Auth</button> `;
      content += `<button id="auth-debug-inspect">Inspect All</button>`;
      
      panel.innerHTML = content;
      
      // Add event listeners
      setTimeout(() => {
        document.getElementById('auth-debug-refresh').addEventListener('click', () => {
          updatePanel();
          checkTokens();
        });
        
        document.getElementById('auth-debug-clear').addEventListener('click', () => {
          localStorage.removeItem('barcrush_session_token');
          localStorage.removeItem('barcrush_session_expires');
          localStorage.removeItem('barcrush_user');
          updatePanel();
          checkTokens();
        });
        
        document.getElementById('auth-debug-inspect').addEventListener('click', () => {
          console.clear();
          console.log('🔍 INSPECTING ALL LOCALSTORAGE ITEMS');
          inspectLocalStorage();
          checkTokens();
        });
      }, 0);
    };
    
    document.body.appendChild(panel);
    updatePanel();
    
    // Update every 30 seconds
    setInterval(updatePanel, 30000);
  };
  
  // Create panel when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDebugPanel);
  } else {
    createDebugPanel();
  }
})();
