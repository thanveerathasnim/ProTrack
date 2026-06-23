let todos = JSON.parse(localStorage.getItem('todos')) || [];

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// ===== DAILY RESET =====
function checkNewDay() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('lastTodoDate');
  if (lastVisit !== today) {
    todos = todos.filter(t => !t.done); // keep undone tasks
    saveTodos();
    localStorage.setItem('lastTodoDate', today);
  }
}
checkNewDay();

function renderTodos() {
  const list = document.getElementById('todoList');
  const emptyMsg = document.getElementById('todoEmptyMsg');
  const countEl = document.getElementById('todo-count');

  list.innerHTML = '';

  if (todos.length === 0) {
    emptyMsg.style.display = 'block';
    countEl.textContent = '0 of 0 done';
    updateTodoBanner();
    return;
  }

  emptyMsg.style.display = 'none';

  let doneCount = 0;

  // Sort by priority: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  sorted.forEach((todo, index) => {
    if (todo.done) doneCount++;

    const actualIndex = todos.indexOf(todo);
    const priorityEmoji = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';

    const li = document.createElement('li');
    li.className = 'habit-item' + (todo.done ? ' done' : '');
    li.innerHTML = `
      <span class="habit-check ${todo.done ? '' : 'empty'}"
        onclick="toggleTodo(${actualIndex})">
        ${todo.done ? '✓' : '○'}
      </span>
      <span class="todo-priority">${priorityEmoji}</span>
      <span>${todo.name}</span>
      <span class="habit-delete" onclick="deleteTodo(${actualIndex})">🗑</span>
    `;
    list.appendChild(li);
  });

  countEl.textContent = `${doneCount} of ${todos.length} done`;
  updateTodoBanner();
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const priority = document.getElementById('todoPriority').value;
  const name = input.value.trim();
  if (!name) return;

  todos.push({ name, priority, done: false });
  saveTodos();
  renderTodos();
  input.value = '';
  input.focus();

  // Show in-page notification
  showToast('Task added successfully! 🌱');
}

function toggleTodo(index) {
  todos[index].done = !todos[index].done;
  saveTodos();
  renderTodos();

  if (todos[index].done) {
    showToast('Great job! Task completed 🎉');
  }

  // Check if all done
  if (todos.every(t => t.done) && todos.length > 0) {
    showToast('Amazing! All tasks completed for today! 🔥');
  }
}

function deleteTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

// ===== BANNER =====
function updateTodoBanner() {
  const banner = document.getElementById('todoBanner');
  if (!banner) return;

  if (todos.length === 0) {
    banner.innerHTML = `<span>🔔</span><p>You haven't added any tasks yet! Add your first task above 🌱</p>`;
    banner.style.display = 'flex';
  } else if (todos.every(t => t.done)) {
    banner.innerHTML = `<span>🎉</span><p>All tasks done for today! You're crushing it! 🔥</p>`;
    banner.style.display = 'flex';
  } else if (todos.every(t => !t.done)) {
    banner.innerHTML = `<span>🔔</span><p>You have pending tasks! Start checking them off 💪</p>`;
    banner.style.display = 'flex';
  } else {
    const remaining = todos.filter(t => !t.done).length;
    banner.innerHTML = `<span>💪</span><p>${remaining} task${remaining > 1 ? 's' : ''} remaining — keep going! 🌿</p>`;
    banner.style.display = 'flex';
  }
}

// ===== TOAST NOTIFICATION (in-page) =====
function showToast(message) {
  const existing = document.getElementById('toastMsg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toastMsg';
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('toast-show'), 100);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ===== BROWSER PUSH NOTIFICATIONS =====
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showToast('Notifications enabled! 🔔');
        scheduleReminders();
      }
    });
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '🌿'
    });
  }
}

function scheduleReminders() {
  // Check every minute if there are pending tasks
  setInterval(() => {
    const pending = todos.filter(t => !t.done);
    if (pending.length > 0) {
      sendBrowserNotification(
        '🌿 ProTrack Reminder',
        `You have ${pending.length} pending task${pending.length > 1 ? 's' : ''} today!`
      );
    }
  }, 60000); // every 60 seconds
}

// ===== ENTER KEY =====
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('todoInput');
  if (input) {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') addTodo();
    });
  }

  // Request notification permission on page load
  requestNotificationPermission();

  // If already granted, schedule reminders
  if ('Notification' in window && Notification.permission === 'granted') {
    scheduleReminders();
  }
});

renderTodos();