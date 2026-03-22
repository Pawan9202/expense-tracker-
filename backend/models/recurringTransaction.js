const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: [true, 'Frequency is required']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  nextOccurrence: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoProcess: {
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

recurringTransactionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

recurringTransactionSchema.methods.calculateNextOccurrence = function(fromDate = new Date()) {
  const current = new Date(fromDate);
  switch (this.frequency) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekly':
      current.setDate(current.getDate() + 7);
      break;
    case 'biweekly':
      current.setDate(current.getDate() + 14);
      break;
    case 'monthly':
      current.setMonth(current.getMonth() + 1);
      break;
    case 'quarterly':
      current.setMonth(current.getMonth() + 3);
      break;
    case 'yearly':
      current.setFullYear(current.getFullYear() + 1);
      break;
    default:
      current.setMonth(current.getMonth() + 1);
  }
  return current;
};

recurringTransactionSchema.methods.shouldProcess = function() {
  if (!this.isActive) return false;
  if (this.endDate && new Date() > this.endDate) return false;
  if (!this.nextOccurrence) return true;
  return new Date() >= this.nextOccurrence;
};

recurringTransactionSchema.statics.getDueRecurring = async function(userId) {
  const recurring = await this.find({ userId, isActive: true });
  return recurring.filter(r => r.shouldProcess());
};

recurringTransactionSchema.statics.processRecurring = async function(userId) {
  const Transaction = require('./transaction');
  const dueRecurring = await this.getDueRecurring(userId);
  const processed = [];
  
  for (const recurring of dueRecurring) {
    const transaction = await Transaction.create({
      userId,
      amount: recurring.amount,
      type: recurring.type,
      category: recurring.category,
      description: `${recurring.description} (Recurring - ${recurring.frequency})`,
      date: recurring.nextOccurrence
    });
    
    recurring.lastProcessed = new Date();
    recurring.nextOccurrence = recurring.calculateNextOccurrence();
    
    if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
      recurring.isActive = false;
    }
    
    await recurring.save();
    processed.push(transaction);
  }
  
  return processed;
};

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
