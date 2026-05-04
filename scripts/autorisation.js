const form = document.getElementById("autorisationForm");

const login = document.getElementById("login");
const password = document.getElementById("password");

const loginError = document.getElementById("loginError");
const passwordError = document.getElementById("passwordError");
const inputError = document.getElementById("inputError");

function showError(input, message) {
  input.value = '';
  input.placeholder = message;

  input.classList.remove('border-transparent', 'placeholder-gray-500');
  input.classList.add('border-red-500', 'placeholder-red-500', 'placeholder-error');
}

function showErrorINPUT(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function clearInputError(errorEl) {
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

function clearError(input, errorEl) {
  input.classList.remove('border-red-500');
  input.classList.add('border-transparent');

  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  clearError(login, loginError);
  clearError(password, passwordError);
  clearInputError(inputError);

  let flag = true;

  if (login.value.trim() === '') {
    showError(login, 'введите ник или почту');
    flag = false;
  }

  if (password.value.trim() === '') {
    showError(password, 'введите пароль');
    flag = false;
  }

  if (!flag) {
    showErrorINPUT(inputError, 'Заполните все поля');
    return;
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: login.value.trim(),
        password: password.value.trim()
      })
    });

    const text = await response.text();

    if (response.ok) {
      window.location.href = '/main';
    } else {
      if (text === 'Пользователь не найден') {
        showErrorINPUT(loginError, text);
        login.classList.add('border-red-500');
      } else if (text === 'Неверный пароль') {
        showErrorINPUT(passwordError, text);
        password.classList.add('border-red-500');
      } else {
        showErrorINPUT(inputError, text);
      }
    }
  } catch (error) {
    console.error('LOGIN FETCH ERROR:', error);
    showErrorINPUT(inputError, 'Ошибка соединения с сервером');
  }
});