// Make editTask globally accessible for inline onclick handlers
window.editTask = editTask;
// Load tasks from backend for logged-in user
async function loadTasksFromBackend() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      tasks = data.data || [];
    } else {
      tasks = [];
    }
  } catch (err) {
    tasks = [];
  }
}
window.renderTasks = renderTasks;

// On page load, fetch tasks from backend
window.addEventListener('DOMContentLoaded', async () => {
  await loadTasksFromBackend();
  renderTasks(currentFilter);
  updateStats();
  updateChart();
});
// Remove all mock tasks. Tasks will be loaded from the backend.

// Load tasks from localStorage or use mock data
let tasks = [];

// Save tasks is now handled by backend

// Format date for display
function formatDistanceToNow(date) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((then - now) / 1000);
  
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return `${absDiff} seconds ago`;
    if (absDiff < 3600) return `${Math.floor(absDiff / 60)} minutes ago`;
    if (absDiff < 86400) return `${Math.floor(absDiff / 3600)} hours ago`;
    return `${Math.floor(absDiff / 86400)} days ago`;
  }
  
  if (diffInSeconds < 60) return `in ${diffInSeconds} seconds`;
  if (diffInSeconds < 3600) return `in ${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `in ${Math.floor(diffInSeconds / 3600)} hours`;
  return `in ${Math.floor(diffInSeconds / 86400)} days`;
}

// Create task card HTML
function createTaskCard(task) {
  const dueDate = task.dueDate ? formatDistanceToNow(task.dueDate) : null;
  
  const index = task.displayIndex !== undefined ? task.displayIndex : '';
  return `
    <div class="task-card">
      <div class="task-card-top">
        <h3 class="task-title">${task.title}</h3>
        <button class="task-menu-btn" data-task-id="${task._id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
        <div class="dropdown-menu" id="menu-${task._id}">
          <button class="dropdown-item" onclick="editTask('${task._id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <div class="dropdown-separator"></div>
          <button class="dropdown-item danger" onclick="deleteTask('${task._id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
      <p class="task-id">${index !== '' ? index + '.' : ''}</p>
      <p class="task-description">${task.description || 'No description provided.'}</p>
      <div class="task-footer">
        <span class="task-status ${task.status}">${task.status.replace('-', ' ')}</span>
        ${dueDate ? `
          <div class="task-time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${dueDate}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Render tasks
function renderTasks(filter = 'all') {
  const tasksGrid = document.getElementById('tasksGrid');
  const emptyState = document.getElementById('emptyState');
  
  let filteredTasks;
  if (filter === 'all' || !filter) {
    filteredTasks = tasks;
  } else {
    filteredTasks = tasks.filter(task => task.status === filter);
  }
  // Add displayIndex for numbering (1-based)
  filteredTasks = filteredTasks.map((task, idx) => ({ ...task, displayIndex: idx + 1 }));
  if (filteredTasks.length === 0) {
    tasksGrid.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    tasksGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    tasksGrid.innerHTML = filteredTasks.map(createTaskCard).join('');
    // Add click handlers for task menu buttons
    document.querySelectorAll('.task-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const menu = document.getElementById(`menu-${taskId}`);
        // Close all other menus
        document.querySelectorAll('.dropdown-menu').forEach(m => {
          if (m.id !== `menu-${taskId}`) m.classList.remove('show');
        });
        menu.classList.toggle('show');
      });
    });
    // Add click handler for delete buttons using event delegation
    document.querySelectorAll('.dropdown-item.danger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.closest('.dropdown-menu').id.replace('menu-', '');
        deleteTask(taskId);
      });
    });
  }
}

// Update stats
function updateStats() {
  const todoCount = tasks.filter(task => task.status === 'todo').length;
  const inProgressCount = tasks.filter(task => task.status === 'in-progress').length;
  const doneCount = tasks.filter(task => task.status === 'done').length;
  const backlogCount = tasks.filter(task => task.status === 'backlog').length;
  
  document.getElementById('todoCount').textContent = todoCount;
  document.getElementById('inProgressCount').textContent = inProgressCount;
  document.getElementById('doneCount').textContent = doneCount;
  document.getElementById('backlogCount').textContent = backlogCount;
}

// Update chart
function updateChart() {
  const ctx = document.getElementById('taskChart');
  if (!ctx) return;
  
  const statusCounts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };
  
  if (window.taskChart && typeof window.taskChart.destroy === 'function') {
    window.taskChart.destroy();
  }
  
  window.taskChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Backlog', 'To Do', 'In Progress', 'Done'],
      datasets: [{
        label: 'Tasks',
        data: [statusCounts.backlog, statusCounts.todo, statusCounts['in-progress'], statusCounts.done],
        backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#16a34a'],
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f9fafb',
          bodyColor: '#d1d5db',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 6,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#6b7280'
          },
          grid: {
            color: '#1f2937'
          }
        },
        x: {
          ticks: {
            color: '#6b7280'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Delete task
function deleteTask(taskId) {
  // Create or show delete modal
  let deleteModal = document.getElementById('deleteTaskModal');
  if (!deleteModal) {
    deleteModal = document.createElement('div');
    deleteModal.id = 'deleteTaskModal';
    deleteModal.className = 'modal';
    deleteModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Delete Task</h2>
          <button class="modal-close" id="closeDeleteModalBtn">&times;</button>
        </div>
        <form id="deleteTaskForm">
          <p>Type <strong>delete</strong> to confirm deletion of this task.</p>
          <input type="text" id="deleteConfirmInput" placeholder="Type 'delete'" autocomplete="off" required>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancelDeleteModalBtn">Cancel</button>
            <button type="submit" class="btn-danger">Delete</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(deleteModal);
  }

  deleteModal.classList.add('show');
  deleteModal.style.display = 'flex';
  document.getElementById('deleteConfirmInput').value = '';

  // Remove previous listeners to avoid duplicates
  const closeBtn = document.getElementById('closeDeleteModalBtn');
  const cancelBtn = document.getElementById('cancelDeleteModalBtn');
  if (closeBtn) {
    closeBtn.onclick = null;
    closeBtn.addEventListener('click', closeDeleteTaskModal);
  }
  if (cancelBtn) {
    cancelBtn.onclick = null;
    cancelBtn.addEventListener('click', closeDeleteTaskModal);
  }

  // Handle form submit
  document.getElementById('deleteTaskForm').onsubmit = async function(e) {
    e.preventDefault();
    const confirmText = document.getElementById('deleteConfirmInput').value.trim().toLowerCase();
    if (confirmText === 'delete') {
      // Delete from backend
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          await loadTasksFromBackend();
          renderTasks(currentFilter);
          updateStats();
          updateChart();
          closeDeleteTaskModal();
          document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        } else {
          alert(data.message || 'Failed to delete task');
        }
      } catch (err) {
        alert('Error deleting task');
      }
    } else {
      document.getElementById('deleteConfirmInput').classList.add('error');
      setTimeout(() => {
        document.getElementById('deleteConfirmInput').classList.remove('error');
      }, 1200);
    }
  };
}

function closeDeleteTaskModal() {
  const deleteModal = document.getElementById('deleteTaskModal');
  if (deleteModal) {
    deleteModal.classList.remove('show');
    deleteModal.style.display = 'none';
    document.getElementById('deleteTaskForm').reset();
  }
}

// Edit task (placeholder)
// Edit Task Modal logic
function editTask(taskId) {
  const task = tasks.find(t => t._id === taskId || t.id === taskId);
  if (!task) return;

  // Create or show edit modal
  let editModal = document.getElementById('editTaskModal');
  if (!editModal) {
    editModal = document.createElement('div');
    editModal.id = 'editTaskModal';
    editModal.className = 'modal';
    editModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Task</h2>
          <button class="modal-close" id="closeEditModalBtn">&times;</button>
        </div>
        <form id="editTaskForm">
          <div class="form-group">
            <label for="editTaskTitle">Task Title</label>
            <input type="text" id="editTaskTitle" name="title" required>
          </div>
          <div class="form-group">
            <label for="editTaskDescription">Description</label>
            <textarea id="editTaskDescription" name="description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="editTaskStatus">Status</label>
            <select id="editTaskStatus" name="status">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>
          <div class="form-group">
            <label for="editTaskDueDate">Due Date (Optional)</label>
            <input type="date" id="editTaskDueDate" name="dueDate">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancelEditModalBtn">Cancel</button>
            <button type="submit" class="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(editModal);
  }

  // Populate form
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskDescription').value = task.description || '';
  document.getElementById('editTaskStatus').value = task.status;
  document.getElementById('editTaskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';

  editModal.classList.add('show');
  editModal.style.display = 'flex';

  // Close modal logic
  document.getElementById('closeEditModalBtn').onclick = closeEditTaskModal;
  document.getElementById('cancelEditModalBtn').onclick = closeEditTaskModal;

  // Handle form submit
  document.getElementById('editTaskForm').onsubmit = async function(e) {
    e.preventDefault();
    const updatedTask = {
      title: document.getElementById('editTaskTitle').value,
      description: document.getElementById('editTaskDescription').value,
      status: document.getElementById('editTaskStatus').value,
      dueDate: document.getElementById('editTaskDueDate').value ? new Date(document.getElementById('editTaskDueDate').value).toISOString() : undefined
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });
      const data = await response.json();
      if (data.success) {
        await loadTasksFromBackend();
        renderTasks(currentFilter);
        updateStats();
        updateChart();
        closeEditTaskModal();
      } else {
        alert(data.message || 'Failed to update task');
      }
    } catch (err) {
      alert('Error updating task');
    }
  };

  // Hide dropdowns
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
}

function closeEditTaskModal() {
  const editModal = document.getElementById('editTaskModal');
  if (editModal) {
    editModal.classList.remove('show');
    editModal.style.display = 'none';
    document.getElementById('editTaskForm').reset();
  }
}

// Current filter
let currentFilter = 'all';

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.task-menu-btn')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});

// Modal functionality
const modal = document.getElementById('createTaskModal');
const createTaskBtn = document.getElementById('createTaskBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const createTaskForm = document.getElementById('createTaskForm');

// Open modal
if (createTaskBtn) {
  createTaskBtn.addEventListener('click', () => {
    modal.classList.add('show');
  });
}

// Close modal
function closeTaskModal() {
  modal.classList.remove('show');
  if (createTaskForm) {
    createTaskForm.reset();
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeTaskModal);
}

if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', closeTaskModal);
}

// Close modal when clicking outside
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeTaskModal();
    }
  });
}

// Handle form submission
if (createTaskForm) {
  createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    if (!title) return;

    // Prepare payload
    const payload = {
      title,
      description,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    };

    // Send to backend
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        // Ensure modal is hidden
        const modal = document.getElementById('createTaskModal');
        if (modal) {
          modal.classList.remove('show');
          modal.style.display = 'none';
        }
        if (createTaskForm) {
          createTaskForm.reset();
        }
        await loadTasksFromBackend();
        renderTasks(currentFilter);
        updateStats();
        updateChart();
      } else {
        alert(data.message || 'Failed to create task');
      }
    } catch (err) {
      alert('Error creating task');
    }
  });
}

