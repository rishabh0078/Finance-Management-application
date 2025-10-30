import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  budgetAmount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount must be positive']
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold must be between 0 and 100'],
    max: [100, 'Alert threshold must be between 0 and 100'],
    default: 80 // Alert when 80% of budget is spent
  },
  color: {
    type: String,
    default: '#3B82F6' // Blue color
  }
}, {
  timestamps: true
});

// Index for better query performance
budgetSchema.index({ user: 1, category: 1 });
budgetSchema.index({ user: 1, isActive: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.budgetAmount - this.spentAmount);
});

// Virtual for percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  return this.budgetAmount > 0 ? (this.spentAmount / this.budgetAmount) * 100 : 0;
});

// Virtual for status
budgetSchema.virtual('status').get(function() {
  const percentage = this.percentageSpent;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'good';
});

// Method to update spent amount
budgetSchema.methods.updateSpentAmount = async function() {
  const FinancialRecord = mongoose.model('FinancialRecord');
  
  const result = await FinancialRecord.aggregate([
    {
      $match: {
        user: this.user,
        type: 'expense',
        category: this.category,
        date: { $gte: this.startDate, $lte: this.endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  this.spentAmount = result.length > 0 ? result[0].total : 0;
  return await this.save();
};

// Static method to get user's budget overview
budgetSchema.statics.getUserBudgetOverview = async function(userId) {
  const currentDate = new Date();
  
  return await this.find({
    user: userId,
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate }
  }).sort({ category: 1 });
};

export default mongoose.model('Budget', budgetSchema);
