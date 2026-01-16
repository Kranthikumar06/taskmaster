document.addEventListener('DOMContentLoaded', () => {
  // Autofocus and move to next box logic
  const codeInputs = Array.from(document.querySelectorAll('.code-digit'));
  codeInputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val && idx < codeInputs.length - 1) {
        codeInputs[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        codeInputs[idx - 1].focus();
      }
    });
  });
  const verifyForm = document.getElementById('verifyForm');
  const errorDiv = document.getElementById('error-message');

  // Get email from query params
  const params = {};
  window.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function(_, key, value) {
    params[key] = decodeURIComponent(value);
  });
  const email = params.email;

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeInputs.map(input => input.value.trim()).join('');
    if (code.length !== 6) {
      errorDiv.textContent = 'Enter all 6 digits.';
      errorDiv.classList.add('show');
      setTimeout(() => errorDiv.classList.remove('show'), 2000);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();
      if (data.success) {
        window.location.href = '/login';
      } else {
        errorDiv.textContent = data.message || 'Verification failed.';
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 2000);
      }
    } catch (err) {
      errorDiv.textContent = 'Server error.';
      errorDiv.classList.add('show');
      setTimeout(() => errorDiv.classList.remove('show'), 2000);
    }
  });
});
