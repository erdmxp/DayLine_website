const form = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');

const email = document.getElementById('email');
const username = document.getElementById('username');
const password = document.getElementById('password');
const repeatPassword = document.getElementById('repeatPassword');

const emailError = document.getElementById('emailError');
const userError = document.getElementById('userError');
const passwordError = document.getElementById('passwordError');
const repeatPasswordError = document.getElementById('repeatPasswordError');

function showError(input, message) {
  input.value = '';
  input.placeholder = message;

  input.classList.remove('border-transparent', 'placeholder-gray-500');
  input.classList.add('border-red-500', 'placeholder-red-500', 'placeholder-error');
}

function showErrorNotEmpty(input, errorEl, message) {
  input.classList.remove('border-transparent');
  input.classList.add('border-red-500');

  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function clearError(input, errorEl) {
  input.classList.remove('border-red-500');
  input.classList.add('border-transparent');

  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  clearError(email, emailError);
  clearError(username, userError);
  clearError(password, passwordError);
  clearError(repeatPassword, repeatPasswordError);

  let hasError = false;

  if (email.value.trim() === '') {
    showError(email, 'Введите почту');
    hasError = true;
  } else if (!email.checkValidity()) {
    showErrorNotEmpty(email, emailError, 'Введите корректную почту!');
    hasError = true;
  }

  if (username.value.trim() === '') {
    showError(username, 'Введите имя');
    hasError = true;
  } else if (username.value.trim().length < 8) {
    showErrorNotEmpty(username, userError, 'Символов должно быть не менее 8');
    hasError = true;
  }

  if (password.value.trim() === '') {
    showError(password, 'Введите пароль');
    hasError = true;
  } else if (password.value.trim().length < 8) {
    showErrorNotEmpty(password, passwordError, 'Символов должно быть не менее 8');
    hasError = true;
  }

  if (repeatPassword.value.trim() === '') {
    showError(repeatPassword, 'Повторите пароль');
    hasError = true;
  } else if (password.value !== repeatPassword.value) {
    showErrorNotEmpty(repeatPassword, repeatPasswordError, 'Пароли не совпадают');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  try {
  await runWithButtonLoading(registerBtn, async () => {
    const response = await fetch('/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: username.value.trim(),
        email: email.value.trim(),
        password: password.value.trim()
      })
    });

    const text = await response.text();

    if (response.ok) {
      window.location.href = '/main';
    } else {
      alert(text || 'Ошибка регистрации');
    }
  }, 'Регистрация...');
} catch (error) {
  console.error('FETCH ERROR:', error);
  alert('Ошибка соединения с сервером');
}
});
