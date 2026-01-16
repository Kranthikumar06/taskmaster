// Import API_BASE_URL from config.js
// Make sure this script is loaded after config.js in HTML
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const errorDiv = document.getElementById('reset-error');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');

  // Get token and email from query params
  const params = {};
  window.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function(_, key, value) {
    params[key] = decodeURIComponent(value);
  });
  const token = params.token;
  const email = params.email;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    if (!newPassword.value || !confirmPassword.value) {
      errorDiv.textContent = 'Please fill in all fields.';
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      errorDiv.textContent = 'Passwords do not match!';
      return;
    }
    if (newPassword.value.length < 6) {
      errorDiv.textContent = 'Password must be at least 6 characters.';
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password: newPassword.value })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        errorDiv.style.color = '#4caf50';
        errorDiv.textContent = 'Password reset successful! Redirecting...';
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      } else {
        errorDiv.style.color = '#ff6b6b';
        errorDiv.textContent = data.message || 'Reset failed.';
      }
    } catch (e) {
      errorDiv.style.color = '#ff6b6b';
      errorDiv.textContent = 'Server error.';
    }
  });
});
