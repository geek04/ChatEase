// Initialize Socket.IO connection
const socket = io('http://localhost:3000');

// UI Elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const welcomeScreen = document.getElementById('welcome-screen');
const themeToggle = document.getElementById('theme-toggle');
const emojiBtn = document.getElementById('emoji-btn');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');

// Emoji Picker (third-party only)
new EmojiPicker({
  trigger: [{ selector: '#emoji-btn', insertInto: '#chat-input' }],
  closeButton: true,
  fadeTimeout: 200
});

// Theme Management
themeToggle.addEventListener('click', () => {
  document.body.toggleAttribute('data-theme');
  themeToggle.textContent = document.body.hasAttribute('data-theme') ? '☀️' : '🌙';
});

// File Upload Handling
fileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showNotification('File size exceeds 5MB limit');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('file-upload', {
      name: file.name,
      type: file.type,
      data: reader.result,
      sender: localStorage.getItem('username')
    });
  };
  reader.readAsDataURL(file);
});

// Message Handling
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  const messageData = {
    id: Date.now(),
    content: message,
    sender: localStorage.getItem('username'),
    timestamp: new Date().toISOString(),
    status: 'sent'
  };
  socket.emit('message', messageData);
  chatInput.value = '';
  welcomeScreen.style.display = 'none';
});

// Socket Event Listeners
socket.on('connect', () => {
  if (!localStorage.getItem('username')) {
    const username = prompt('Enter your username:') || 'Anonymous';
    localStorage.setItem('username', username);
  }
  document.getElementById('username-display').textContent = localStorage.getItem('username');
});

socket.on('message', (message) => {
  appendMessage(message);
  welcomeScreen.style.display = 'none';
});

socket.on('user-typing', (username) => {
  const typingIndicator = document.getElementById('typing-indicator');
  typingIndicator.textContent = `${username} is typing...`;
  setTimeout(() => { typingIndicator.textContent = ''; }, 2000);
});

socket.on('online-users', (count) => {
  document.getElementById('online-counter').textContent = `${count} online`;
});

socket.on('file-upload', (fileData) => {
  const fileElement = document.createElement('div');
  fileElement.className = 'file-message';
  fileElement.innerHTML = `
    <img src="https://api.dicebear.com/7.x/identicon/svg?seed=${fileData.sender}" class="avatar" alt="${fileData.sender}'s avatar">
    <div class="file-content">
      <span class="sender">${fileData.sender}</span>
      <a href="${fileData.data}" download="${fileData.name}">${fileData.name}</a>
    </div>
  `;
  chatMessages.appendChild(fileElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Typing indication
chatInput.addEventListener('input', () => {
  socket.emit('user-typing', localStorage.getItem('username'));
});

// Helper Functions
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${message.sender === localStorage.getItem('username') ? 'sent' : 'received'}`;
  messageElement.dataset.id = message.id;
  messageElement.dataset.timestamp = message.timestamp;
  messageElement.innerHTML = `
    <img src="https://api.dicebear.com/7.x/identicon/svg?seed=${message.sender}" class="avatar" alt="${message.sender}'s avatar">
    <div class="message-content">
      <div class="message-header">
        <span class="sender">${message.sender}</span>
        <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-body">${parseMessageContent(message.content)}</div>
      <div class="message-status">${message.status === 'sent' ? '✓' : '✓✓'}</div>
    </div>
  `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function parseMessageContent(content) {
  return content
    .replace(/:\)/g, '😊')
    .replace(/:\(/g, '😞')
    .replace(/http[s]?:\/\/\S+/g, url => `<a href="${url}" target="_blank">${url}</a>`);
}

function showNotification(msg) {
  const notification = document.getElementById('notification');
  document.getElementById('notification-message').textContent = msg;
  notification.hidden = false;
  document.getElementById('notification-close').onclick = () => { notification.hidden = true; };
}

// Add similar logic for overlays/modal open/close as needed
