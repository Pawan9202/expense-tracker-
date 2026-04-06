require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const connectDB = require('./models/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const recurringRoutes = require('./routes/recurring');
const whatsappRoutes = require('./routes/whatsapp');
const insightsRoutes = require('./routes/insights');
const notificationsRoutes = require('./routes/notifications');
const exportImportRoutes = require('./routes/exportImport');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
app.set('config', config);

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for now in development
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId);
      logger.info(`Client ${socket.id} joined room ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Personal Finance Assistant API is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/export-import', exportImportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    // Try to connect Redis (optional - app works without it)
    try {
      const { connectRedis } = require('./services/cacheService');
      await connectRedis();
      logger.info('Redis initialized');
    } catch (redisErr) {
      logger.warn('Redis connection failed - continuing without cache:', redisErr.message);
    }

    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API available at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server and add handlers if not in test environment
if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  startServer();
}

module.exports = { app, server, io };