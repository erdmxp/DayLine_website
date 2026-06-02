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
