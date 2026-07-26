const Budget = require('../models/budget');
const Notification = require('../models/notification');
const logger = require('../utils/logger');

const checkBudgetAlerts = async (userId, io) => {
  try {
    const budgets = await Budget.getBudgetProgress(userId, { period: 'monthly' });
    
    for (const budget of budgets) {
      if (budget.alertTriggered && !budget.alertSent) {
        await Notification.createBudgetAlert(userId, budget, budget.percentage);
        
        if (io) {
          io.to(userId.toString()).emit('budget_alert', {
            category: budget.category,
            percentage: budget.percentage,
            spent: budget.spent,
            amount: budget.amount
          });
        }
      }
    }
  } catch (error) {
    logger.error('Budget alert check failed:', error);
  }
};

const checkBudgetOnTransaction = async (userId, category, newAmount, io) => {
  try {
    const budgets = await Budget.find({ 
      userId, 
      category,
      isActive: true,
      period: 'monthly'
    });

    for (const budget of budgets) {
      const spent = newAmount;
      const percentage = (spent / budget.amount) * 100;
      
      if (percentage >= budget.alertThreshold) {
        const existingUnread = await Notification.findOne({
          userId,
          'data.budgetId': budget._id,
          isRead: false,
          createdAt: { $gte: new Date(Date.now() - 3600000) }
        });

        if (!existingUnread) {
          await Notification.createBudgetAlert(userId, { ...budget.toObject(), spent }, percentage);
          
          if (io) {
            io.to(userId.toString()).emit('budget_alert', {
              category: budget.category,
              percentage: Math.min(percentage, 100),
              spent,
              amount: budget.amount
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Budget check on transaction failed:', error);
  }
};

module.exports = {
  checkBudgetAlerts,
  checkBudgetOnTransaction
};