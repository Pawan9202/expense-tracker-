require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const connectDB = require('./models/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authLimiter, apiLimiter, uploadLimiter } = require('./middleware/rateLimiter');

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
    origin: config.cors.origin.split(','),
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
app.set('config', config);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    if (userId && userId === socket.userId) {
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
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    message: 'Personal Finance Assistant API',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: dbStatus
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', apiLimiter, transactionRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/budgets', apiLimiter, budgetRoutes);
app.use('/api/goals', apiLimiter, goalRoutes);
app.use('/api/recurring', apiLimiter, recurringRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/insights', apiLimiter, insightsRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/export-import', apiLimiter, exportImportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected');

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
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

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
