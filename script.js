// Basic in-memory tasks array. Each task: { id, text, completed }
const tasks = [];

const elements = {
  input: document.getElementById('taskInput'),
  addBtn: document.getElementById('addBtn'),
  list: document.getElementById('taskList'),
  filters: Array.from(document.querySelectorAll('.filter-btn')),
  darkToggle: document.getElementById('darkModeToggle'),
  modal: document.getElementById('confirmModal'),
  confirmDelete: document.getElementById('confirmDelete'),
  cancelDelete: document.getElementById('cancelDelete')
};

let currentFilter = 'all';
let toDeleteId = null;

// Initialize event listeners
elements.addBtn.addEventListener('click', onAdd);
elements.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') onAdd();
});
elements.filters.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter, btn));
});

elements.darkToggle.addEventListener('change', toggleDarkMode);

// Modal actions
elements.cancelDelete.addEventListener('click', closeModal);
elements.confirmDelete.addEventListener('click', () => {
  if (toDeleteId !== null) {
    removeTaskById(toDeleteId, true);
    toDeleteId = null;
  }
  closeModal();
});
elements.modal.addEventListener('click', (e) => {
  if (e.target === elements.modal) closeModal();
});

// Add sample focus on load
elements.input.focus();

function onAdd(){
  const txt = elements.input.value.trim();
  if(!txt) {
    elements.input.focus();
    return alert('Please enter a task.');
  }
  const task = { id: Date.now(), text: txt, completed: false };
  tasks.unshift(task); // newest on top
  elements.input.value = '';
  renderTask(task, true);
  applyFilter(); // ensure visibility matches current filter
}

// Render a single task (insert at top)
function renderTask(task, animate = false){
  const li = document.createElement('li');
  li.className = 'task';
  li.dataset.id = task.id;
  li.dataset.completed = task.completed ? '1' : '0';

  li.innerHTML = `
    <div class="left">
      <div class="check ${task.completed ? 'checked' : ''}" role="button" aria-label="Toggle complete" tabindex="0"></div>
      <div class="content">
        <div class="task-text ${task.completed ? 'completed' : ''}"></div>
      </div>
    </div>
    <div class="btns">
      <button class="btn edit" title="Edit">Edit</button>
      <button class="btn danger" title="Delete">Delete</button>
    </div>
  `;

  // populate text (sanitized)
  const textNode = li.querySelector('.task-text');
  textNode.textContent = task.text;

  // handlers
  const check = li.querySelector('.check');
  check.addEventListener('click', () => toggleComplete(task.id, li));
  check.addEventListener('keypress', (e) => { if (e.key === 'Enter') toggleComplete(task.id, li); });

  const editBtn = li.querySelector('.btn.edit');
  editBtn.addEventListener('click', () => enableEdit(li, task.id));

  const delBtn = li.querySelector('.btn.danger');
  delBtn.addEventListener('click', () => promptDelete(task.id));

  // insert at top
  elements.list.insertBefore(li, elements.list.firstChild);

  // animate in
  if (animate) {
    li.classList.add('enter');
    requestAnimationFrame(() => { // next frame
      li.classList.add('enter-active');
      li.classList.remove('enter');
      setTimeout(() => li.classList.remove('enter-active'), 300);
    });
  }
}

// Toggle completed
function toggleComplete(id, liElement){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  t.completed = !t.completed;
  liElement.dataset.completed = t.completed ? '1' : '0';
  liElement.querySelector('.check').classList.toggle('checked', t.completed);
  const txt = liElement.querySelector('.task-text');
  txt.classList.toggle('completed', t.completed);
  applyFilter();
}

// Enable edit mode: replace text with input
function enableEdit(li, id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  const content = li.querySelector('.content');
  const textDiv = li.querySelector('.task-text');

  // Create input pre-filled
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = t.text;
  content.replaceChild(input, textDiv);
  input.focus();
  // select the text
  input.setSelectionRange(0, input.value.length);

  // save function
  function saveEdit(){
    const newVal = input.value.trim();
    if(newVal === ''){
      // don't allow empty; restore old
      cancelEdit();
      return alert('Task cannot be empty.');
    }
    t.text = newVal;
    finish();
  }
  function cancelEdit(){
    content.replaceChild(textDiv, input);
  }
  function finish(){
    textDiv.textContent = t.text;
    content.replaceChild(textDiv, input);
  }

  // keyboard handlers
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    else if (e.key === 'Escape') cancelEdit();
  });

  // blur: save
  input.addEventListener('blur', saveEdit);
}

// Prompt delete using modal
function promptDelete(id){
  toDeleteId = id;
  openModal();
}

function removeTaskById(id, skipAnim = false){
  const idx = tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  tasks.splice(idx,1);
  const li = elements.list.querySelector(`li[data-id="${id}"]`);
  if (!li) return;
  if (skipAnim){
    li.remove();
    return;
  }
  li.classList.add('exiting');
  setTimeout(()=> li.remove(), 260);
}

// Filters
function setFilter(filter, btnElement){
  currentFilter = filter;
  elements.filters.forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
    b.setAttribute('aria-selected', String(b.dataset.filter === filter));
  });
  applyFilter();
}
function applyFilter(){
  const items = Array.from(elements.list.children);
  items.forEach(li => {
    const completed = li.dataset.completed === '1';
    let hide = false;
    if (currentFilter === 'completed' && !completed) hide = true;
    if (currentFilter === 'pending' && completed) hide = true;
    li.style.display = hide ? 'none' : '';
  });
}

// Modal open/close
function openModal(){ elements.modal.classList.remove('hidden'); }
function closeModal(){ elements.modal.classList.add('hidden'); }

// Dark mode
function toggleDarkMode(e){
  if (e.target.checked) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

/* OPTIONAL: seed with a small example task to show behaviour */
(function seedExample(){
  const example = { id: Date.now()+1, text: 'Welcome — try adding, editing, filtering', completed: false };
  tasks.push(example);
  renderTask(example);
})();
