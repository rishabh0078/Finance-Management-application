import express from 'express';
import Budget from '../models/Budget.js';
import { protect } from '../middleware/auth.js';
import { validateBudget } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all budgets for user
// @route   GET /api/budget
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const query = { user: req.user.id };
    if (active === 'true') {
      query.isActive = true;
    }

    const budgets = await Budget.find(query).sort({ category: 1 });

    // Update spent amounts for all budgets
    for (let budget of budgets) {
      await budget.updateSpentAmount();
    }

    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
});

// @desc    Get single budget
// @route   GET /api/budget/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Update spent amount
    await budget.updateSpentAmount();

    res.json({ budget });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
});

// @desc    Create new budget
// @route   POST /api/budget
// @access  Private
router.post('/', validateBudget, async (req, res) => {
  try {
    const { category, budgetAmount, period, alertThreshold, color } = req.body;

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category,
      isActive: true
    });

    if (existingBudget) {
      return res.status(400).json({ 
        message: 'Active budget already exists for this category' 
      });
    }

    // Calculate start and end dates based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const budget = await Budget.create({
      user: req.user.id,
      category,
      budgetAmount,
      period,
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80,
      color: color || '#3B82F6'
    });

    // Update spent amount
    await budget.updateSpentAmount();

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error creating budget' });
  }
});

// @desc    Update budget
// @route   PUT /api/budget/:id
// @access  Private
router.put('/:id', validateBudget, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { budgetAmount, period, alertThreshold, category } = req.body;
    
    // Update fields
    if (budgetAmount !== undefined) budget.budgetAmount = budgetAmount;
    if (period !== undefined) budget.period = period;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (category !== undefined) budget.category = category;

    // If period changed, recalculate start and end dates
    if (period && period !== budget.period) {
      const now = new Date();
      let startDate, endDate;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      budget.startDate = startDate;
      budget.endDate = endDate;
    }

    await budget.save();

    // Update spent amount
    await budget.updateSpentAmount();

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error updating budget' });
  }
});

// @desc    Delete budget
// @route   DELETE /api/budget/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await budget.deleteOne();

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error deleting budget' });
  }
});

// @desc    Get budget overview for user
// @route   GET /api/budget/overview
// @access  Private
router.get('/overview/summary', async (req, res) => {
  try {
    const budgets = await Budget.getUserBudgetOverview(req.user.id);

    // Update spent amounts
    for (let budget of budgets) {
      await budget.updateSpentAmount();
    }

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
    const totalRemaining = totalBudget - totalSpent;

    // Get budgets by status
    const budgetsByStatus = {
      good: budgets.filter(b => b.status === 'good'),
      warning: budgets.filter(b => b.status === 'warning'),
      exceeded: budgets.filter(b => b.status === 'exceeded')
    };

    res.json({
      budgets,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        percentageSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      budgetsByStatus
    });
  } catch (error) {
    console.error('Budget overview error:', error);
    res.status(500).json({ message: 'Server error fetching budget overview' });
  }
});

// @desc    Toggle budget active status
// @route   PATCH /api/budget/:id/toggle
// @access  Private
router.patch('/:id/toggle', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.isActive = !budget.isActive;
    await budget.save();

    res.json({
      message: `Budget ${budget.isActive ? 'activated' : 'deactivated'} successfully`,
      budget
    });
  } catch (error) {
    console.error('Toggle budget error:', error);
    res.status(500).json({ message: 'Server error toggling budget status' });
  }
});

export default router;
