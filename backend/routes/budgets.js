const express = require('express');
const router = express.Router();
const Budget = require('../models/budget');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id, isActive: true })
      .sort({ category: 1 });
    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    const progress = await Budget.getBudgetProgress(req.user._id, {
      startDate,
      endDate,
      period
    });
    res.json({ budgets: progress });
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({ error: 'Failed to fetch budget progress' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category, amount, period, alertThreshold, startDate } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }
    
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      category,
      period: period || 'monthly',
      isActive: true
    });
    
    if (existingBudget) {
      return res.status(400).json({ 
        error: 'A budget for this category already exists',
        budget: existingBudget
      });
    }
    
    const budget = new Budget({
      userId: req.user._id,
      category,
      amount,
      period: period || 'monthly',
      alertThreshold: alertThreshold || 80,
      startDate: startDate || new Date()
    });
    
    await budget.save();
    res.status(201).json({ budget });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { category, amount, period, alertThreshold, isActive } = req.body;
    
    const budget = await Budget.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (category !== undefined) budget.category = category;
    if (amount !== undefined) budget.amount = amount;
    if (period !== undefined) budget.period = period;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (isActive !== undefined) budget.isActive = isActive;
    
    await budget.save();
    res.json({ budget });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    budget.isActive = false;
    await budget.save();
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
