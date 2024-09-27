document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        showTab(tab.getAttribute('data-tab'));
    });
});

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');

    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));

    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).classList.add('active');
}

// Функция для валидации данных формы
function validateForm(fields) {
    return fields.every(field => field.trim() !== '');
}

// Функция для отправки запросов
async function sendRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Операция выполнена успешно!');
            return result;
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Ошибка выполнения запроса!');
            return null;
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert('Произошла ошибка на сервере');
    }
}

// Обработка формы входа
document.getElementById('loginButton').addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#loginForm input[type="email"]').value;
    const password = document.querySelector('#loginForm input[type="password"]').value;

    if (!validateForm([email, password])) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    const data = await sendRequest("login/", {email, password});
    if (data) {
        window.location.href = '/chat';
    }
});

// Обработка формы регистрации
document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#registerForm input[type="email"]').value;
    const name = document.querySelector('#registerForm input[type="text"]').value;
    const password = document.querySelector('#registerForm input[type="password"]:nth-child(3)').value;
    const password_check = document.querySelector('#registerForm input[type="password"]:nth-child(4)').value;

    if (!validateForm([email, name, password, password_check])) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    if (password !== password_check) {
        alert('Пароли не совпадают.');
        return;
    }

    await sendRequest("register/", {email, name, password, password_check});
});
