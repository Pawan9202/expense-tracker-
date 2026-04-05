const Transaction = require('../models/transaction');
const Budget = require('../models/budget');
const Goal = require('../models/goal');
const Category = require('../models/category');
const RecurringTransaction = require('../models/recurringTransaction');

const exportUserData = async (userId, format = 'json') => {
  const transactions = await Transaction.find({ userId }).sort({ date: -1 });
  const budgets = await Budget.find({ userId });
  const goals = await Goal.find({ userId });
  const categories = await Category.find({ userId });
  const recurring = await RecurringTransaction.find({ userId });

  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    transactions: transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date.toISOString(),
      receiptUrl: t.receiptUrl
    })),
    budgets: budgets.map(b => ({
      category: b.category,
      amount: b.amount,
      period: b.period,
      alertThreshold: b.alertThreshold,
      startDate: b.startDate?.toISOString(),
      isActive: b.isActive
    })),
    goals: goals.map(g => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline?.toISOString(),
      isCompleted: g.isCompleted
    })),
    categories: categories.map(c => ({
      name: c.name,
      type: c.type,
      color: c.color
    })),
    recurringTransactions: recurring.map(r => ({
      amount: r.amount,
      type: r.type,
      category: r.category,
      description: r.description,
      frequency: r.frequency,
      startDate: r.startDate?.toISOString(),
      isActive: r.isActive
    }))
  };

  if (format === 'csv') {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.type,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  return JSON.stringify(data, null, 2);
};

const importUserData = async (userId, jsonData) => {
  const data = JSON.parse(jsonData);
  const results = { transactions: 0, budgets: 0, goals: 0, categories: 0, recurring: 0, errors: [] };

  try {
    if (data.transactions?.length > 0) {
      const transactions = data.transactions.map(t => ({
        userId,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description || '',
        date: new Date(t.date),
        receiptUrl: t.receiptUrl || null
      }));
      await Transaction.insertMany(transactions, { ordered: false });
      results.transactions = transactions.length;
    }

    if (data.budgets?.length > 0) {
      const budgets = data.budgets.map(b => ({
        userId,
        category: b.category,
        amount: b.amount,
        period: b.period || 'monthly',
        alertThreshold: b.alertThreshold || 80,
        startDate: b.startDate ? new Date(b.startDate) : new Date(),
        isActive: b.isActive !== false
      }));
      await Budget.insertMany(budgets, { ordered: false });
      results.budgets = budgets.length;
    }

    if (data.goals?.length > 0) {
      const goals = data.goals.map(g => ({
        userId,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount || 0,
        deadline: g.deadline ? new Date(g.deadline) : null,
        isCompleted: g.isCompleted || false
      }));
      await Goal.insertMany(goals, { ordered: false });
      results.goals = goals.length;
    }

    if (data.categories?.length > 0) {
      for (const c of data.categories) {
        await Category.findOneAndUpdate(
          { userId, name: c.name },
          { $setOnInsert: { userId, name: c.name, type: c.type, color: c.color } },
          { upsert: true }
        );
      }
      results.categories = data.categories.length;
    }

    if (data.recurringTransactions?.length > 0) {
      const recurring = data.recurringTransactions.map(r => ({
        userId,
        amount: r.amount,
        type: r.type,
        category: r.category,
        description: r.description || '',
        frequency: r.frequency || 'monthly',
        startDate: r.startDate ? new Date(r.startDate) : new Date(),
        isActive: r.isActive !== false
      }));
      await RecurringTransaction.insertMany(recurring, { ordered: false });
      results.recurring = recurring.length;
    }
  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
};

module.exports = {
  exportUserData,
  importUserData
};