const request = require('supertest');
const jwt = require('jsonwebtoken');
const http = require('http');

const express = require('express');
const config = require('../config');
const authRoutes = require('../routes/auth');
const transactionRoutes = require('../routes/transactions');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Personal Finance Assistant API is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

const generateTestToken = (userId) => {
  return jwt.sign({ userId: userId.toString() }, config.jwt.secret, { expiresIn: '1h' });
};

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: '123' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });
});

describe('Transactions API', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const token = generateTestToken(mockUserId);

  describe('GET /api/transactions', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/transactions');
      expect(response.status).toBe(401);
    });
  });
});