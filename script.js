const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg === '') return;

  // Add sent message
  addMessage(msg, 'sent');

  // Fake received reply after 1s
  setTimeout(() => {
    addMessage(generateReply(), 'received');
  }, 1000);

  input.value = '';
});

function addMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', type);
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function generateReply() {
  const replies = [
    'Cool!',
    'Can you explain more?',
    'I agree!',
    'Interesting...',
    'Let me think...',
    'Got it.',
    'Thanks for sharing!'
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
