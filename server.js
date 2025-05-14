const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = new Set();

io.on('connection', (socket) => {
  // Add new user
  onlineUsers.add(socket.id);
  updateOnlineCount();

  // Message handling
  socket.on('message', (message) => {
    message.status = 'delivered';
    // Broadcast to all except sender
    socket.broadcast.emit('message', message);
    // Optionally, acknowledge to sender (for status update)
    socket.emit('message-status', message.id, 'delivered');
  });

  // Typing indicator
  socket.on('user-typing', (username) => {
    socket.broadcast.emit('user-typing', username);
  });

  // File handling
  socket.on('file-upload', (fileData) => {
    socket.broadcast.emit('file-upload', fileData);
  });

  // Message deletion
  socket.on('delete-message', (messageId) => {
    io.emit('message-deleted', messageId);
  });

  // Message editing
  socket.on('edit-message', ({ id, content }) => {
    io.emit('message-edited', id, content);
  });

  // Message reactions
  socket.on('react-to-message', (messageId, reaction) => {
    io.emit('message-reacted', messageId, reaction);
  });

  // Message pinning
  socket.on('pin-message', (messageId) => {
    io.emit('message-pinned', messageId);
  });

  socket.on('unpin-message', (messageId) => {
    io.emit('message-unpinned', messageId);
  });

  // User disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    updateOnlineCount();
    // Optionally, broadcast user disconnect event if you track usernames
    // io.emit('user-disconnect', username);
  });

  function updateOnlineCount() {
    io.emit('online-users', onlineUsers.size);
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

