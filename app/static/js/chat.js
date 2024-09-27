let selectedUserId = null;
let socket = null;
let messagePollingInterval = null;

// Function to select a user and initiate the chat
function selectUser(userId, userName) {
    selectedUserId = userId;
    document.getElementById('chatHeader').innerHTML = `<span>Чат с ${userName}</span><button class="logout-button" id="logoutButton">Выход</button>`;
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;

    // Clear previous active states
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'block';

    // Set logout button action
    document.getElementById('logoutButton').onclick = logout;

    // Load initial messages and establish WebSocket connection
    loadMessages(userId);
    connectWebSocket();
    startMessagePolling(userId); // Start polling for messages
}

// Function to load messages from the server
function loadMessages(userId) {
    fetch(`/chat/messages/${userId}`)
        .then(response => response.json())
        .then(messages => {
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            messages.forEach(message => {
                addMessage(message.content, message.sender_id);
            });
        });
}

// Function to connect to WebSocket
function connectWebSocket() {
    if (socket) {
        socket.close(); // Close previous connection if it exists
    }

    socket = new WebSocket(`wss://${window.location.host}/chat/ws/${selectedUserId}`);

    socket.onopen = () => console.log('WebSocket соединение установлено');

    socket.onmessage = (event) => {
        const incomingMessage = JSON.parse(event.data);
        // Check if the incoming message is for the currently selected user
        if (incomingMessage.recipient_id === selectedUserId) {
            addMessage(incomingMessage.content, incomingMessage.sender_id);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket соединение закрыто');
        // Optionally, you can restart the WebSocket connection here
        // setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
    };
}

// Function to send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (message && selectedUserId) {
        const payload = {
            recipient_id: selectedUserId,
            content: message
        };
        fetch('/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                socket.send(JSON.stringify({content: message, recipient_id: selectedUserId}));
                addMessage(message, 'sent');
                messageInput.value = '';
            });
    }
}

// Function to add a message to the chat
function addMessage(text, senderId) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add('my-message');
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the latest message
}

// Function to start polling for new messages
function startMessagePolling(userId) {
    // Clear any existing polling interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }

    // Start a new polling interval
    messagePollingInterval = setInterval(() => {
        loadMessages(userId);
    }, 5000); // Poll every 5 seconds
}

// Function to handle user item clicks
document.querySelectorAll('.user-item').forEach(item => {
    item.onclick = function () {
        selectUser(item.getAttribute('data-user-id'), item.textContent);
    };
});

// Send message on button click
document.getElementById('sendButton').onclick = sendMessage;

// Send message on "Enter" key press
document.getElementById('messageInput').onkeypress = (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
};

// Logout function
function logout() {
    fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
    }).then(response => {
        if (response.ok) {
            window.location.href = '/auth';
        } else {
            console.error('Ошибка при выходе');
        }
    }).catch(error => {
        console.error('Ошибка при выполнении запроса:', error);
    });
}
