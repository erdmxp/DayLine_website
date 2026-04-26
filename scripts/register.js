const form = document.getElementById('registerForm');

const email = document.getElementById('email');
const username = document.getElementById('username');
const password = document.getElementById('password');
const repeatPassword = document.getElementById('repeatPassword');


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
    errorEl.classList.add('hidden')
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    clearError(email, emailError);
    clearError(username, userError);
    clearError(password, passwordError);
    clearError(repeatPassword, repeatPasswordError);


    if (email.value.trim() === '') {
        showError(email, 'Введите почту');
    } else if (!email.checkValidity()) {
        showErrorNotEmpty(email, emailError, 'Введите корректную почту!');
    }
    

  if (username.value.trim() === '') {
      showError(username, 'Введите имя');

  } else if (username.value.trim().length < 8) {
      showErrorNotEmpty(username, userError, "Символов должно быть не менее 8");
  }
  

  if (password.value.trim() === '') {
      showError(password, 'Введите пароль');
  } else if(password.value.trim().length < 8) {
      showErrorNotEmpty(password, passwordError, 'Символов должно быть не менее 8');
  }
    

  if (repeatPassword.value.trim() === '') {
      showError(repeatPassword, 'Повторите пароль');
    
  } else if (password.value !== repeatPassword.value) {
      showErrorNotEmpty(repeatPassword, repeatPasswordError, 'Пароли не совпадают');
    
  }

  
  
});