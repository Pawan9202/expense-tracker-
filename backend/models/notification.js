const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['budget_alert', 'budget_exceeded', 'goal_achieved', 'recurring_due', 'system', 'insight'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
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

notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

notificationSchema.statics.createBudgetAlert = async function(userId, budget, percentage) {
  return this.create({
    userId,
    type: percentage >= 100 ? 'budget_exceeded' : 'budget_alert',
    title: percentage >= 100 ? 'Budget Exceeded!' : 'Budget Alert',
    message: `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget ($${budget.spent?.toFixed(2) || 0} of $${budget.amount})`,
    data: { budgetId: budget._id, category: budget.category, percentage }
  });
};

notificationSchema.statics.createGoalAlert = async function(userId, goal, progress) {
  return this.create({
    userId,
    type: 'goal_achieved',
    title: progress >= 100 ? 'Goal Achieved!' : 'Goal Progress',
    message: progress >= 100 
      ? `Congratulations! You've reached your "${goal.name}" goal!`
      : `Your "${goal.name}" goal is ${progress.toFixed(0)}% complete`,
    data: { goalId: goal._id, name: goal.name, progress }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);