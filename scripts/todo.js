const api = {
    async getByDate(date) {
        const res = await fetch(`/api/tasks?date=${date}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async insert(text, date) {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: text, data_tasks: date })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async update(id, newText) {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: newText })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async delete(id) {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
    }
};

const btnAdd          = document.getElementById('btnAdd');
const btnDelete       = document.getElementById('btnDelete');
const btnEdit         = document.getElementById('btnEdit');
const taskInput       = document.getElementById('taskInput');
const inputArea       = document.getElementById('inputArea');
const editHint        = document.getElementById('editHint');
const saveTask        = document.getElementById('saveTask');
const cancelTask      = document.getElementById('cancelTask');
const taskList        = document.getElementById('taskList');
const emptyState      = document.getElementById('emptyState');
const taskCounter     = document.getElementById('taskCounter');
const currentDateLabel = document.getElementById('currentDateLabel');
const completedCount   = document.getElementById('completedCount');
const totalCount       = document.getElementById('totalCount');
const progressBar      = document.getElementById('progressBar');
const progressMessage  = document.getElementById('progressMessage');
const nextTaskText     = document.getElementById('nextTaskText');

let tasks      = [];
let selectedId = null;
let mode       = null;
let currentDate = null;

function completionKey() {
    return `dayline-completed-${currentDate}`;
}

function getCompletedIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(completionKey()) || '[]').map(String));
    } catch {
        return new Set();
    }
}

function saveCompletedIds(ids) {
    localStorage.setItem(completionKey(), JSON.stringify([...ids]));
}

function updateFocus() {
    const completed = getCompletedIds();
    const done = tasks.filter(task => completed.has(String(task.tasks_id))).length;
    const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const next = tasks.find(task => !completed.has(String(task.tasks_id)));

    completedCount.textContent = done;
    totalCount.textContent = `из ${tasks.length} выполнено`;
    progressBar.style.width = `${percent}%`;
    progressMessage.textContent = !tasks.length
        ? 'Добавьте первую задачу на этот день.'
        : done === tasks.length
            ? 'Отлично! Все задачи на день выполнены.'
            : `Готово ${percent}%. Продолжайте в том же темпе.`;
    nextTaskText.textContent = !tasks.length ? 'Пока задач нет' : next ? next.tasks : 'Все задачи выполнены';
}

function formatDateLabel(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateCounter() {
    taskCounter.textContent = tasks.length
        ? `${tasks.length} ${tasks.length === 1 ? 'задача' : tasks.length < 5 ? 'задачи' : 'задач'}`
        : '';
}

function setSelected(id) {
    selectedId = id;
    btnEdit.disabled = !id;
    btnDelete.disabled = !id;
    document.querySelectorAll('#taskList li[data-id]').forEach(el => {
        const sel = String(el.dataset.id) === String(id);
        el.classList.toggle('bg-white/15', sel);
        el.classList.toggle('bg-white/5', !sel);
    });
}

function render() {
    taskList.querySelectorAll('li[data-id]').forEach(el => el.remove());

    if (tasks.length === 0) {
        emptyState.style.display = '';
        updateCounter();
        updateFocus();
        return;
    }
    emptyState.style.display = 'none';

    const completed = getCompletedIds();
    tasks.forEach(task => {
        const isCompleted = completed.has(String(task.tasks_id));
        const li = document.createElement('li');
        li.dataset.id = task.tasks_id;
        li.className = `group flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 cursor-pointer transition-all duration-150
            ${String(task.tasks_id) === String(selectedId) ? 'bg-white/15' : 'bg-white/5'} hover:bg-white/10`;

        li.innerHTML = `
            <button type="button" class="complete-toggle flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition
                ${isCompleted ? 'border-emerald-300 bg-emerald-500 text-white' : 'border-white/30 bg-white/5 text-transparent'}"
                aria-label="${isCompleted ? 'Вернуть задачу в работу' : 'Отметить задачу выполненной'}">✓</button>
            <span class="flex-1 select-none text-sm leading-tight text-white ${isCompleted ? 'line-through opacity-50' : ''}">${escape(task.tasks)}</span>
            <button class="inline-delete opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center
                justify-center rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-all duration-150"
                aria-label="Удалить">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M2 2l8 8M10 2l-8 8"/>
                </svg>
            </button>
        `;

        li.querySelector('.complete-toggle').addEventListener('click', e => {
            e.stopPropagation();
            const ids = getCompletedIds();
            const id = String(task.tasks_id);
            ids.has(id) ? ids.delete(id) : ids.add(id);
            saveCompletedIds(ids);
            render();
        });

        li.addEventListener('click', e => {
            if (e.target.closest('.inline-delete')) return;
            setSelected(String(task.tasks_id) === String(selectedId) ? null : task.tasks_id);
        });

        li.querySelector('.inline-delete').addEventListener('click', async e => {
            e.stopPropagation();
            try {
                await api.delete(task.tasks_id);
                tasks = tasks.filter(t => String(t.tasks_id) !== String(task.tasks_id));
                const ids = getCompletedIds();
                ids.delete(String(task.tasks_id));
                saveCompletedIds(ids);
                if (String(selectedId) === String(task.tasks_id)) selectedId = null;
                render();
            } catch (err) {
                console.error('Ошибка удаления:', err);
            }
        });

        taskList.appendChild(li);
    });

    updateCounter();
    updateFocus();
}

function showInput(placeholder, hint, value = '') {
    inputArea.classList.remove('hidden');
    taskInput.placeholder = placeholder;
    taskInput.value = value;
    editHint.classList.toggle('hidden', !hint);
    editHint.textContent = hint || '';
    taskInput.focus();
    if (value) taskInput.select();
}

function hideInput() {
    inputArea.classList.add('hidden');
    taskInput.value = '';
    mode = null;
}

btnAdd.addEventListener('click', () => {
    mode = 'add';
    setSelected(null);
    showInput('Введите задачу...', 'Новая задача');
});

btnDelete.addEventListener('click', async () => {
    const idToDelete = selectedId;
    if (!idToDelete) return;
    try {
        await runWithButtonLoading(btnDelete, () => api.delete(idToDelete), 'Удаление...');
        tasks = tasks.filter(t => String(t.tasks_id) !== String(idToDelete));
        const ids = getCompletedIds();
        ids.delete(String(idToDelete));
        saveCompletedIds(ids);
        if (String(selectedId) === String(idToDelete)) selectedId = null;
        hideInput();
        render();
    } catch (e) {
        console.error('Ошибка удаления:', e);
    }
});

btnEdit.addEventListener('click', () => {
    if (!selectedId) return;
    const task = tasks.find(t => String(t.tasks_id) === String(selectedId));
    if (!task) return;
    mode = 'edit';
    showInput('Новое название...', 'Редактирование задачи', task.tasks);
});

async function saveCurrentTask() {
    const text = taskInput.value.trim();
    if (!text || !mode) {
        taskInput.focus();
        return;
    }

    try {
        await runWithButtonLoading(saveTask, async () => {
            if (mode === 'add') {
                const newTask = await api.insert(text, currentDate);
                tasks.push(newTask);
            } else if (mode === 'edit' && selectedId) {
                await api.update(selectedId, text);
                const task = tasks.find(t => String(t.tasks_id) === String(selectedId));
                if (task) task.tasks = text;
            }
        }, 'Сохранение...');
        hideInput();
        render();
    } catch (e) {
        console.error('Ошибка сохранения задачи:', e);
    }
}

saveTask.addEventListener('click', saveCurrentTask);
cancelTask.addEventListener('click', hideInput);

taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveCurrentTask();
    }
    if (e.key === 'Escape') hideInput();
});

async function loadTasksForDate(date) {
    currentDate = date;
    hideInput();
    selectedId = null;
    setSelected(null);
    currentDateLabel.textContent = formatDateLabel(date);
    try {
        tasks = await api.getByDate(date);
        render();
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        tasks = [];
        render();
    }
}

window.addEventListener('dateSelected', e => {
    loadTasksForDate(e.detail.date);
});
