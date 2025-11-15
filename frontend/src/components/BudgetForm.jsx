import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Loader, Calendar, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const BudgetForm = ({ isOpen, onClose, budget = null }) => {
  const { createBudget, updateBudget, loadDashboardData, error } = useFinance();
  const isEditMode = !!budget;
  const [formData, setFormData] = useState({
    budgetAmount: '',
    period: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const periods = [
    { value: 'weekly', label: 'Weekly', icon: '📅' },
    { value: 'monthly', label: 'Monthly', icon: '📆' },
    { value: 'yearly', label: 'Yearly', icon: '📊' }
  ];

  // Reset form when modal opens or budget changes
  useEffect(() => {
    if (isOpen) {
      if (budget && isEditMode) {
        // Pre-fill form with budget data for editing
        setFormData({
          budgetAmount: budget.budgetAmount || '',
          period: budget.period || 'monthly'
        });
      } else {
        // Reset form for new budget
        setFormData({
          budgetAmount: '',
          period: 'monthly'
        });
      }
    }
  }, [isOpen, budget, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const budgetData = {
        budgetAmount: parseFloat(formData.budgetAmount),
        period: formData.period,
        alertThreshold: budget?.alertThreshold || 80,
        category: budget?.category || 'Overall Budget' // Include category for validation
      };

      if (isEditMode && budget?._id) {
        await updateBudget(budget._id, budgetData);
      } else {
        // Use default category "Overall Budget" for new budgets
        await createBudget({
          category: 'Overall Budget',
          ...budgetData
        });
      }
      
      // Refresh dashboard to show updated/new budget
      await loadDashboardData();
      
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} budget:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Budget' : 'Set Your Budget'}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-blue-100 mt-2">{isEditMode ? 'Update your budget details' : 'Quick and simple budget setup'}</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Budget Amount - Large and Prominent */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                <DollarSign className="w-5 h-5 inline mr-2 text-blue-600" />
                Budget Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">₹</span>
                <input
                  type="number"
                  name="budgetAmount"
                  value={formData.budgetAmount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter the total amount you want to budget</p>
            </div>

            {/* Period Selection - Button Style */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                <Calendar className="w-5 h-5 inline mr-2 text-blue-600" />
                Budget Period
              </label>
              <div className="grid grid-cols-3 gap-3">
                {periods.map(period => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, period: period.value }))}
                    className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.period === period.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{period.icon}</div>
                    <div className={`text-sm font-semibold ${
                      formData.period === period.value ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {period.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.budgetAmount}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {isEditMode ? 'Update Budget' : 'Set Budget'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm;

