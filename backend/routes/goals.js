const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.getAllGoals(req.user._id);
    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ goal });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, targetAmount, deadline, category, icon, color } = req.body;
    
    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ error: 'Name, target amount, and deadline are required' });
    }
    
    const goal = new Goal({
      userId: req.user._id,
      name,
      targetAmount,
      currentAmount: 0,
      deadline: new Date(deadline),
      category: category || 'General',
      icon: icon || 'target',
      color: color || '#6366F1'
    });
    
    await goal.save();
    res.status(201).json({ goal });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, targetAmount, deadline, category, icon, color, isActive } = req.body;
    
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (deadline !== undefined) goal.deadline = new Date(deadline);
    if (category !== undefined) goal.category = category;
    if (icon !== undefined) goal.icon = icon;
    if (color !== undefined) goal.color = color;
    if (isActive !== undefined) goal.isActive = isActive;
    
    await goal.save();
    res.json({ goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.post('/:id/contribute', async (req, res) => {
  try {
    const { amount, note } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid contribution amount is required' });
    }
    
    const goal = await Goal.addContribution(
      req.params.id,
      req.user._id,
      amount,
      note || ''
    );
    
    res.json({ goal, message: 'Contribution added successfully' });
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({ error: error.message || 'Failed to add contribution' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
