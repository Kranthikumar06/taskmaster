// Create Task Modal close logic
function closeCreateTaskModal() {
  const modal = document.getElementById('createTaskModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.getElementById('createTaskForm').reset();
  }
}

// Attach close listeners for create task modal
window.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  if (closeBtn) {
    closeBtn.onclick = null;
    closeBtn.addEventListener('click', closeCreateTaskModal);
  }
  if (cancelBtn) {
    cancelBtn.onclick = null;
    cancelBtn.addEventListener('click', closeCreateTaskModal);
  }
});
// Check if user is logged in or coming from Google OAuth
function getQueryParams() {
  const params = {};
  window.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function(_, key, value) {
    params[key] = decodeURIComponent(value);
  });
  return params;
}

const token = localStorage.getItem('token');
let user = null;
try {
  user = JSON.parse(localStorage.getItem('user'));
} catch (e) {
  user = null;
}

const params = getQueryParams();
if (params.name && params.email) {
  user = { name: params.name, email: params.email };
  localStorage.setItem('user', JSON.stringify(user));
  // Store JWT token if present
  if (params.token) {
    localStorage.setItem('token', params.token);
  }
}

function isValidJWT(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

const storedToken = localStorage.getItem('token');
if (!isValidJWT(storedToken)) {
  // Remove any invalid tokens and force logout
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Setup activity tracking and token refresh
if (typeof setupActivityTracking === 'function') {
  setupActivityTracking();
}
if (typeof setupTokenRefresh === 'function') {
  setupTokenRefresh();
}

// View Management
let currentView = 'tasks';

function switchView(viewName) {
  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}View`).classList.add('active');
  
  currentView = viewName;
  
  // Update content based on view
  if (viewName === 'dashboard') {
    updateStats();
    setTimeout(() => updateChart(), 100);
  } else if (viewName === 'tasks') {
    renderTasks(currentFilter);
  } else if (viewName === 'settings') {
    // Always update settings info when switching to settings view
    const usernameSpan = document.getElementById('settingsUsername');
    const emailSpan = document.getElementById('settingsEmail');
    if (usernameSpan && emailSpan && user) {
      usernameSpan.textContent = user.username;
      emailSpan.textContent = user.email;
    }
  }
}

// Navigation click handlers
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const viewName = link.dataset.view;
    if (viewName) {
      switchView(viewName);
    }
  });
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  alert('Logged out successfully!');
  window.location.href = '/login';
});

// Task filter tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const filter = tab.dataset.filter;
    currentFilter = filter;
    renderTasks(filter);
  });
});

// Create task button
if (!window.createTaskBtnInitialized) {
  window.createTaskBtnInitialized = true;
  const createTaskBtn = document.getElementById('createTaskBtn');
  if (createTaskBtn) {
    createTaskBtn.addEventListener('click', () => {
      const modal = document.getElementById('createTaskModal');
      modal.classList.add('show');
      modal.style.display = 'flex';
      document.getElementById('createTaskForm').reset();
      // No need to generate next task ID here
    });
  }
}


// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

// Apply saved theme on load
document.documentElement.setAttribute('data-theme', currentTheme);

// Update icon based on theme
function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('svg');
  if (!icon) return;
  if (theme === 'light') {
    // Moon icon for dark mode option
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  } else {
    // Sun icon for light mode option
    icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
  }
}

updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

// Initialize dashboard
// Ensure tasks view is shown by default on page load
window.addEventListener('DOMContentLoaded', () => {
  switchView('tasks');
  renderTasks('all');
});