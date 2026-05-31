const dotenv = require('dotenv');
// Load env variables immediately before other imports
dotenv.config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { startCpuMonitor } = require('./utils/cpuMonitor');
const { reschedulePendingMessages } = require('./controllers/messageController');
const messageRoutes = require('./routes/messageRoutes');


const app = express();

// CORS configuration (allow Vite dev and deployed production frontends)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is a local address (localhost or 127.0.0.1)
    const isLocalhost = origin.startsWith('http://localhost:') || 
                        origin.startsWith('http://127.0.0.1:') ||
                        origin === 'http://localhost' ||
                        origin === 'http://127.0.0.1';

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*') || isLocalhost) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// API Routes
app.use('/api/message', messageRoutes);

// General health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server running smoothly' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start core server utilities
db.connect().then(async () => {
  console.log('Database connected successfully. Booting server systems...');
  
  // 1. Reschedule any messages with 'pending' status from the database
  await reschedulePendingMessages();
  
  // 2. Start CPU utilization monitoring
  startCpuMonitor();
  
  // 3. Start Express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to DB connection failure:', err);
  process.exit(1);
});
// Nodemon watcher trigger comment: port 5001 reload 5
