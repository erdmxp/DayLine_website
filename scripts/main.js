const feedbackModal = document.getElementById('feedbackModal');
const openFeedbackBtn = document.getElementById('openFeedbackBtn');
const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackType = document.getElementById('feedbackType');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackCounter = document.getElementById('feedbackCounter');
const feedbackError = document.getElementById('feedbackError');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

function openFeedbackModal() {
  feedbackModal.classList.remove('hidden');
  feedbackModal.classList.add('flex');
  feedbackMessage.focus();
}

function closeFeedbackModal() {
  feedbackModal.classList.add('hidden');
  feedbackModal.classList.remove('flex');
  feedbackError.textContent = '';
}

openFeedbackBtn.addEventListener('click', openFeedbackModal);
closeFeedbackBtn.addEventListener('click', closeFeedbackModal);

feedbackModal.addEventListener('click', (event) => {
  if (event.target === feedbackModal) closeFeedbackModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !feedbackModal.classList.contains('hidden')) {
    closeFeedbackModal();
  }
});

feedbackMessage.addEventListener('input', () => {
  feedbackCounter.textContent = feedbackMessage.value.length;
  feedbackError.textContent = '';
});

feedbackForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = feedbackMessage.value.trim();
  if (message.length < 5) {
    feedbackError.textContent = 'Напиши хотя бы 5 символов';
    return;
  }

  try {
    await runWithButtonLoading(submitFeedbackBtn, async () => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType.value,
          message
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      feedbackForm.reset();
      feedbackCounter.textContent = '0';
      closeFeedbackModal();
      showToast('Спасибо! Отзыв отправлен', 'success');
    }, 'Отправка...');
  } catch (error) {
    feedbackError.textContent = error.message || 'Не удалось отправить отзыв';
  }
});
