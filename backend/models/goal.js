const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: 100
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be at least 1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  icon: {
    type: String,
    default: 'target'
  },
  color: {
    type: String,
    default: '#6366F1'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contributions: [{
    amount: Number,
    date: Date,
    note: String
  }]
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

goalSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

goalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

goalSchema.virtual('remaining').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diff = deadline - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

goalSchema.virtual('isOnTrack').get(function() {
  if (this.isCompleted) return true;
  const now = new Date();
  const startDate = this.createdAt || now;
  const deadline = new Date(this.deadline);
  const totalDays = (deadline - startDate) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now - startDate) / (1000 * 60 * 60 * 24);
  const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 100;
  return this.progress >= expectedProgress;
});

goalSchema.statics.getAllGoals = async function(userId) {
  const goals = await this.find({ userId, isActive: true }).sort({ deadline: 1 });
  return goals;
};

goalSchema.statics.addContribution = async function(goalId, userId, amount, note = '') {
  const goal = await this.findOne({ _id: goalId, userId });
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  if (amount <= 0) {
    throw new Error('Contribution amount must be positive');
  }
  
  goal.contributions.push({
    amount,
    date: new Date(),
    note
  });
  
  goal.currentAmount += amount;
  
  if (goal.currentAmount >= goal.targetAmount) {
    goal.isCompleted = true;
  }
  
  await goal.save();
  return goal;
};

module.exports = mongoose.model('Goal', goalSchema);
