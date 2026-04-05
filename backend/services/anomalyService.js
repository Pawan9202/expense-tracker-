const Transaction = require('../models/transaction');

const detectAnomalies = async (userId, newTransaction = null) => {
  const anomalies = [];

  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: threeMonthsAgo }
    });

    if (transactions.length < 10) {
      return anomalies;
    }

    const categoryStats = {};
    transactions.forEach(t => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { amounts: [], count: 0, total: 0 };
      }
      categoryStats[t.category].amounts.push(t.amount);
      categoryStats[t.category].total += t.amount;
      categoryStats[t.category].count++;
    });

    for (const [category, stats] of Object.entries(categoryStats)) {
      if (stats.count < 3) continue;

      const amounts = stats.amounts.sort((a, b) => a - b);
      const mean = stats.total / stats.count;
      const median = amounts[Math.floor(amounts.length / 2)];
      
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const upperThreshold = mean + (2 * stdDev);

      if (newTransaction && newTransaction.category === category) {
        if (newTransaction.amount > upperThreshold) {
          anomalies.push({
            type: 'high_amount',
            category: category,
            message: `This ${category} expense ($${newTransaction.amount}) is unusually high (typical range: $${median - stdDev} - ${median + stdDev})`,
            typicalAmount: median,
            threshold: upperThreshold
          });
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime();
    });

    const dailyTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (newTransaction) {
      const newDailyTotal = dailyTotal + newTransaction.amount;
      if (newDailyTotal > 1000) {
        anomalies.push({
          type: 'high_daily_spending',
          message: `You've spent $${newDailyTotal} today, which is quite high`,
          dailyTotal: newDailyTotal
        });
      }
    }

    const daysSinceLastIncome = Math.floor((today - new Date(transactions.find(t => t.type === 'income')?.date || today)) / (1000 * 60 * 60 * 24));
    const recentExpenses = transactions.filter(t => t.type === 'expense' && (today - new Date(t.date)) / (1000 * 60 * 60 * 24) < 7);
    if (recentExpenses.length > 20 && daysSinceLastIncome > 14) {
      anomalies.push({
        type: 'spending_streak',
        message: `You've made ${recentExpenses.length} transactions in the last 7 days without any income`,
        transactionCount: recentExpenses.length
      });
    }

  } catch (error) {
    console.error('Anomaly detection error:', error);
  }

  return anomalies;
};

module.exports = {
  detectAnomalies
};