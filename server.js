const express = require('express');
const dotenv = require('dotenv');

// 1. Sabse pehle environment variables load karo!
dotenv.config(); 

const cors = require('cors');
const connectDB = require('./config/db');

// 2. Uske baad custom routes import karo taaki unhe .env ka data smoothly mil sake
const aiRoutes = require('./routes/aiAssistant');
const authRoutes = require('./routes/auth');
const trackerRoutes = require('./routes/tracker');
const dashboardRoutes = require('./routes/dashboard');

// Database connect
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes mount
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));