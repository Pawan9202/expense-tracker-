const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_assistant';

const connectDB = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(MONGODB_URI);
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        logger.error('All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err.message);
});

module.exports = connectDB;