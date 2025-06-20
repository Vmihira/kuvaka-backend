// server.js - Backend Server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://kuvaka-frontend-nine.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://VinjamuriMihira:Vmihira2004@cluster0.kun5tdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  roomName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  activeUsers: { type: Number, default: 0 }
});

const Message = mongoose.model('Message', messageSchema);
const Room = mongoose.model('Room', roomSchema);

// Routes
app.post('/api/rooms/create', async (req, res) => {
  try {
    const { roomName } = req.body;
    const roomId = uuidv4();
    
    const newRoom = new Room({
      roomId,
      roomName
    });
    
    await newRoom.save();
    
    res.json({
      success: true,
      roomId,
      roomName,
      link: `https://kuvaka-frontend-nine.vercel.app/room/${roomId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(100);
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, username } = data;
    
    try {
      const room = await Room.findOne({ roomId });
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      socket.join(roomId);
      socket.username = username;
      socket.roomId = roomId;

      // Update active users count
      await Room.findOneAndUpdate(
        { roomId },
        { $inc: { activeUsers: 1 } }
      );

      // Get updated room info
      const updatedRoom = await Room.findOne({ roomId });
      
      // Notify others that user joined
      socket.to(roomId).emit('user-joined', {
        username,
        message: `${username} joined the chat`,
        activeUsers: updatedRoom.activeUsers
      });

      // Send room info to the user
      socket.emit('room-joined', {
        roomName: room.roomName,
        activeUsers: updatedRoom.activeUsers
      });

    } catch (error) {
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('send-message', async (data) => {
    const { roomId, username, message } = data;
    
    try {
      // Save message to database
      const newMessage = new Message({
        roomId,
        username,
        message
      });
      
      await newMessage.save();

      // Broadcast message to all users in the room
      io.to(roomId).emit('receive-message', {
        username,
        message,
        timestamp: newMessage.timestamp
      });

    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      username: data.username
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.roomId).emit('user-stop-typing', {
      username: data.username
    });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId && socket.username) {
      try {
        // Update active users count
        await Room.findOneAndUpdate(
          { roomId: socket.roomId },
          { $inc: { activeUsers: -1 } }
        );

        // Get updated room info
        const updatedRoom = await Room.findOne({ roomId: socket.roomId });
        
        // Notify others that user left
        socket.to(socket.roomId).emit('user-left', {
          username: socket.username,
          message: `${socket.username} left the chat`,
          activeUsers: updatedRoom ? updatedRoom.activeUsers : 0
        });
      } catch (error) {
        console.error('Error updating user count:', error);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// package.json for backend
/*
{
  "name": "chatroom-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
*/