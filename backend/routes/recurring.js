const express = require('express');
const router = express.Router();
const RecurringTransaction = require('../models/recurringTransaction');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.find({ 
      userId: req.user._id 
    }).sort({ nextOccurrence: 1 });
    res.json({ recurring });
  } catch (error) {
    logger.error('Get recurring error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, type, category, description, frequency, startDate, endDate, autoProcess } = req.body;
    
    if (!amount || !type || !category || !frequency) {
      return res.status(400).json({ 
        error: 'Amount, type, category, and frequency are required' 
      });
    }
    
    const start = startDate ? new Date(startDate) : new Date();
    const nextOccurrence = new Date(start);
    
    switch (frequency) {
      case 'daily':
        break;
      case 'weekly':
        nextOccurrence.setDate(nextOccurrence.getDate() + 7);
        break;
      case 'biweekly':
        nextOccurrence.setDate(nextOccurrence.getDate() + 14);
        break;
      case 'monthly':
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        break;
      case 'quarterly':
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 3);
        break;
      case 'yearly':
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
        break;
      default:
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
    }
    
    const recurring = new RecurringTransaction({
      userId: req.user._id,
      amount,
      type,
      category,
      description: description || '',
      frequency,
      startDate: start,
      nextOccurrence,
      endDate: endDate ? new Date(endDate) : null,
      autoProcess: autoProcess || false
    });
    
    await recurring.save();
    res.status(201).json({ recurring });
  } catch (error) {
    logger.error('Create recurring error:', error);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { amount, type, category, description, frequency, startDate, endDate, isActive, autoProcess } = req.body;
    
    const recurring = await RecurringTransaction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    if (amount !== undefined) recurring.amount = amount;
    if (type !== undefined) recurring.type = type;
    if (category !== undefined) recurring.category = category;
    if (description !== undefined) recurring.description = description;
    if (frequency !== undefined) recurring.frequency = frequency;
    if (startDate !== undefined) {
      recurring.startDate = new Date(startDate);
      recurring.nextOccurrence = recurring.calculateNextOccurrence(new Date(startDate));
    }
    if (frequency !== undefined && startDate === undefined) {
      recurring.nextOccurrence = recurring.calculateNextOccurrence(recurring.startDate);
    }
    if (endDate !== undefined) recurring.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) recurring.isActive = isActive;
    if (autoProcess !== undefined) recurring.autoProcess = autoProcess;
    
    await recurring.save();
    res.json({ recurring });
  } catch (error) {
    logger.error('Update recurring error:', error);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
});

router.post('/process', async (req, res) => {
  try {
    const processed = await RecurringTransaction.processRecurring(req.user._id);
    res.json({ 
      message: `Processed ${processed.length} recurring transactions`,
      transactions: processed 
    });
  } catch (error) {
    logger.error('Process recurring error:', error);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    logger.error('Delete recurring error:', error);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
});

module.exports = router;
