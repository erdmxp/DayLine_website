const financeForm = document.getElementById('financeForm');
const operationType = document.getElementById('operationType');
const operationCategory = document.getElementById('operationCategory');
const operationAmount = document.getElementById('operationAmount');
const operationDate = document.getElementById('operationDate');
const operationDescription = document.getElementById('operationDescription');

const filterMonth = document.getElementById('filterMonth');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');

const financeList = document.getElementById('financeList');
const emptyFinanceState = document.getElementById('emptyFinanceState');
const financeCounter = document.getElementById('financeCounter');
const currentFinanceMonthLabel = document.getElementById('currentFinanceMonthLabel');

const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const totalBalance = document.getElementById('totalBalance');

const expenseCategories = [
  'продукты',
  'жкх',
  'учеба',
  'переводы',
  'подписки',
  'прочее'
];

const incomeCategories = [
  'зарплата',
  'перевод',
  'возврат'
];

function getTodayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getCurrentMonth() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

function getMonthLabel(value) {
  if (!value) {
    return 'Месяц не выбран';
  }

  const parts = value.split('-');
  const year = parts[0];
  const month = Number(parts[1]);

  const monthNames = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
  ];

  return `${monthNames[month - 1]} ${year}`;
}

function formatMoney(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}

function getCategoriesByType(type) {
  if (type === 'income') {
    return incomeCategories;
  }

  return expenseCategories;
}

function fillCategorySelect(selectElement, type, includeAll = false) {
  const categories = getCategoriesByType(type);

  selectElement.innerHTML = '';

  if (includeAll) {
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Все';
    allOption.className = 'text-black';
    selectElement.appendChild(allOption);
  } else {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Выберите категорию';
    emptyOption.className = 'text-black';
    selectElement.appendChild(emptyOption);
  }

  for (let i = 0; i < categories.length; i++) {
    const option = document.createElement('option');
    option.value = categories[i];
    option.textContent = categories[i];
    option.className = 'text-black';
    selectElement.appendChild(option);
  }
}

function fillFilterCategories() {
  const currentType = filterType.value;

  if (!currentType) {
    filterCategory.innerHTML = `
      <option value="" class="text-black">Все</option>
      <option value="продукты" class="text-black">продукты</option>
      <option value="жкх" class="text-black">жкх</option>
      <option value="учеба" class="text-black">учеба</option>
      <option value="переводы" class="text-black">переводы</option>
      <option value="подписки" class="text-black">подписки</option>
      <option value="прочее" class="text-black">прочее</option>
      <option value="зарплата" class="text-black">зарплата</option>
      <option value="перевод" class="text-black">перевод</option>
      <option value="возврат" class="text-black">возврат</option>
    `;
    return;
  }

  fillCategorySelect(filterCategory, currentType, true);
}

function buildQueryString() {
  const params = new URLSearchParams();

  if (filterMonth.value) {
    params.set('month', filterMonth.value);
  }

  if (filterType.value) {
    params.set('type', filterType.value);
  }

  if (filterCategory.value) {
    params.set('category', filterCategory.value);
  }

  return params.toString();
}

function renderFinanceList(items) {
  financeList.innerHTML = '';

  if (!items.length) {
    emptyFinanceState.classList.remove('hidden');
    financeCounter.textContent = '0 операций';
    return;
  }

  emptyFinanceState.classList.add('hidden');
  financeCounter.textContent = `${items.length} операций`;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const li = document.createElement('li');

    const amountClass = item.type === 'income'
      ? 'text-emerald-300'
      : 'text-rose-300';

    const amountPrefix = item.type === 'income' ? '+' : '-';
    const typeLabel = item.type === 'income' ? 'Начисление' : 'Расход';

    li.className = 'rounded-2xl border border-white/10 bg-white/5 p-4';

    li.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-base font-semibold">${item.category}</p>
            <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">${typeLabel}</span>
          </div>
          <p class="mt-2 text-sm text-white/70">${item.description || 'Без описания'}</p>
          <p class="mt-2 text-xs text-white/50">${item.date_formatted}</p>
        </div>

        <div class="text-right">
          <p class="text-lg font-semibold ${amountClass}">
            ${amountPrefix}${formatMoney(item.amount)}
          </p>
          <button
            type="button"
            data-id="${item.transaction_id}"
            class="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/20"
          >
            Удалить
          </button>
        </div>
      </div>
    `;

    financeList.appendChild(li);
  }
}

function renderSummary(summary) {
  const income = Number(summary.total_income || 0);
  const expense = Number(summary.total_expense || 0);
  const balance = Number(summary.balance || 0);

  totalIncome.textContent = formatMoney(income);
  totalExpense.textContent = formatMoney(expense);
  totalBalance.textContent = formatMoney(balance);

  if (balance > 0) {
    totalBalance.className = 'mt-2 text-2xl font-semibold text-emerald-300';
  } else if (balance < 0) {
    totalBalance.className = 'mt-2 text-2xl font-semibold text-rose-300';
  } else {
    totalBalance.className = 'mt-2 text-2xl font-semibold text-cyan-300';
  }
}

async function loadTransactions() {
  const query = buildQueryString();
  const url = query ? `/api/wallet?${query}` : '/api/wallet';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Не удалось загрузить операции');
  }

  const data = await response.json();
  renderFinanceList(data);
}

async function loadSummary() {
  const query = buildQueryString();
  const url = query ? `/api/wallet/summary?${query}` : '/api/wallet/summary';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Не удалось загрузить итоги');
  }

  const data = await response.json();
  renderSummary(data);
}

async function updateFinanceView() {
  try {
    currentFinanceMonthLabel.textContent = getMonthLabel(filterMonth.value);
    await loadTransactions();
    await loadSummary();
  } catch (error) {
    console.error(error);
    alert('Ошибка при загрузке данных финансов');
  }
}

operationType.addEventListener('change', () => {
  fillCategorySelect(operationCategory, operationType.value, false);
});

filterType.addEventListener('change', async () => {
  fillFilterCategories();
  await updateFinanceView();
});

filterMonth.addEventListener('change', updateFinanceView);
filterCategory.addEventListener('change', updateFinanceView);

financeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const type = operationType.value;
  const category = operationCategory.value;
  const amount = Number(operationAmount.value);
  const date = operationDate.value;
  const description = operationDescription.value.trim();

  if (!category || !amount || !date) {
    alert('Заполни тип, категорию, сумму и дату');
    return;
  }

  const response = await fetch('/api/wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      category,
      amount,
      date,
      description
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    alert(errorText || 'Ошибка при добавлении операции');
    return;
  }

  financeForm.reset();
  operationType.value = 'expense';
  operationDate.value = getTodayDate();
  fillCategorySelect(operationCategory, operationType.value, false);

  await updateFinanceView();
});

financeList.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-id]');

  if (!button) {
    return;
  }

  const id = button.dataset.id;

  const response = await fetch(`/api/wallet/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    alert('Ошибка при удалении операции');
    return;
  }

  await updateFinanceView();
});

function initFinancePage() {
  operationDate.value = getTodayDate();
  filterMonth.value = getCurrentMonth();

  fillCategorySelect(operationCategory, 'expense', false);
  fillFilterCategories();
  updateFinanceView();
}

initFinancePage();