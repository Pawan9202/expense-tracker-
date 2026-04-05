const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const config = require('../config');

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

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ startDate: '2024-12-31', endDate: '2024-01-01' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/transactions', () => {
    it('should validate transaction data', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10, type: 'invalid', category: '' });

      expect(response.status).toBe(400);
    });
  });
});