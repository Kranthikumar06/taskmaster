// Forgot Password Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  const forgotLink = document.getElementById('forgot-password-link');
  const modal = document.getElementById('forgot-modal');
  const closeBtn = document.getElementById('close-reset-modal');
  const sendBtn = document.getElementById('send-reset-btn');
  const resetEmail = document.getElementById('reset-email');
  const resetError = document.getElementById('reset-error');
  if (forgotLink && modal && closeBtn && sendBtn && resetEmail && resetError) {
    forgotLink.onclick = () => { modal.style.display = 'flex'; resetEmail.value = ''; resetError.textContent = ''; };
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    sendBtn.onclick = async () => {
      const email = resetEmail.value.trim();
      if (!email) { resetError.textContent = 'Enter your email.'; return; }
      sendBtn.disabled = true;
      const originalBtnHTML = sendBtn.innerHTML;
      sendBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:18px;height:18px;border:3px solid #fff;border-top:3px solid #ff6b6b;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;"></span>Sending...';
      resetError.textContent = '';
      try {
        const res = await fetch(`${API_URL}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          resetError.style.color = '#4caf50';
          resetError.textContent = 'Reset link sent! Check your email.';
          // Show loading spinner after 10 seconds if still visible
          setTimeout(() => {
            if (resetError.textContent.includes('Reset link sent')) {
              resetError.innerHTML = '<span class="spinner" style="display:inline-block;width:22px;height:22px;border:3px solid #4caf50;border-top:3px solid #fff;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;"></span>Waiting for email delivery...';
            }
          }, 10000);
        } else {
          resetError.style.color = '#ff6b6b';
          resetError.textContent = data.message || 'Failed to send reset link.';
        }
      } catch (e) {
        resetError.style.color = '#ff6b6b';
        resetError.textContent = 'Server error.';
      }
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalBtnHTML;
    };
  }
});
// Password visibility toggle for eye icons
document.addEventListener('DOMContentLoaded', () => {
  // Handle Google signup/login redirect: if token present, fetch full user and go to dashboard; else pre-fill signup form
  (async function handleGoogleOAuthRedirect() {
    const params = {};
    window.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    if (params.name && params.email && params.token) {
      localStorage.setItem('token', params.token);
      try {
        // Fetch full user profile using token
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${params.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            localStorage.setItem('user', JSON.stringify(data.data));
          } else {
            localStorage.setItem('user', JSON.stringify({ name: params.name, email: params.email }));
          }
        } else {
          localStorage.setItem('user', JSON.stringify({ name: params.name, email: params.email }));
        }
      } catch (e) {
        localStorage.setItem('user', JSON.stringify({ name: params.name, email: params.email }));
      }
      window.location.replace('/dashboard');
      return;
    }
    if (window.location.pathname.includes('signup') && params.name && params.email && params.google === '1') {
      // Pre-fill signup form fields
      const nameInput = document.querySelector('input[placeholder="Enter your Username"]');
      const emailInput = document.querySelector('input[placeholder="Enter your Email"]');
      if (nameInput) nameInput.value = params.name;
      if (emailInput) emailInput.value = params.email;
      // Optionally, disable editing
      if (nameInput) nameInput.readOnly = true;
      if (emailInput) emailInput.readOnly = true;
    }
  })();
  // Google OAuth button handler
  document.querySelectorAll('.btn.google').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `${API_BASE_URL}/auth/google`;
    });
  });
  // Find all password input containers
  document.querySelectorAll('.inputForm').forEach(formGroup => {
    const passwordInput = formGroup.querySelector('input[type="password"]');
    // Find the last SVG in the inputForm (the eye icon)
    const eyeIcon = formGroup.querySelectorAll('svg');
    if (passwordInput && eyeIcon.length > 1) {
      const eye = eyeIcon[eyeIcon.length - 1];
      eye.style.cursor = 'pointer';
      eye.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          eye.style.opacity = 0.5;
        } else {
          passwordInput.type = 'password';
          eye.style.opacity = 1;
        }
      });
    }
  });
});
const API_URL = `${API_BASE_URL}/api/auth`;

let inactivityTimer;
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes (before token expires)
let isUserActive = true;

// Show error message inline
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    // Hide error after 2 seconds
    setTimeout(() => {
      errorDiv.classList.remove('show');
    }, 2000);
  }
}

// Refresh token function
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.data.token);
      return true;
    } else {
      // Refresh token expired, logout user
      handleSessionExpiry();
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    handleSessionExpiry();
    return false;
  }
}

// Handle session expiry
function handleSessionExpiry() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Session expired due to inactivity. Please login again.
  window.location.href = '/login';
}

// Reset inactivity timer
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  isUserActive = true;
  inactivityTimer = setTimeout(() => {
    isUserActive = false;
    // Only log out if user is still inactive after timeout
    if (!isUserActive) {
      handleSessionExpiry();
    }
  }, INACTIVITY_TIMEOUT);
}

// Track user activity
function setupActivityTracking() {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  // Start the timer
  resetInactivityTimer();
}

// Setup automatic token refresh
function setupTokenRefresh() {
  setInterval(async () => {
    const token = localStorage.getItem('token');
    if (token && isUserActive) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        // If refresh fails, log out immediately
        handleSessionExpiry();
      }
    }
  }, TOKEN_REFRESH_INTERVAL);
}

// Handle Registration
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('form');
  
  // Clear any existing tokens when on login/signup pages
  if (window.location.pathname.includes('login') || window.location.pathname.includes('signup')) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  
  if (registerForm && window.location.pathname.includes('signup')) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.querySelector('input[placeholder="Enter your Username"]').value.trim();
      const email = document.querySelector('input[placeholder="Enter your Email"]').value.trim();
      const password = document.querySelector('input[placeholder="Enter your Password"]').value.trim();
      const confirmPassword = document.querySelector('input[placeholder="Confirm your Password"]').value.trim();

        // Validate Terms & Conditions
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox || !termsCheckbox.checked) {
          showError('You must agree to Terms & Conditions');
          return;
        }
      
      // Validate inputs
      if (!username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
      }
      
      // Validate passwords match
      if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
      }
      
      if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
      }
      
      
      try {
        // Show loading spinner
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'flex';
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });
        const data = await response.json();
        if (spinner) spinner.style.display = 'none';
        if (response.ok && data.success) {
          // Redirect to verification page with email
          window.location.href = `/verify.html?email=${encodeURIComponent(email)}`;
        } else {
          showError(data.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'none';
        showError('Unable to connect to server. Please try again.');
      }
    });
  }
  
  // Handle Login
  const isLoginPage = window.location.pathname === '/' || window.location.pathname.includes('login');
  const isSignupPage = window.location.pathname.includes('signup');
  
  if (registerForm && isLoginPage && !isSignupPage) {
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = document.querySelector('#email') || document.querySelector('input[placeholder="Enter Username or Email"]');
      const passwordInput = document.querySelector('#password') || document.querySelector('input[placeholder="Enter your Password"]');
      
      
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      
      
      // Validate inputs
      if (!email || !password) {
        showError('Please enter username/email and password');
        return;
      }
      
      
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.data));
          window.location.href = '/dashboard';
        } else {
          showError(data.message || 'Invalid email or password');
        }
      } catch (error) {
        showError('Unable to connect to server. Please try again.');
      }
    });
  }
});

// Export functions for use in other files
window.refreshAccessToken = refreshAccessToken;
window.setupActivityTracking = setupActivityTracking;
window.setupTokenRefresh = setupTokenRefresh;