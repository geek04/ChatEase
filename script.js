const socket = io();

const form = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const fileInput = document.getElementById("file-input");
const fileModal = document.getElementById("file-modal");
const fileName = document.getElementById("file-name");
const fileContent = document.getElementById("file-content");
const closeModalBtn = document.getElementById("close-modal");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("chat message", message);
        addMessage("You", message, "sent");
        messageInput.value = "";
    }
});

messageInput.addEventListener("input", () => {
    socket.emit("typing", messageInput.value !== "");
});

socket.on("chat message", (data) => {
    addMessage("Stranger", data.message, "received");
});

socket.on("typing", (isTyping) => {
    typingIndicator.textContent = isTyping ? "Stranger is typing..." : "";
});

socket.on("file", (data) => {
    addFileMessage("Stranger", data.fileName, data.fileContent, "received");
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            socket.emit("file", {
                fileName: file.name,
                fileContent: reader.result,
            });
            addFileMessage("You", file.name, reader.result, "sent");
        };
        reader.readAsDataURL(file);
    }
});

function addMessage(sender, message, type) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message-box", type);

    const messageHTML = `
        <div class="sender">${sender}</div>
        <div class="message">${message}</div>
        <div class="buttons">
            <button class="copy-btn">📋</button>
            <button class="edit-btn">✏️</button>
            <button class="delete-btn">❌</button>
        </div>
    `;
    messageBox.innerHTML = messageHTML;
    messagesContainer.appendChild(messageBox);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Button actions
    const copyBtn = messageBox.querySelector(".copy-btn");
    const editBtn = messageBox.querySelector(".edit-btn");
    const deleteBtn = messageBox.querySelector(".delete-btn");

    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(message);
    });

    editBtn.addEventListener("click", () => {
        const newMessage = prompt("Edit your message:", message);
        if (newMessage) {
            messageBox.querySelector(".message").textContent = newMessage;
        }
    });

    deleteBtn.addEventListener("click", () => {
        messageBox.remove();
    });
}

function addFileMessage(sender, name, content, type) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message-box", type);

    const fileHTML = `
        <div class="sender">${sender}</div>
        <div class="message">📎 ${name}</div>
        <div class="buttons">
            <button class="open-btn">📂</button>
        </div>
    `;
    messageBox.innerHTML = fileHTML;
    messagesContainer.appendChild(messageBox);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const openBtn = messageBox.querySelector(".open-btn");
    openBtn.addEventListener("click", () => {
        fileName.textContent = name;
        fileContent.src = content;
        fileModal.style.display = "block";
    });
}

closeModalBtn.addEventListener("click", () => {
    fileModal.style.display = "none";
});
