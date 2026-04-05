const express = require('express');
const Transaction = require('../models/transaction');
const Budget = require('../models/budget');
const Goal = require('../models/goal');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const aiService = require('../services/aiService');
const { detectAnomalies } = require('../services/anomalyService');

const router = express.Router();

router.use(authenticateToken);

router.get('/spending', asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await Transaction.find({
    userId: req.user._id,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const insights = await aiService.generateSpendingInsights(
    transactions,
    monthNames[month - 1],
    year
  );

  res.json({ insights, month: monthNames[month - 1], year, transactionCount: transactions.length });
}));

router.get('/predict', asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    userId: req.user._id,
    type: 'expense'
  }).sort({ date: -1 }).limit(365);

  const prediction = await aiService.predictFutureSpending(transactions, 3);
  res.json(prediction);
}));

router.get('/health-score', asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await Transaction.find({
    userId: req.user._id,
    date: { $gte: sixMonthsAgo }
  });

  const monthlyData = {};
  transactions.forEach(t => {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyData[key].income += t.amount;
    else monthlyData[key].expense += t.amount;
  });

  const months = Object.keys(monthlyData).sort();
  if (months.length < 2) {
    return res.json({ score: null, message: 'Not enough data for health score' });
  }

  const savingsRates = months.map(m => {
    const income = monthlyData[m].income || 1;
    return (income - monthlyData[m].expense) / income;
  });

  const avgSavingsRate = savingsRates.reduce((a, b) => a + b, 0) / savingsRates.length;
  const variance = savingsRates.reduce((sum, r) => sum + Math.pow(r - avgSavingsRate, 2), 0) / savingsRates.length;
  const stabilityScore = Math.max(0, 100 - Math.sqrt(variance) * 200);

  const totalIncome = months.reduce((sum, m) => sum + monthlyData[m].income, 0);
  const totalExpense = months.reduce((sum, m) => sum + monthlyData[m].expense, 0);
  const overallSavingsRate = (totalIncome - totalExpense) / totalIncome;

  let score = Math.round(
    (overallSavingsRate * 50 + Math.max(0, avgSavingsRate) * 30 + stabilityScore * 20) + 50
  );
  score = Math.min(100, Math.max(0, score));

  let grade, recommendation;
  if (score >= 80) { grade = 'A'; recommendation = 'Excellent financial health! Keep up the good work.'; }
  else if (score >= 65) { grade = 'B'; recommendation = 'Good financial health. Focus on increasing savings rate.'; }
  else if (score >= 50) { grade = 'C'; recommendation = 'Fair financial health. Review your spending habits.'; }
  else { grade = 'D'; recommendation = 'Needs improvement. Consider creating a strict budget.'; }

  res.json({ score, grade, recommendation, avgSavingsRate: (avgSavingsRate * 100).toFixed(1), stabilityScore: Math.round(stabilityScore) });
}));

router.post('/categorize', asyncHandler(async (req, res) => {
  const { description, amount } = req.body;
  const category = await aiService.autoCategorizeTransaction(description, amount);
  res.json({ category });
}));

router.get('/anomalies', asyncHandler(async (req, res) => {
  const anomalies = await detectAnomalies(req.user._id);
  res.json({ anomalies });
}));

router.post('/anomalies/check', asyncHandler(async (req, res) => {
  const { amount, category } = req.body;
  const transaction = { amount: parseFloat(amount), category };
  const anomalies = await detectAnomalies(req.user._id, transaction);
  res.json({ anomalies });
}));

router.get('/net-worth', asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const transactions = await Transaction.find({
    userId: req.user._id,
    date: { $gte: twelveMonthsAgo }
  });

  const monthlyNetWorth = {};
  transactions.forEach(t => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyNetWorth[key]) monthlyNetWorth[key] = 0;
    if (t.type === 'income') monthlyNetWorth[key] += t.amount;
    else monthlyNetWorth[key] -= t.amount;
  });

  const sortedMonths = Object.keys(monthlyNetWorth).sort();
  let runningTotal = 0;
  const history = sortedMonths.map(month => {
    runningTotal += monthlyNetWorth[month];
    return { month, value: runningTotal };
  });

  const currentNetWorth = runningTotal;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  res.json({
    currentNetWorth,
    totalIncome,
    totalExpense,
    history,
    trend: history.length >= 2 ? (history[history.length - 1].value >= history[0].value ? 'positive' : 'negative') : 'neutral'
  });
}));

module.exports = router;