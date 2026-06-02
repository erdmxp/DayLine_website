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

  async addRecipeEntry(payload) {
    const res = await fetch('/api/nutrition/recipe-entry', {
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
  },

  async getDishes() {
    const res = await fetch('/api/dishes');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getDishById(id) {
    const res = await fetch(`/api/dishes/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createDish(payload) {
    const res = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateDish(id, payload) {
    const res = await fetch(`/api/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteDish(id) {
    const res = await fetch(`/api/dishes/${id}`, {
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

const openRecipeModalBtn = document.getElementById('openRecipeModalBtn');
const recipeSearch = document.getElementById('recipeSearch');
const recipeResults = document.getElementById('recipeResults');
const selectedRecipeName = document.getElementById('selectedRecipeName');
const selectedRecipeCalories = document.getElementById('selectedRecipeCalories');
const selectedRecipeProteins = document.getElementById('selectedRecipeProteins');
const selectedRecipeCarbs = document.getElementById('selectedRecipeCarbs');
const selectedRecipeFats = document.getElementById('selectedRecipeFats');
const selectedRecipeIngredients = document.getElementById('selectedRecipeIngredients');
const recipeQuickList = document.getElementById('recipeQuickList');
const addRecipeBtn = document.getElementById('addRecipeBtn');
const editRecipeBtn = document.getElementById('editRecipeBtn');
const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');

const recipeModal = document.getElementById('recipeModal');
const closeRecipeModalBtn = document.getElementById('closeRecipeModalBtn');
const recipeNameInput = document.getElementById('recipeNameInput');
const recipeProductSearch = document.getElementById('recipeProductSearch');
const recipeProductResults = document.getElementById('recipeProductResults');
const recipeGramsInput = document.getElementById('recipeGramsInput');
const addIngredientBtn = document.getElementById('addIngredientBtn');
const recipeIngredientsList = document.getElementById('recipeIngredientsList');
const recipeIngredientsCount = document.getElementById('recipeIngredientsCount');
const saveRecipeBtn = document.getElementById('saveRecipeBtn');
const recipeTotalCalories = document.getElementById('recipeTotalCalories');
const recipeTotalProteins = document.getElementById('recipeTotalProteins');
const recipeTotalCarbs = document.getElementById('recipeTotalCarbs');
const recipeTotalFats = document.getElementById('recipeTotalFats');

let entries = [];
let foundProducts = [];
let selectedProduct = null;
let currentDate = null;
let searchTimeout = null;

let dishes = [];
let selectedDish = null;
let recipeFoundProducts = [];
let recipeIngredients = [];
let editingDishId = null;
let recipeSearchTimeout = null;
let selectedRecipeProduct = null;

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
      <div class="px-4 py-3 text-sm text-white/70">Ничего не найдено</div>
    `;
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = products
    .map(
      (product) => `
        <button
          type="button"
          data-product-id="${product.product_calories_id}"
          class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-white transition hover:bg-white/10"
        >
          <span>${product.name_product}</span>
          <span class="text-sm text-white/60">${product.calories} ккал</span>
        </button>
      `
    )
    .join('');

  searchResults.classList.remove('hidden');

  searchResults.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.productId);
      const product = foundProducts.find((item) => Number(item.product_calories_id) === productId);
      if (product) setSelectedProduct(product);
    });
  });
}

function updateTotals() {
  const calories = entries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  const proteins = entries.reduce((sum, entry) => sum + Number(entry.proteins || 0), 0);
  const carbs = entries.reduce((sum, entry) => sum + Number(entry.carbs || 0), 0);
  const fats = entries.reduce((sum, entry) => sum + Number(entry.fats || 0), 0);

  totalCalories.textContent = calories;
  totalProteins.textContent = proteins;
  totalCarbs.textContent = carbs;
  totalFats.textContent = fats;
  entriesCounter.textContent = entries.length;
}

function renderEntries() {
  foodList.innerHTML = '';

  if (!entries.length) {
    emptyNutritionState.classList.remove('hidden');
    return;
  }

  emptyNutritionState.classList.add('hidden');

  foodList.innerHTML = entries
    .map(
      (entry) => `
        <div class="rounded-[2rem] border border-white/20 bg-white/10 p-4 text-white shadow-lg backdrop-blur-md">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-lg font-semibold break-words">${entry.food_name}</p>
              <p class="text-sm text-white/65">${entry.grams} г • ${entry.food_date_formatted || ''}</p>
              ${entry.description ? `<p class="mt-2 text-sm leading-relaxed text-white/70 break-words">${entry.description}</p>` : ''}
            </div>

            <button
              type="button"
              data-entry-id="${entry.calories_id}"
              class="shrink-0 rounded-xl border border-red-200/20 bg-red-400/10 px-3 py-1.5 text-sm text-red-100 transition hover:bg-red-400/20"
            >
              Удалить
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded-xl bg-white/10 px-3 py-2 text-sm">
              <span class="text-white/60">Ккал</span>
              <p class="mt-1 font-semibold">${entry.calories}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-3 py-2 text-sm">
              <span class="text-white/60">Белки</span>
              <p class="mt-1 font-semibold">${entry.proteins}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-3 py-2 text-sm">
              <span class="text-white/60">Углеводы</span>
              <p class="mt-1 font-semibold">${entry.carbs}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-3 py-2 text-sm">
              <span class="text-white/60">Жиры</span>
              <p class="mt-1 font-semibold">${entry.fats}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  foodList.querySelectorAll('[data-entry-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await runWithButtonLoading(btn, async () => {
          await api.deleteEntry(btn.dataset.entryId);
          await loadEntries();
        }, 'Удаление...');
      } catch (e) {
        alert(e.message || 'Ошибка при удалении записи');
      }
    });
  });
}

async function loadEntries() {
  if (!currentDate) return;

  try {
    entries = await api.getEntriesByDate(currentDate);
    updateTotals();
    renderEntries();
  } catch (e) {
    console.error(e);
    alert('Не удалось загрузить записи');
  }
}

async function onProductSearchInput() {
  const query = productSearch.value.trim();

  if (searchTimeout) clearTimeout(searchTimeout);

  if (query.length < 2) {
    foundProducts = [];
    hideSearchResults();
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      foundProducts = await api.searchProducts(query);
      renderSearchResults(foundProducts);
    } catch (e) {
      console.error(e);
      hideSearchResults();
    }
  }, 250);
}

async function onAddFood() {
  if (!selectedProduct) {
    alert('Сначала выбери продукт');
    return;
  }

  const grams = Number(gramsInput.value);

  if (!grams || grams <= 0) {
    alert('Введите корректное количество грамм');
    return;
  }

  try {
    await runWithButtonLoading(addFoodBtn, async () => {
      await api.addEntry({
        product_calories_id: selectedProduct.product_calories_id,
        grams,
        food_date: currentDate
      });
    });

    gramsInput.value = '';
    productSearch.value = '';
    resetSelectedProduct();
    await loadEntries();
  } catch (e) {
    alert(e.message || 'Ошибка при добавлении продукта');
  }
}

function resetSelectedDish() {
  selectedDish = null;

  if (selectedRecipeName) selectedRecipeName.textContent = 'Пока не выбран';
  if (selectedRecipeCalories) selectedRecipeCalories.textContent = '0';
  if (selectedRecipeProteins) selectedRecipeProteins.textContent = '0';
  if (selectedRecipeCarbs) selectedRecipeCarbs.textContent = '0';
  if (selectedRecipeFats) selectedRecipeFats.textContent = '0';

  if (selectedRecipeIngredients) {
    selectedRecipeIngredients.innerHTML = `
      <div class="text-sm text-white/60">
        Здесь будет отображаться полный состав выбранного рецепта.
      </div>
    `;
  }
}

function renderRecipePreview(dish) {
  selectedDish = dish;

  if (selectedRecipeName) selectedRecipeName.textContent = dish.dish_name;
  if (selectedRecipeCalories) selectedRecipeCalories.textContent = dish.calories || 0;
  if (selectedRecipeProteins) selectedRecipeProteins.textContent = dish.proteins || 0;
  if (selectedRecipeCarbs) selectedRecipeCarbs.textContent = dish.carbs || 0;
  if (selectedRecipeFats) selectedRecipeFats.textContent = dish.fats || 0;

  if (selectedRecipeIngredients) {
    if (!dish.ingredients || !dish.ingredients.length) {
      selectedRecipeIngredients.innerHTML = `
        <div class="text-sm text-white/60">В рецепте пока нет ингредиентов.</div>
      `;
    } else {
      selectedRecipeIngredients.innerHTML = dish.ingredients
        .map(
          (item) => `
            <div class="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
              <span class="text-sm text-white/85">${item.name_product}</span>
              <span class="text-xs text-white/60">${item.grams} г</span>
            </div>
          `
        )
        .join('');
    }
  }
}

function hideRecipeResults() {
  if (!recipeResults) return;
  recipeResults.classList.add('hidden');
  recipeResults.innerHTML = '';
}

function renderRecipeResults(items) {
  if (!recipeResults) return;

  if (!items.length) {
    recipeResults.innerHTML = `
      <div class="px-4 py-3 text-sm text-white/70">Рецепты не найдены</div>
    `;
    recipeResults.classList.remove('hidden');
    return;
  }

  recipeResults.innerHTML = items
    .map(
      (dish) => `
        <button
          type="button"
          data-dish-id="${dish.dish_id}"
          class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-white transition hover:bg-white/10"
        >
          <span>${dish.dish_name}</span>
          <span class="text-sm text-white/60">${dish.calories || 0} ккал</span>
        </button>
      `
    )
    .join('');

  recipeResults.classList.remove('hidden');

  recipeResults.querySelectorAll('[data-dish-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const dish = await api.getDishById(btn.dataset.dishId);
        renderRecipePreview(dish);
        recipeSearch.value = dish.dish_name;
        hideRecipeResults();
      } catch (e) {
        alert(e.message || 'Ошибка при выборе рецепта');
      }
    });
  });
}

async function loadDishes() {
  try {
    dishes = await api.getDishes();
    renderQuickRecipeList();
  } catch (e) {
    console.error(e);
  }
}

function renderQuickRecipeList() {
  if (!recipeQuickList) return;

  if (!dishes.length) {
    recipeQuickList.innerHTML = `
      <div class="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/60">
        Пока нет сохранённых рецептов.
      </div>
    `;
    return;
  }

  recipeQuickList.innerHTML = dishes
    .slice(0, 5)
    .map(
      (dish) => `
        <button
          type="button"
          data-quick-dish-id="${dish.dish_id}"
          class="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-white/15"
        >
          <span>${dish.dish_name}</span>
          <span class="text-white/60">${dish.calories || 0} ккал</span>
        </button>
      `
    )
    .join('');

  recipeQuickList.querySelectorAll('[data-quick-dish-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const dish = await api.getDishById(btn.dataset.quickDishId);
        renderRecipePreview(dish);
      } catch (e) {
        alert(e.message || 'Ошибка при выборе рецепта');
      }
    });
  });
}

async function onRecipeSearchInput() {
  if (!recipeSearch) return;

  const query = recipeSearch.value.trim().toLowerCase();

  if (recipeSearchTimeout) clearTimeout(recipeSearchTimeout);

  if (query.length < 1) {
    hideRecipeResults();
    return;
  }

  recipeSearchTimeout = setTimeout(() => {
    const filtered = dishes.filter((dish) => dish.dish_name.toLowerCase().includes(query));
    renderRecipeResults(filtered);
  }, 200);
}

function openRecipeModal(mode = 'create') {
  if (!recipeModal) return;

  recipeModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (mode === 'create') {
    resetRecipeModalState();
  }
}

function closeRecipeModal() {
  if (!recipeModal) return;
  recipeModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  hideRecipeProductResults();
}

function resetRecipeModalState() {
  editingDishId = null;
  selectedRecipeProduct = null;
  recipeIngredients = [];

  if (recipeNameInput) recipeNameInput.value = '';
  if (recipeProductSearch) recipeProductSearch.value = '';
  if (recipeGramsInput) recipeGramsInput.value = '';

  renderRecipeIngredients();
  updateRecipeModalTotals();
}

function fillRecipeModalForEdit(dish) {
  editingDishId = dish.dish_id;
  selectedRecipeProduct = null;
  recipeIngredients = (dish.ingredients || []).map((item) => ({
    dish_ingredient_id: item.dish_ingredient_id,
    product_calories_id: Number(item.product_calories_id),
    name_product: item.name_product,
    grams: Number(item.grams),
    calories: Number(item.calories || 0),
    proteins: Number(item.proteins || 0),
    carbs: Number(item.carbs || 0),
    fats: Number(item.fats || 0)
  }));

  if (recipeNameInput) recipeNameInput.value = dish.dish_name;
  if (recipeProductSearch) recipeProductSearch.value = '';
  if (recipeGramsInput) recipeGramsInput.value = '';

  renderRecipeIngredients();
  updateRecipeModalTotals();
}

function hideRecipeProductResults() {
  if (!recipeProductResults) return;
  recipeProductResults.classList.add('hidden');
  recipeProductResults.innerHTML = '';
}

function renderRecipeProductResults(products) {
  if (!recipeProductResults) return;

  if (!products.length) {
    recipeProductResults.innerHTML = `
      <div class="px-4 py-3 text-sm text-slate-500">Ничего не найдено</div>
    `;
    recipeProductResults.classList.remove('hidden');
    return;
  }

  recipeProductResults.innerHTML = products
    .map(
      (product) => `
        <button
          type="button"
          data-recipe-product-id="${product.product_calories_id}"
          class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-slate-900 transition hover:bg-slate-100"
        >
          <span>${product.name_product}</span>
          <span class="text-sm text-slate-500">${product.calories} ккал</span>
        </button>
      `
    )
    .join('');

  recipeProductResults.classList.remove('hidden');

  recipeProductResults.querySelectorAll('[data-recipe-product-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.recipeProductId);
      const product = recipeFoundProducts.find((item) => Number(item.product_calories_id) === productId);

      if (product) {
        selectedRecipeProduct = product;
        recipeProductSearch.value = product.name_product;
        hideRecipeProductResults();
      }
    });
  });
}

async function onRecipeProductSearchInput() {
  if (!recipeProductSearch) return;

  const query = recipeProductSearch.value.trim();

  if (searchTimeout) clearTimeout(searchTimeout);

  if (query.length < 2) {
    recipeFoundProducts = [];
    hideRecipeProductResults();
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      recipeFoundProducts = await api.searchProducts(query);
      renderRecipeProductResults(recipeFoundProducts);
    } catch (e) {
      console.error(e);
      hideRecipeProductResults();
    }
  }, 250);
}

function updateRecipeModalTotals() {
  const calories = recipeIngredients.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const proteins = recipeIngredients.reduce((sum, item) => sum + Number(item.proteins || 0), 0);
  const carbs = recipeIngredients.reduce((sum, item) => sum + Number(item.carbs || 0), 0);
  const fats = recipeIngredients.reduce((sum, item) => sum + Number(item.fats || 0), 0);

  if (recipeTotalCalories) recipeTotalCalories.textContent = calories;
  if (recipeTotalProteins) recipeTotalProteins.textContent = proteins;
  if (recipeTotalCarbs) recipeTotalCarbs.textContent = carbs;
  if (recipeTotalFats) recipeTotalFats.textContent = fats;
  if (recipeIngredientsCount) {
    recipeIngredientsCount.textContent = `${recipeIngredients.length} ингредиентов`;
  }
}

function renderRecipeIngredients() {
  if (!recipeIngredientsList) return;

  if (!recipeIngredients.length) {
    recipeIngredientsList.innerHTML = `
      <div class="rounded-2xl bg-white border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Пока нет ингредиентов. Добавь первый продукт в рецепт.
      </div>
    `;
    updateRecipeModalTotals();
    return;
  }

  recipeIngredientsList.innerHTML = recipeIngredients
    .map(
      (item, index) => `
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <p class="font-medium text-slate-900">${item.name_product}</p>
              <p class="text-sm text-slate-500">${item.grams} г</p>
            </div>

            <button
              type="button"
              data-remove-ingredient-index="${index}"
              class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Удалить
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span class="text-slate-500">Ккал</span>
              <p class="mt-1 font-semibold text-slate-900">${item.calories}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span class="text-slate-500">Белки</span>
              <p class="mt-1 font-semibold text-slate-900">${item.proteins}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span class="text-slate-500">Углеводы</span>
              <p class="mt-1 font-semibold text-slate-900">${item.carbs}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span class="text-slate-500">Жиры</span>
              <p class="mt-1 font-semibold text-slate-900">${item.fats}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  recipeIngredientsList.querySelectorAll('[data-remove-ingredient-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.removeIngredientIndex);
      recipeIngredients.splice(index, 1);
      renderRecipeIngredients();
      updateRecipeModalTotals();
    });
  });

  updateRecipeModalTotals();
}

function onAddIngredient() {
  if (!selectedRecipeProduct) {
    alert('Сначала выбери продукт для рецепта');
    return;
  }

  const grams = Number(recipeGramsInput.value);

  if (!grams || grams <= 0) {
    alert('Введите корректную граммовку ингредиента');
    return;
  }

  const calories = Math.round((Number(selectedRecipeProduct.calories) * grams) / 100);
  const proteins = Math.round((Number(selectedRecipeProduct.proteins) * grams) / 100);
  const carbs = Math.round((Number(selectedRecipeProduct.carbohydrates) * grams) / 100);
  const fats = Math.round((Number(selectedRecipeProduct.fats) * grams) / 100);

  recipeIngredients.push({
    product_calories_id: Number(selectedRecipeProduct.product_calories_id),
    name_product: selectedRecipeProduct.name_product,
    grams,
    calories,
    proteins,
    carbs,
    fats
  });

  selectedRecipeProduct = null;
  recipeProductSearch.value = '';
  recipeGramsInput.value = '';

  renderRecipeIngredients();
  updateRecipeModalTotals();
}

async function onSaveRecipe() {
  const dishName = recipeNameInput.value.trim();

  if (!dishName) {
    alert('Введите название рецепта');
    return;
  }

  if (!recipeIngredients.length) {
    alert('Добавьте хотя бы один ингредиент');
    return;
  }

  const payload = {
    dish_name: dishName,
    ingredients: recipeIngredients.map((item) => ({
      product_calories_id: item.product_calories_id,
      grams: item.grams
    }))
  };

  try {
    await runWithButtonLoading(saveRecipeBtn, async () => {
      let savedDish;

      if (editingDishId) {
        savedDish = await api.updateDish(editingDishId, payload);

        if (selectedDish && Number(selectedDish.dish_id) === Number(editingDishId)) {
          const fullDish = await api.getDishById(editingDishId);
          renderRecipePreview(fullDish);
        }
      } else {
        savedDish = await api.createDish(payload);
        const fullDish = await api.getDishById(savedDish.dish_id);
        renderRecipePreview(fullDish);
      }

      await loadDishes();
      closeRecipeModal();
    }, editingDishId ? 'Сохранение...' : 'Создание...');
  } catch (e) {
    alert(e.message || 'Ошибка при сохранении рецепта');
  }
}

async function onEditRecipe() {
  if (!selectedDish) {
    alert('Сначала выбери рецепт');
    return;
  }

  try {
    await runWithButtonLoading(editRecipeBtn, async () => {
      const fullDish = await api.getDishById(selectedDish.dish_id);
      fillRecipeModalForEdit(fullDish);
      openRecipeModal('edit');
    }, 'Загрузка...');
  } catch (e) {
    alert(e.message || 'Ошибка при загрузке рецепта');
  }
}

async function onDeleteRecipe() {
  if (!selectedDish) {
    alert('Сначала выбери рецепт');
    return;
  }

  const confirmed = window.confirm(`Удалить рецепт "${selectedDish.dish_name}"?`);
  if (!confirmed) return;

  try {
    await runWithButtonLoading(deleteRecipeBtn, async () => {
      await api.deleteDish(selectedDish.dish_id);
      resetSelectedDish();
      recipeSearch.value = '';
      await loadDishes();
    }, 'Удаление...');
  } catch (e) {
    alert(e.message || 'Ошибка при удалении рецепта');
  }
}

async function onAddRecipeToDay() {
  if (!selectedDish) {
    alert('Сначала выбери рецепт');
    return;
  }

  try {
    await runWithButtonLoading(addRecipeBtn, async () => {
      await api.addRecipeEntry({
        dish_id: selectedDish.dish_id,
        food_date: currentDate
      });

      await loadEntries();
    }, 'Добавление...');

    alert('Рецепт добавлен в рацион');
  } catch (e) {
    alert(e.message || 'Ошибка при добавлении рецепта в рацион');
  }
}

function bindEvents() {
  if (productSearch) {
    productSearch.addEventListener('input', onProductSearchInput);
    productSearch.addEventListener('focus', onProductSearchInput);
  }

  if (gramsInput) {
    gramsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onAddFood();
    });
  }

  if (addFoodBtn) {
    addFoodBtn.addEventListener('click', onAddFood);
  }

  if (foodDate) {
    foodDate.addEventListener('change', async () => {
      currentDate = foodDate.value;
      currentNutritionDateLabel.textContent = formatDateLabel(currentDate);
      await loadEntries();
    });
  }

  if (recipeSearch) {
    recipeSearch.addEventListener('input', onRecipeSearchInput);
    recipeSearch.addEventListener('focus', onRecipeSearchInput);
  }

  if (openRecipeModalBtn) {
    openRecipeModalBtn.addEventListener('click', () => {
      resetRecipeModalState();
      openRecipeModal('create');
    });
  }

  if (closeRecipeModalBtn) {
    closeRecipeModalBtn.addEventListener('click', closeRecipeModal);
  }

  if (recipeModal) {
    recipeModal.addEventListener('click', (e) => {
      if (e.target === recipeModal) closeRecipeModal();
    });
  }

  if (recipeProductSearch) {
    recipeProductSearch.addEventListener('input', onRecipeProductSearchInput);
    recipeProductSearch.addEventListener('focus', onRecipeProductSearchInput);
  }

  if (recipeGramsInput) {
    recipeGramsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onAddIngredient();
    });
  }

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener('click', onAddIngredient);
  }

  if (saveRecipeBtn) {
    saveRecipeBtn.addEventListener('click', onSaveRecipe);
  }

  if (editRecipeBtn) {
    editRecipeBtn.addEventListener('click', onEditRecipe);
  }

  if (deleteRecipeBtn) {
    deleteRecipeBtn.addEventListener('click', onDeleteRecipe);
  }

  if (addRecipeBtn) {
    addRecipeBtn.addEventListener('click', onAddRecipeToDay);
  }

  document.addEventListener('click', (e) => {
    if (!searchResults?.contains(e.target) && e.target !== productSearch) {
      hideSearchResults();
    }

    if (!recipeResults?.contains(e.target) && e.target !== recipeSearch) {
      hideRecipeResults();
    }

    if (!recipeProductResults?.contains(e.target) && e.target !== recipeProductSearch) {
      hideRecipeProductResults();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSearchResults();
      hideRecipeResults();
      hideRecipeProductResults();
      closeRecipeModal();
    }
  });
}

async function init() {
  setTodayDate();
  resetSelectedProduct();
  resetSelectedDish();
  bindEvents();
  renderRecipeIngredients();
  await loadEntries();
  await loadDishes();
}

init();
