const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { exportUserData, importUserData } = require('../services/exportImportService');

const router = express.Router();

router.use(authenticateToken);

router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const data = await exportUserData(req.user._id, format);
    
    const filename = `finance-backup-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'json'}`;
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data', message: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { data, mode = 'merge' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    if (mode === 'replace') {
      const Transaction = require('../models/transaction');
      const Budget = require('../models/budget');
      const Goal = require('../models/goal');
      const Category = require('../models/category');
      const RecurringTransaction = require('../models/recurringTransaction');
      
      await Transaction.deleteMany({ userId: req.user._id });
      await Budget.deleteMany({ userId: req.user._id });
      await Goal.deleteMany({ userId: req.user._id });
      await Category.deleteMany({ userId: req.user._id });
      await RecurringTransaction.deleteMany({ userId: req.user._id });
    }

    const results = await importUserData(req.user._id, data);
    res.json({ 
      message: 'Import completed successfully', 
      results 
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data', message: error.message });
  }
});

module.exports = router;