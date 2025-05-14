document.addEventListener('DOMContentLoaded', function() {
  // Username logic
  let username = localStorage.getItem("username") || "";
  const usernameDisplay = document.getElementById("username-display");
  const userAvatar = document.getElementById("user-avatar");

  function setUsername(name) {
    username = name || "Anonymous";
    localStorage.setItem("username", username);
    usernameDisplay.textContent = username;
    userAvatar.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;
  }

  if (!username || username === "Anonymous") {
    setUsername(prompt("Enter your username:") || "Anonymous");
  } else {
    setUsername(username);
  }

  // User settings modal logic
  const userSettings = document.getElementById("user-settings");
  usernameDisplay.onclick = () => userSettings.hidden = false;
  document.getElementById("save-settings").onclick = function() {
    const newName = document.getElementById("username").value.trim();
    const newAvatar = document.getElementById("avatar").value.trim();
    setUsername(newName);
    if (newAvatar) userAvatar.src = newAvatar;
    userSettings.hidden = true;
  };
  document.getElementById("reset-settings").onclick = function() {
    document.getElementById("username").value = "";
    document.getElementById("avatar").value = "";
  };
  userSettings.onclick = e => { if (e.target === userSettings) userSettings.hidden = true; };

  // Theme toggle and dark mode CSS
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  });
  // Load theme on page load
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }

  // Emoji picker-element integration
  const emojiBtn = document.getElementById("emoji-btn");
  const chatInput = document.getElementById("chat-input");
  const emojiPicker = document.getElementById("emoji-picker");

  emojiBtn.addEventListener("click", (e) => {
    const rect = emojiBtn.getBoundingClientRect();
    emojiPicker.style.display = "block";
    emojiPicker.style.left = rect.left + "px";
    emojiPicker.style.top = rect.bottom + "px";
  });

  emojiPicker.addEventListener("emoji-click", event => {
    chatInput.value += event.detail.unicode;
    emojiPicker.style.display = "none";
  });

  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
      emojiPicker.style.display = "none";
    }
  });

  // Socket.IO setup
  const socket = io("https://chatease-lodz.onrender.com");
  const chatForm = document.getElementById("chat-form");
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.getElementById("typing-indicator");
  const fileInput = document.getElementById("file-input");
  const fileBtn = document.getElementById("file-btn");

  // File upload
  fileBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit("file-upload", {
          name: file.name,
          type: file.type,
          data: reader.result,
          sender: username
        });
        addFileMessage(username, file.name, reader.result, "sent");
      };
      reader.readAsDataURL(file);
    }
  });

  // Send message
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      const messageData = {
        id: Date.now(),
        content: message,
        sender: username,
        timestamp: new Date().toISOString(),
        status: "sent"
      };
      socket.emit("message", messageData);
      addMessage(messageData, "sent");
      chatInput.value = "";
    }
  });

  // Typing indicator
  chatInput.addEventListener("input", () => {
    socket.emit("user-typing", username);
  });

  // Receive message
  socket.on("message", (message) => {
    addMessage(message, "received");
  });

  // Receive file
  socket.on("file-upload", (fileData) => {
    addFileMessage(fileData.sender, fileData.name, fileData.data, "received");
  });

  // Receive typing indicator
  socket.on("user-typing", (typingUsername) => {
    if (typingUsername !== username) {
      typingIndicator.textContent = `${typingUsername} is typing...`;
      setTimeout(() => { typingIndicator.textContent = ""; }, 1500);
    }
  });

  // Utility functions
  function addMessage(messageData, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
      <strong>${messageData.sender}:</strong> ${escapeHTML(messageData.content)}
      <span class="timestamp">${new Date(messageData.timestamp).toLocaleTimeString()}</span>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // No per-message action buttons here!
  }

  function addFileMessage(sender, name, data, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    let fileLink = "";
    if (data.startsWith("data:image")) {
      fileLink = `<img src="${data}" alt="${name}" style="max-width:120px; display:block; margin-top:5px;">`;
    } else {
      fileLink = `<a href="${data}" download="${name}">${name}</a>`;
    }
    messageDiv.innerHTML = `
      <strong>${sender}:</strong> ${fileLink}
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // No per-message action buttons here!
  }

  // --- Context Menu Logic ---
  const contextMenu = document.getElementById('message-context-menu');
  let currentMessageDiv = null;

  // Show context menu on right-click
  chatMessages.addEventListener('contextmenu', function(e) {
    const msgDiv = e.target.closest('.message');
    if (msgDiv) {
      e.preventDefault();
      currentMessageDiv = msgDiv;
      contextMenu.style.display = 'block';
      contextMenu.style.left = e.pageX + 'px';
      contextMenu.style.top = e.pageY + 'px';
    }
  });

  // Hide context menu on click elsewhere or ESC
  document.addEventListener('click', function(e) {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
      currentMessageDiv = null;
    }
  });
  window.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
      contextMenu.style.display = 'none';
      currentMessageDiv = null;
    }
  });

  // Context menu actions
  document.getElementById('context-archive').onclick = () => {
    alert('Archive feature coming soon!');
    contextMenu.style.display = 'none';
  };
  document.getElementById('context-forward').onclick = () => {
    alert('Forward feature coming soon!');
    contextMenu.style.display = 'none';
  };
  document.getElementById('context-copy').onclick = () => {
    if (currentMessageDiv) {
      const text = currentMessageDiv.textContent;
      navigator.clipboard.writeText(text);
    }
    contextMenu.style.display = 'none';
  };
  document.getElementById('context-delete').onclick = () => {
    if (currentMessageDiv) currentMessageDiv.remove();
    contextMenu.style.display = 'none';
  };
  document.getElementById('context-edit').onclick = () => {
    if (currentMessageDiv) {
      const oldText = currentMessageDiv.querySelector('strong')?.nextSibling?.textContent?.trim() || '';
      const newMsg = prompt("Edit your message:", oldText);
      if (newMsg !== null && currentMessageDiv.querySelector('strong')) {
        currentMessageDiv.querySelector('strong').nextSibling.textContent = " " + newMsg;
      }
    }
    contextMenu.style.display = 'none';
  };

  // Helper to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  }
});
