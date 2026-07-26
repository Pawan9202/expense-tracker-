const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/user');
const Category = require('../models/category');
const Transaction = require('../models/transaction');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_assistant', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createDemoUser = async () => {
  try {
    const existingUser = await User.findOne({ username: 'demo' });
    if (existingUser) {
      logger.info('Demo user already exists');
      return existingUser._id;
    }

    const demoPassword = process.env.DEMO_USER_PASSWORD || 'ChangeMe123!';
    const demoUser = new User({
      username: 'demo',
      email: 'demo@example.com',
      password: demoPassword
    });

    await demoUser.save();
    logger.info('Demo user created with ID:', demoUser._id);
    return demoUser._id;
  } catch (error) {
    logger.error('Error creating demo user:', error);
    throw error;
  }
};

const createDefaultCategories = async (userId) => {
  try {
    await Category.createDefaultCategories(userId);
    logger.info('Default categories created for user');
  } catch (error) {
    logger.error('Error creating default categories:', error);
    throw error;
  }
};

const insertSampleTransactions = async (userId) => {
  try {
    const transactions = [
      { userId, amount: 2500, type: 'income', category: 'Salary', description: 'Monthly salary', date: new Date('2024-01-15') },
      { userId, amount: 500, type: 'income', category: 'Freelance', description: 'Web development project', date: new Date('2024-01-20') },
      { userId, amount: 45.50, type: 'expense', category: 'Food & Dining', description: 'Grocery shopping', date: new Date('2024-01-18') },
      { userId, amount: 25.00, type: 'expense', category: 'Transportation', description: 'Gas station', date: new Date('2024-01-19') },
      { userId, amount: 120.00, type: 'expense', category: 'Shopping', description: 'New clothes', date: new Date('2024-01-22') },
      { userId, amount: 80.00, type: 'expense', category: 'Entertainment', description: 'Movie tickets and dinner', date: new Date('2024-01-25') },
      { userId, amount: 150.00, type: 'expense', category: 'Bills & Utilities', description: 'Electricity bill', date: new Date('2024-01-30') }
    ];

    await Transaction.insertMany(transactions);
    logger.info('Sample transactions inserted');
  } catch (error) {
    logger.error('Error inserting sample transactions:', error);
    throw error;
  }
};

const setupDatabase = async () => {
  try {
    logger.info('Setting up database...');

    await connectDB();

    const demoUserId = await createDemoUser();
    await createDefaultCategories(demoUserId);
    await insertSampleTransactions(demoUserId);

    logger.info('Database setup completed successfully!');
    logger.info('Demo user created. Set DEMO_USER_PASSWORD env var for custom password.');

    mongoose.connection.close();
  } catch (error) {
    logger.error('Database setup failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

setupDatabase();
