const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [1, 'Budget amount must be at least 1']
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 50,
    max: 100
  },
  startDate: {
    type: Date,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

budgetSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

budgetSchema.methods.getSpentAmount = async function(transactions) {
  const spent = transactions
    .filter(t => t.category === this.category && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return spent;
};

budgetSchema.statics.getBudgetProgress = async function(userId, filters = {}) {
  const Transaction = require('./transaction');
  const { startDate, endDate, period } = filters;
  
  const now = new Date();
  let start, end;
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (period) {
      case 'weekly':
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default: // monthly
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
  }
  
  const budgets = await this.find({ 
    userId, 
    isActive: true,
    period: period || 'monthly'
  });
  
  const transactions = await Transaction.find({
    userId,
    type: 'expense',
    date: { $gte: start, $lte: end }
  });
  
  const budgetProgress = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = Math.max(0, budget.amount - spent);
    const isOverBudget = spent > budget.amount;
    const alertTriggered = percentage >= budget.alertThreshold;
    
    return {
      ...budget.toJSON(),
      spent,
      percentage: Math.min(percentage, 100),
      remaining,
      isOverBudget,
      alertTriggered
    };
  });
  
  return budgetProgress;
};

module.exports = mongoose.model('Budget', budgetSchema);
