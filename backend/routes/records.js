import express from 'express';
import mongoose from 'mongoose';
import FinancialRecord from '../models/FinancialRecord.js';
import Budget from '../models/Budget.js';
import { protect } from '../middleware/auth.js';
import { validateFinancialRecord } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all financial records for user
// @route   GET /api/records
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    
    if (type) query.type = type;
    if (category) query.category = new RegExp(category, 'i');
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const records = await FinancialRecord.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FinancialRecord.countDocuments(query);

    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error fetching records' });
  }
});

// IMPORTANT: Specific routes must be defined BEFORE the generic /:id route
// Otherwise, Express will match /balance, /monthly-summary, etc. as /:id

// @desc    Get user's total balance (all-time)
// @route   GET /api/records/balance
// @access  Private
router.get('/balance', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id || req.user.id;
    const balance = await FinancialRecord.getUserBalance(userId);
    res.json(balance);
  } catch (error) {
    console.error('Balance error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get monthly summary for specific month
// @route   GET /api/records/monthly-summary?year=2024&month=10
// @access  Private
router.get('/monthly-summary', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    // For month N, we want the last day of month N
    // new Date(year, month, 0) gives last day of previous month, so we use month (which is index month-1)
    // For month 11 (November): new Date(2025, 11, 0) = Nov 30, 2025 (day 0 of month 11 = last day of month 10)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Convert userId to ObjectId if it's a string
    const userId = req.user._id || req.user.id;
    const userIdObj = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const summary = await FinancialRecord.aggregate([
      {
        $match: {
          user: userIdObj,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;

    res.json({
      income,
      expense,
      balance: income - expense,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching monthly summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get category breakdown
// @route   GET /api/records/category-breakdown?year=2024&month=10
// @access  Private
router.get('/category-breakdown', async (req, res) => {
  try {
    const { year, month, type = 'expense' } = req.query;
    
    const userIdObj = typeof req.user.id === 'string' 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;
    
    let matchQuery = { user: userIdObj, type };
    
    // If year and month provided, filter by that month
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    const categoryBreakdown = await FinancialRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(categoryBreakdown);
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ message: 'Server error fetching category breakdown' });
  }
});

// @desc    Get user's financial summary (combined endpoint)
// @route   GET /api/records/summary/overview
// @access  Private
router.get('/summary/overview', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Get overall balance
    const balance = await FinancialRecord.getUserBalance(req.user.id);
    
    // Get monthly summary if year and month provided
    let monthlySummary = null;
    if (year && month) {
      monthlySummary = await FinancialRecord.getMonthlySummary(req.user.id, parseInt(year), parseInt(month));
    }

    // Get recent records
    const recentRecords = await FinancialRecord.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    // Get category breakdown for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const userIdObj = typeof req.user.id === 'string' 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;

    const categoryBreakdown = await FinancialRecord.aggregate([
      {
        $match: {
          user: userIdObj,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      balance,
      monthlySummary,
      recentRecords,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
});

// @desc    Get single financial record
// @route   GET /api/records/:id
// @access  Private
// NOTE: This must be LAST to avoid matching specific routes like /balance, /monthly-summary
router.get('/:id', async (req, res) => {
  try {
    // Validate that the ID looks like a MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }

    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Server error fetching record' });
  }
});

// @desc    Create new financial record
// @route   POST /api/records
// @access  Private
router.post('/', validateFinancialRecord, async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      user: req.user.id
    };

    const record = await FinancialRecord.create(recordData);

    // Update related budget if it's an expense
    if (record.type === 'expense') {
      const budget = await Budget.findOne({
        user: req.user.id,
        category: record.category,
        isActive: true,
        startDate: { $lte: record.date },
        endDate: { $gte: record.date }
      });

      if (budget) {
        await budget.updateSpentAmount();
      }
    }

    res.status(201).json({
      message: 'Record created successfully',
      record
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Server error creating record' });
  }
});

// @desc    Update financial record
// @route   PUT /api/records/:id
// @access  Private
router.put('/:id', validateFinancialRecord, async (req, res) => {
  try {
    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const oldCategory = record.category;
    const oldType = record.type;

    // Update record
    Object.assign(record, req.body);
    await record.save();

    // Update budgets if category or type changed
    if (oldType === 'expense' || record.type === 'expense') {
      // Update old category budget
      if (oldCategory !== record.category) {
        const oldBudget = await Budget.findOne({
          user: req.user.id,
          category: oldCategory,
          isActive: true
        });
        if (oldBudget) await oldBudget.updateSpentAmount();
      }

      // Update new category budget
      const newBudget = await Budget.findOne({
        user: req.user.id,
        category: record.category,
        isActive: true,
        startDate: { $lte: record.date },
        endDate: { $gte: record.date }
      });
      if (newBudget) await newBudget.updateSpentAmount();
    }

    res.json({
      message: 'Record updated successfully',
      record
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Server error updating record' });
  }
});

// @desc    Delete financial record
// @route   DELETE /api/records/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await record.deleteOne();

    // Update related budget if it was an expense
    if (record.type === 'expense') {
      const budget = await Budget.findOne({
        user: req.user.id,
        category: record.category,
        isActive: true
      });
      if (budget) await budget.updateSpentAmount();
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Server error deleting record' });
  }
});

// @desc    Get user's total balance (all-time)
// @route   GET /api/records/balance
// @access  Private
router.get('/balance', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id || req.user.id;
    const balance = await FinancialRecord.getUserBalance(userId);
    res.json(balance);
  } catch (error) {
    console.error('Balance error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get monthly summary for specific month
// @route   GET /api/records/monthly-summary?year=2024&month=10
// @access  Private
router.get('/monthly-summary', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    // For month N, we want the last day of month N
    // new Date(year, month, 0) gives last day of previous month, so we use month (which is index month-1)
    // For month 11 (November): new Date(2025, 11, 0) = Nov 30, 2025 (day 0 of month 11 = last day of month 10)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Convert userId to ObjectId if it's a string
    const userId = req.user._id || req.user.id;
    const userIdObj = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const summary = await FinancialRecord.aggregate([
      {
        $match: {
          user: userIdObj,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;

    res.json({
      income,
      expense,
      balance: income - expense,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching monthly summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get category breakdown
// @route   GET /api/records/category-breakdown?year=2024&month=10
// @access  Private
router.get('/category-breakdown', async (req, res) => {
  try {
    const { year, month, type = 'expense' } = req.query;
    
    const userIdObj = typeof req.user.id === 'string' 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;
    
    let matchQuery = { user: userIdObj, type };
    
    // If year and month provided, filter by that month
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    const categoryBreakdown = await FinancialRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(categoryBreakdown);
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ message: 'Server error fetching category breakdown' });
  }
});

// @desc    Get user's financial summary (combined endpoint)
// @route   GET /api/records/summary/overview
// @access  Private
router.get('/summary/overview', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Get overall balance
    const balance = await FinancialRecord.getUserBalance(req.user.id);
    
    // Get monthly summary if year and month provided
    let monthlySummary = null;
    if (year && month) {
      monthlySummary = await FinancialRecord.getMonthlySummary(req.user.id, parseInt(year), parseInt(month));
    }

    // Get recent records
    const recentRecords = await FinancialRecord.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    // Get category breakdown for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const userIdObj = typeof req.user.id === 'string' 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;

    const categoryBreakdown = await FinancialRecord.aggregate([
      {
        $match: {
          user: userIdObj,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      balance,
      monthlySummary,
      recentRecords,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
});

export default router;
