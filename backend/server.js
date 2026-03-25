const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.CLIENT_URL || "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 requests per 15 minutes for better UX
  skip: (req) => {
    // Skip rate limiting for progress updates to allow continuous video watching
    return req.path === '/api/progress/update';
  }
});
app.use(limiter);

// Separate, more lenient rate limiter for progress updates
const progressLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow 100 progress updates per minute (more than enough for 15s intervals)
  message: 'Too many progress updates, please try again later'
});
app.use('/api/progress', progressLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/community', require('./routes/community'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/reviews', require('./routes/reviews'));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('User connected:', socket.id);
  }

  socket.on('join-community', (userId) => {
    socket.join('community');
  });

  socket.on('new-post', (post) => {
    socket.to('community').emit('post-created', post);
  });

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('User disconnected:', socket.id);
    }
  });
});

// MongoDB connection
if (process.env.NODE_ENV !== 'production') {
  console.log('Attempting to connect to MongoDB...');
}
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edux_platform')
  .then(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected successfully');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});