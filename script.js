// script.js

// ==== User Authentication ====
let username = localStorage.getItem('chat-username');
if (!username) {
  username = prompt('Enter your username:');
  localStorage.setItem('chat-username', username || 'You');
}
document.getElementById('user-info').textContent = username;

// ==== Theme Toggle ====
const themeBtn = document.getElementById('toggle-theme');
themeBtn.onclick = () => {
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
};

// ==== Chat Elements ====
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');
const typingIndicator = document.getElementById('typing-indicator');

// ==== Persistent Chat ====
let messages = JSON.parse(localStorage.getItem('chat-messages') || '[]');
messages.forEach(msg => addMessage(msg, false));

// ==== Typing Indicator ====
let typingTimeout;
input.addEventListener('input', () => {
  showTypingIndicator();
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(hideTypingIndicator, 700);
});

function showTypingIndicator() {
  typingIndicator.textContent = 'You are typing...';
}
function hideTypingIndicator() {
  typingIndicator.textContent = '';
}

// ==== Message Sending ====
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg === '') return;
  const messageObj = {
    user: username,
    type: 'sent',
    text: msg,
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(username)
  };
  addMessage(messageObj, true);

  // Simulate typing...
  setTimeout(() => {
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      const replyObj = generateReply();
      addMessage(replyObj, true);
    }, 900);
  }, 400);

  input.value = '';
});

// ==== Add Message to UI and Storage ====
function addMessage(msgObj, save = true) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', msgObj.type);

  // Avatar
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = msgObj.avatar;
  avatar.alt = msgObj.user;

  // Content
  const content = document.createElement('div');
  content.className = 'content';
  content.innerHTML = parseMessage(msgObj.text);

  // Timestamp
  const ts = document.createElement('span');
  ts.className = 'timestamp';
  ts.textContent = msgObj.time;

  // User name for received
  if (msgObj.type === 'received') {
    const uname = document.createElement('span');
    uname.style.fontWeight = 'bold';
    uname.style.marginRight = '0.5em';
    uname.textContent = msgObj.user;
    content.prepend(uname);
  }

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(content);
  msgDiv.appendChild(ts);

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save) {
    messages.push(msgObj);
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }
}

// ==== Rich Message Parsing (Emojis, Markdown, Images) ====
function parseMessage(text) {
  // Simple emoji replacement
  text = text.replace(/:\)/g, '😊').replace(/:D/g, '😃').replace(/:\(/g, '😢');
  // Markdown: bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // Markdown: italic
  text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');
  // Images
  text = text.replace(/(https?:\/\/\S+\.(jpg|png|gif))/gi, '<img src="$1" style="max-width:100px;vertical-align:middle;" />');
  // Links
  text = text.replace(/(https?:\/\/\S+)/gi, '<a href="$1" target="_blank">$1</a>');
  return text;
}

// ==== Simulated Multi-User AI Reply ====
function generateReply() {
  const bots = [
    { name: 'Ava', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Ava' },
    { name: 'Leo', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Leo' },
    { name: 'Mia', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Mia' }
  ];
  const replies = [
    'Cool! 😎',
    'Can you explain more?',
    'I agree! 👍',
    'Interesting... 🤔',
    'Let me think...',
    'Got it.',
    'Thanks for sharing!',
    'Check this out: https://perplexity.ai',
    'Here\'s a cute cat! https://placekitten.com/100/100'
  ];
  const bot = bots[Math.floor(Math.random() * bots.length)];
  return {
    user: bot.name,
    type: 'received',
    text: replies[Math.floor(Math.random() * replies.length)],
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    avatar: bot.avatar
  };
}
