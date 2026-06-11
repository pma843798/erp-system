const express = require('express');
const dotenv = require('dotenv');

dotenv.config(); 

const cors = require('cors');
const connectDB = require('./config/db');

const aiRoutes = require('./routes/aiAssistant');
const authRoutes = require('./routes/auth');
const trackerRoutes = require('./routes/tracker');
const dashboardRoutes = require('./routes/dashboard');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));