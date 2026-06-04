function setButtonLoading(button, isLoading, loadingText = 'Загрузка...') {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('opacity-80', 'cursor-not-allowed');

    button.innerHTML = `
      <span class="inline-flex items-center justify-center gap-2">
        <svg
          class="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
          ></circle>
          <path
            class="opacity-90"
            fill="currentColor"
            d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
          ></path>
        </svg>
        <span>${loadingText}</span>
      </span>
    `;
  } else {
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
    button.classList.remove('opacity-80', 'cursor-not-allowed');

    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

async function runWithButtonLoading(button, callback, loadingText = 'Загрузка...') {
  try {
    setButtonLoading(button, true, loadingText);
    return await callback();
  } finally {
    setButtonLoading(button, false);
  }
}

window.setButtonLoading = setButtonLoading;
window.runWithButtonLoading = runWithButtonLoading;

function showToast(message, type = 'auto') {
  const text = String(message || 'Произошла ошибка');
  const success = type === 'success' || (type === 'auto' && /добавлен|сохранен|сохранён|готово|успеш/i.test(text));
  let container = document.getElementById('dayline-toasts');

  if (!container) {
    container = document.createElement('div');
    container.id = 'dayline-toasts';
    container.className = 'fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `translate-y-[-8px] rounded-2xl border px-4 py-3 text-sm text-white opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
    success ? 'border-emerald-300/30 bg-emerald-950/90' : 'border-red-300/30 bg-red-950/90'
  }`;
  toast.innerHTML = `<div class="flex items-start gap-3"><span class="mt-0.5">${success ? '✓' : '!'}</span><p class="flex-1"></p><button type="button" class="text-white/60 hover:text-white" aria-label="Закрыть">×</button></div>`;
  toast.querySelector('p').textContent = text;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.remove('translate-y-[-8px]', 'opacity-0'));
  setTimeout(() => {
    toast.classList.add('translate-y-[-8px]', 'opacity-0');
    setTimeout(() => toast.remove(), 220);
  }, 4500);
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  if (response.status === 401 && requestUrl.includes('/api/')) {
    window.location.replace('/');
  }
  return response;
};

window.showToast = showToast;
