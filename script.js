/* Basic To-Do List with Local Storage
   Features:
   - Add, toggle complete, delete tasks
   - Filter (all/active/completed)
   - Clear completed
   - Persistent via localStorage
*/

const STORAGE_KEY = 'my_todo_tasks_v1';

const refs = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  list: document.getElementById('task-list'),
  emptyState: document.getElementById('empty-state'),
  leftInfo: document.getElementById('left-info'),
  filters: Array.from(document.querySelectorAll('.filter')),
  clearCompletedBtn: document.getElementById('clear-completed'),
};

let tasks = []; // { id, text, completed, createdAt }
let currentFilter = 'all';

init();

function init(){
  loadFromStorage();
  bindEvents();
  render();
}

function bindEvents(){
  refs.form.addEventListener('submit', onAdd);
  refs.filters.forEach(btn => btn.addEventListener('click', onFilterClick));
  refs.clearCompletedBtn.addEventListener('click', clearCompleted);
  refs.input.addEventListener('input', onInput);
  // accessibility: listen for keyboard actions inside list
  refs.list.addEventListener('click', onListClick);
  refs.list.addEventListener('keydown', onListKeydown);
}

function onInput(){
  // optional: enable/disable add button
  const addBtn = document.getElementById('add-btn');
  if(addBtn) addBtn.disabled = refs.input.value.trim() === '';
}

function onAdd(e){
  e.preventDefault();
  const text = refs.input.value.trim();
  if (!text) return;
  const task = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task); // newest first
  refs.input.value = '';
  saveToStorage();
  render();
}

function onFilterClick(e){
  const btn = e.currentTarget;
  currentFilter = btn.dataset.filter || 'all';
  refs.filters.forEach(f => {
    f.classList.toggle('active', f === btn);
    f.setAttribute('aria-selected', String(f === btn));
  });
  render();
}

function onListClick(e){
  const el = e.target;
  const item = el.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;
  if (el.classList.contains('btn-delete') || el.closest('.btn-delete')) {
    removeTask(id);
  } else if (el.classList.contains('checkbox') || el.closest('.checkbox')) {
    toggleTask(id);
  }
}

function onListKeydown(e){
  // allow Enter/Space to toggle checkbox when focused
  if (e.key === 'Enter' || e.key === ' ') {
    const el = e.target;
    if (el.classList && el.classList.contains('checkbox')) {
      e.preventDefault();
      const id = el.closest('.task-item').dataset.id;
      toggleTask(id);
    }
  }
}

function toggleTask(id){
  tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  saveToStorage();
  render();
}

function removeTask(id){
  tasks = tasks.filter(t => t.id !== id);
  saveToStorage();
  render();
}

function clearCompleted(){
  const any = tasks.some(t => t.completed);
  if (!any) return;
  // optional confirm
  if (!confirm('Clear all completed tasks?')) return;
  tasks = tasks.filter(t => !t.completed);
  saveToStorage();
  render();
}

function filteredTasks(){
  if (currentFilter === 'active') return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t => t.completed);
  return tasks;
}

function render(){
  const list = filteredTasks();
  refs.list.innerHTML = '';
  if (list.length === 0) {
    refs.emptyState.style.display = 'block';
  } else {
    refs.emptyState.style.display = 'none';
  }

  for (const task of list) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    li.innerHTML = `
      <div class="task-left">
        <div class="checkbox ${task.completed ? 'checked' : ''}" role="button" tabindex="0" aria-pressed="${task.completed}">
          ${task.completed ? '&#10003;' : ''}
        </div>
        <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
      </div>
      <div class="task-meta">
        <div class="task-time" title="${new Date(task.createdAt).toLocaleString()}">${timeAgo(task.createdAt)}</div>
        <button class="btn-icon btn-delete" aria-label="Delete task">🗑</button>
      </div>
    `;
    refs.list.appendChild(li);
  }

  updateLeftInfo();
}

function updateLeftInfo(){
  const total = tasks.length;
  const activeCount = tasks.filter(t => !t.completed).length;
  refs.leftInfo.textContent = `${activeCount} active • ${total} total`;
}

function saveToStorage(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('LocalStorage save failed', err);
  }
}

function loadFromStorage(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) tasks = JSON.parse(raw);
  } catch (err) {
    console.error('LocalStorage load failed', err);
    tasks = [];
  }
}

function timeAgo(iso){
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  const days = Math.floor(diff/86400);
  return `${days}d`;
}

function escapeHtml(text){
  // simple sanitization
  return text.replace(/[&<>"']/g, (c) => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[c]);
}