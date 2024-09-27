// Привязка табов к кликам
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

// Обработка формы входа
document.getElementById('loginButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Предотвращаем отправку формы по умолчанию
    await handleLogin();
});

// Обработка формы регистрации
document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Предотвращаем отправку формы по умолчанию
    await handleRegister();
});

// Обработка входа
async function handleLogin() {
    const email = document.querySelector('#loginForm input[type="email"]').value;
    const password = document.querySelector('#loginForm input[type="password"]').value;

    try {
        const response = await fetch("login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message || 'Авторизация успешна!');
            window.location.href = '/chat';
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Ошибка авторизации!');
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert('Произошла ошибка на сервере');
    }
}

// Обработка регистрации
async function handleRegister() {
    const email = document.querySelector('#registerForm input[type="email"]').value;
    const name = document.querySelector('#registerForm input[type="text"]').value;
    const password = document.querySelector('#registerForm input[type="password"]:nth-child(3)').value;
    const password_check = document.querySelector('#registerForm input[type="password"]:nth-child(4)').value;

    try {
        const response = await fetch("register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, name, password, password_check})
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message || 'Вы успешно зарегистрированы!');
            // Можно добавить логику редиректа
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Ошибка регистрации!');
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert('Произошла ошибка на сервере');
    }
}