const express = require('express');
const dotenv = require('dotenv');
const http = require('http');        // 👈 new
const socketIo = require('socket.io'); // 👈 new

dotenv.config(); 

const cors = require('cors');
const connectDB = require('./config/db');

const aiRoutes = require('./routes/aiAssistant');
const authRoutes = require('./routes/auth');
const trackerRoutes = require('./routes/tracker');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat'); // 👈 new

connectDB();

const app = express();
const server = http.createServer(app); // 👈 new
const io = socketIo(server, {
  cors: {
    origin: "*", // in production, restrict to your frontend domain
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes); // 👈 new

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.io connection
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} connected`);
    
    // Optional: broadcast online status
    socket.broadcast.emit('user_online', userId);
    
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.broadcast.emit('user_offline', userId);
    });
  } else {
    console.log('Socket connected without userId');
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));