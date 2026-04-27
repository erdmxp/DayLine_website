const api = {
  async searchProducts(query) {
    const res = await fetch(`/api/nutrition/products/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getEntriesByDate(date) {
    const res = await fetch(`/api/nutrition?date=${date}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async addEntry(payload) {
    const res = await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteEntry(id) {
    const res = await fetch(`/api/nutrition/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

const foodDate = document.getElementById('foodDate');
const productSearch = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const gramsInput = document.getElementById('gramsInput');
const addFoodBtn = document.getElementById('addFoodBtn');

const selectedProductName = document.getElementById('selectedProductName');
const selectedCalories = document.getElementById('selectedCalories');
const selectedProteins = document.getElementById('selectedProteins');
const selectedCarbs = document.getElementById('selectedCarbs');
const selectedFats = document.getElementById('selectedFats');

const foodList = document.getElementById('foodList');
const emptyNutritionState = document.getElementById('emptyNutritionState');
const entriesCounter = document.getElementById('entriesCounter');
const currentNutritionDateLabel = document.getElementById('currentNutritionDateLabel');

const totalCalories = document.getElementById('totalCalories');
const totalProteins = document.getElementById('totalProteins');
const totalCarbs = document.getElementById('totalCarbs');
const totalFats = document.getElementById('totalFats');

let entries = [];
let foundProducts = [];
let selectedProduct = null;
let currentDate = null;
let searchTimeout = null;

function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function setTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  foodDate.value = today;
  currentDate = today;
  currentNutritionDateLabel.textContent = formatDateLabel(today);
}

function resetSelectedProduct() {
  selectedProduct = null;
  selectedProductName.textContent = 'Пока не выбран';
  selectedCalories.textContent = '0';
  selectedProteins.textContent = '0';
  selectedCarbs.textContent = '0';
  selectedFats.textContent = '0';
}

function setSelectedProduct(product) {
  selectedProduct = product;
  productSearch.value = product.name_product;
  selectedProductName.textContent = product.name_product;
  selectedCalories.textContent = product.calories;
  selectedProteins.textContent = product.proteins;
  selectedCarbs.textContent = product.carbohydrates;
  selectedFats.textContent = product.fats;
  hideSearchResults();
}

function hideSearchResults() {
  searchResults.classList.add('hidden');
  searchResults.innerHTML = '';
}

function renderSearchResults(products) {
  if (!products.length) {
    searchResults.innerHTML = `
      <li class="rounded-xl px-4 py-3 text-sm text-white/70">
        Ничего не найдено
      </li>
    `;
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = '';

  products.forEach(product => {
    const li = document.createElement('li');
    li.className = 'cursor-pointer rounded-xl px-4 py-3 transition hover:bg-white/10';
    li.innerHTML = `
      <div class="font-medium text-white">${product.name_product}</div>
      <div class="mt-1 text-xs text-white/65">
        ${product.calories} ккал · Б ${product.proteins} · У ${product.carbohydrates} · Ж ${product.fats}
      </div>
    `;

    li.addEventListener('click', () => {
      setSelectedProduct(product);
    });

    searchResults.appendChild(li);
  });

  searchResults.classList.remove('hidden');
}

function calculateTotals() {
  const totals = entries.reduce(
    (acc, item) => {
      acc.calories += Number(item.calories) || 0;
      acc.proteins += Number(item.proteins) || 0;
      acc.carbs += Number(item.carbs) || 0;
      acc.fats += Number(item.fats) || 0;
      return acc;
    },
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  );

  totalCalories.textContent = Math.round(totals.calories);
  totalProteins.textContent = Math.round(totals.proteins);
  totalCarbs.textContent = Math.round(totals.carbs);
  totalFats.textContent = Math.round(totals.fats);
}

function updateEntriesCounter() {
  entriesCounter.textContent = entries.length
    ? `${entries.length} ${entries.length === 1 ? 'продукт' : entries.length < 5 ? 'продукта' : 'продуктов'}`
    : '';
}

function renderEntries() {
  foodList.innerHTML = '';

  if (!entries.length) {
    emptyNutritionState.style.display = '';
    updateEntriesCounter();
    calculateTotals();
    return;
  }

  emptyNutritionState.style.display = 'none';

  entries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md';
    li.innerHTML = `
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-lg font-semibold">${entry.food_name}</p>
      <p class="mt-1 text-sm text-white/70">${entry.grams} г</p>
      <p class="mt-1 text-xs text-white/60">${entry.food_date_formatted}</p>
      <div class="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
        <span class="rounded-full bg-white/10 px-3 py-1">${entry.calories} ккал</span>
        <span class="rounded-full bg-white/10 px-3 py-1">Б ${entry.proteins}</span>
        <span class="rounded-full bg-white/10 px-3 py-1">У ${entry.carbs}</span>
        <span class="rounded-full bg-white/10 px-3 py-1">Ж ${entry.fats}</span>
      </div>
    </div>

    <button
      class="delete-entry rounded-full bg-red-500/20 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/30"
      data-id="${entry.calories_id}"
    >
      Удалить
    </button>
  </div>
`;

    li.querySelector('.delete-entry').addEventListener('click', async () => {
      try {
        await api.deleteEntry(entry.calories_id);
        entries = entries.filter(item => String(item.calories_id) !== String(entry.calories_id));
        renderEntries();
      } catch (err) {
        console.error('Ошибка удаления:', err);
      }
    });

    foodList.appendChild(li);
  });

  updateEntriesCounter();
  calculateTotals();
}

async function loadEntriesByDate(date) {
  currentDate = date;
  currentNutritionDateLabel.textContent = formatDateLabel(date);

  try {
    entries = await api.getEntriesByDate(date);
    renderEntries();
  } catch (err) {
    console.error('Ошибка загрузки записей:', err);
    entries = [];
    renderEntries();
  }
}

productSearch.addEventListener('input', () => {
  const query = productSearch.value.trim();

  resetSelectedProduct();

  clearTimeout(searchTimeout);

  if (query.length < 2) {
    hideSearchResults();
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      foundProducts = await api.searchProducts(query);
      renderSearchResults(foundProducts);
    } catch (err) {
      console.error('Ошибка поиска:', err);
      hideSearchResults();
    }
  }, 250);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#productSearch') && !e.target.closest('#searchResults')) {
    hideSearchResults();
  }
});

foodDate.addEventListener('change', () => {
  if (!foodDate.value) return;
  loadEntriesByDate(foodDate.value);
});

addFoodBtn.addEventListener('click', async () => {
  if (!selectedProduct) {
    alert('Сначала выбери продукт из списка');
    return;
  }

  const grams = Number(gramsInput.value);
  if (!grams || grams <= 0) {
    alert('Введите корректное количество граммов');
    return;
  }

  try {
    const newEntry = await api.addEntry({
      product_calories_id: selectedProduct.product_calories_id,
      grams,
      food_date: currentDate
    });

    entries.push(newEntry);
    renderEntries();

    productSearch.value = '';
    gramsInput.value = '';
    resetSelectedProduct();
    hideSearchResults();
  } catch (err) {
    console.error('Ошибка добавления:', err);
    alert('Не удалось добавить продукт');
  }
});

setTodayDate();
resetSelectedProduct();
loadEntriesByDate(currentDate);