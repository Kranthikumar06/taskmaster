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
  initializeSettings();
});

// Initialize Settings Page
function initializeSettings() {
  // Populate member since date
  if (user) {
    const memberSinceElement = document.getElementById('memberSince');
    if (memberSinceElement) {
      // Use current date as fallback, or parse from user object if available
      const memberDate = user.createdAt ? new Date(user.createdAt) : new Date();
      memberSinceElement.textContent = memberDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }
  }

  // Edit Username Button
  const editUsernameBtn = document.getElementById('editUsernameBtn');
  if (editUsernameBtn) {
    editUsernameBtn.addEventListener('click', () => {
      const usernameElement = document.getElementById('settingsUsername');
      const currentUsername = usernameElement.textContent;
      const container = usernameElement.parentElement;

      // Create input field
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentUsername;
      input.className = 'username-edit-input';
      input.id = 'usernameInput';

      // Create error message element
      const errorMsg = document.createElement('span');
      errorMsg.className = 'username-error-msg';
      errorMsg.style.display = 'none';

      // Create save button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn-save-username';
      saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
      saveBtn.title = 'Save';

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-cancel-username';
      cancelBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>`;
      cancelBtn.title = 'Cancel';

      // Hide original elements
      usernameElement.style.display = 'none';
      editUsernameBtn.style.display = 'none';

      // Add new elements
      container.appendChild(input);
      container.appendChild(saveBtn);
      container.appendChild(cancelBtn);
      
      // Insert error message after the buttons
      const editContainer = usernameElement.parentElement.parentElement;
      editContainer.appendChild(errorMsg);

      // Focus input
      input.focus();
      input.select();

      // Helper to show error
      const showError = (message) => {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        input.classList.add('error');
      };

      // Helper to hide error
      const hideError = () => {
        errorMsg.style.display = 'none';
        input.classList.remove('error');
      };

      // Cancel handler
      const cancelEdit = () => {
        input.remove();
        saveBtn.remove();
        cancelBtn.remove();
        errorMsg.remove();
        usernameElement.style.display = '';
        editUsernameBtn.style.display = '';
      };

      cancelBtn.addEventListener('click', cancelEdit);

      // Save handler
      const saveEdit = async () => {
        const newUsername = input.value.trim();

        // Hide any previous errors
        hideError();

        if (!newUsername) {
          showError('Username cannot be empty');
          return;
        }

        if (newUsername === currentUsername) {
          cancelEdit();
          return;
        }

        // Disable buttons during save
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        input.disabled = true;

        try {
          const response = await window.apiCallWithRefresh(`${API_BASE_URL}/api/auth/update-username`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: newUsername })
          });
          
          if (!response) {
            cancelEdit();
            return;
          }

          const data = await response.json();

          if (data.success) {
            // Update username in the UI
            usernameElement.textContent = data.data.username;

            // Update user in localStorage
            const updatedUser = JSON.parse(localStorage.getItem('user'));
            updatedUser.username = data.data.username;
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Update the global user variable
            user.username = data.data.username;

            // Clean up edit mode
            input.remove();
            saveBtn.remove();
            cancelBtn.remove();
            errorMsg.remove();
            usernameElement.style.display = '';
            editUsernameBtn.style.display = '';
          } else {
            showError(data.message || 'Failed to update username');
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            input.disabled = false;
          }
        } catch (error) {
          console.error('Error updating username:', error);
          showError('Network error: ' + error.message);
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
          input.disabled = false;
        }
      };

      saveBtn.addEventListener('click', saveEdit);

      // Enter key to save
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveEdit();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });
    });
  }

  // Change Password Button
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check if tooltip already exists
      let tooltip = changePasswordBtn.querySelector('.apple-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'apple-tooltip';
        tooltip.textContent = 'Coming Soon';
        changePasswordBtn.appendChild(tooltip);
      }
      
      // Show tooltip
      tooltip.classList.add('show');
      
      // Hide after 2 seconds
      setTimeout(() => {
        tooltip.classList.remove('show');
      }, 2000);
    });
  }

  // Two-Factor Authentication Toggle
  const twoFactorToggle = document.getElementById('twoFactorToggle');
  if (twoFactorToggle) {
    const toggleLabel = twoFactorToggle.closest('.toggle-switch');
    twoFactorToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        e.target.checked = false;
        
        // Check if tooltip already exists
        let tooltip = toggleLabel.querySelector('.apple-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.className = 'apple-tooltip';
          tooltip.textContent = 'Coming Soon';
          toggleLabel.appendChild(tooltip);
        }
        
        // Show tooltip
        tooltip.classList.add('show');
        
        // Hide after 2 seconds
        setTimeout(() => {
          tooltip.classList.remove('show');
        }, 2000);
      }
    });
  }

  // Email Notifications Toggle
  const emailNotifToggle = document.getElementById('emailNotifToggle');
  if (emailNotifToggle) {
    // Load saved preference
    const emailNotifEnabled = localStorage.getItem('emailNotifications') !== 'false';
    emailNotifToggle.checked = emailNotifEnabled;

    emailNotifToggle.addEventListener('change', (e) => {
      localStorage.setItem('emailNotifications', e.target.checked);
      console.log('Email notifications:', e.target.checked ? 'enabled' : 'disabled');
    });
  }

  // Task Reminders Toggle
  const taskReminderToggle = document.getElementById('taskReminderToggle');
  if (taskReminderToggle) {
    // Load saved preference
    const taskRemindersEnabled = localStorage.getItem('taskReminders') !== 'false';
    taskReminderToggle.checked = taskRemindersEnabled;

    taskReminderToggle.addEventListener('change', (e) => {
      localStorage.setItem('taskReminders', e.target.checked);
      console.log('Task reminders:', e.target.checked ? 'enabled' : 'disabled');
    });
  }

  // Delete Account Button
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      const confirmation = confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
      );
      
      if (confirmation) {
        const finalConfirm = prompt('Type "DELETE" to confirm account deletion:');
        if (finalConfirm === 'DELETE') {
          // TODO: Implement account deletion API call
          alert('Account deletion functionality will be implemented soon');
        } else {
          alert('Account deletion cancelled');
        }
      }
    });
  }
}