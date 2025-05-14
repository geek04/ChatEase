

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const users = {};
io.on('connection', (socket) => {
  // Listen for the username sent by the client
  socket.on('user_connected', (username) => {
    users[socket.id] = username;
    io.emit('online-users', Object.values(users).length);
  });

  // Message handling (keep as is)
  socket.on('message', (message) => {
    message.status = 'delivered';
    socket.broadcast.emit('message', message);
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
    delete users[socket.id];
    io.emit('online-users', Object.values(users).length);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
