import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const BudgetGoalTracker = () => {
  const { budgets, balance, loadBudgets } = useFinance();
  const [budgetData, setBudgetData] = useState(null);

  useEffect(() => {
    if (!budgets || budgets.length === 0) {
      loadBudgets();
    }
  }, [budgets, loadBudgets]);

  useEffect(() => {
    const budgetList = Array.isArray(budgets) ? budgets : [];
    
    if (budgetList.length > 0) {
      const activeBudgets = budgetList.filter(b => b.isActive !== false);
      
      if (activeBudgets.length > 0) {
        // Check if there's an "Overall Budget"
        const overallBudget = activeBudgets.find(b => 
          b.category === 'Overall Budget' || b.category === 'Overall'
        );
        
        let totalBudget, totalSpent;
        
        if (overallBudget) {
          // For overall budget, use total expenses from balance
          totalBudget = parseFloat(overallBudget.budgetAmount) || 0;
          totalSpent = parseFloat(balance?.expense) || 0;
        } else {
          // Sum all active budgets
          totalBudget = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.budgetAmount) || 0), 0);
          totalSpent = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.spentAmount) || 0), 0);
        }
        
        const remaining = Math.max(0, totalBudget - totalSpent);
        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const isExceeded = totalSpent > totalBudget;
        const isWarning = percentage >= 80 && !isExceeded;
        
        setBudgetData({
          totalBudget,
          totalSpent,
          remaining,
          percentage: Math.min(100, percentage),
          isExceeded,
          isWarning,
          status: isExceeded ? 'exceeded' : isWarning ? 'warning' : 'good'
        });
      } else {
        setBudgetData(null);
      }
    } else {
      setBudgetData(null);
    }
  }, [budgets, balance]);

  if (!budgetData || budgetData.totalBudget === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Budget Goal</h3>
              <p className="text-xs text-gray-500">No budget set</p>
            </div>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Set a budget to track your spending goals</p>
        </div>
      </div>
    );
  }

  const { totalBudget, totalSpent, remaining, percentage, status, isExceeded, isWarning } = budgetData;

  const getStatusColor = () => {
    if (isExceeded) return 'from-red-500 to-pink-600';
    if (isWarning) return 'from-yellow-500 to-orange-600';
    return 'from-green-500 to-emerald-600';
  };

  const getStatusBg = () => {
    if (isExceeded) return 'from-red-50 to-pink-50 border-red-100';
    if (isWarning) return 'from-yellow-50 to-orange-50 border-yellow-100';
    return 'from-green-50 to-emerald-50 border-green-100';
  };

  const getStatusIcon = () => {
    if (isExceeded) return <AlertCircle className="w-5 h-5 text-white" />;
    if (isWarning) return <AlertCircle className="w-5 h-5 text-white" />;
    return <CheckCircle className="w-5 h-5 text-white" />;
  };

  const getStatusText = () => {
    if (isExceeded) return 'Exceeded';
    if (isWarning) return 'Warning';
    return 'On Track';
  };

  return (
    <div className={`bg-gradient-to-br ${getStatusBg()} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${getStatusColor()} rounded-xl flex items-center justify-center shadow-md`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Budget Goal</h3>
            <p className="text-xs text-gray-500">{getStatusText()}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">Spent</span>
          <span className="text-xs font-semibold text-gray-900">
            ₹{totalSpent.toLocaleString()} / ₹{totalBudget.toLocaleString()}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out shadow-sm`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {percentage.toFixed(1)}% used
          </span>
          {!isExceeded && (
            <span className="text-xs font-medium text-green-600">
              ₹{remaining.toLocaleString()} left
            </span>
          )}
          {isExceeded && (
            <span className="text-xs font-medium text-red-600">
              ₹{Math.abs(remaining).toLocaleString()} over
            </span>
          )}
        </div>
      </div>

      {isWarning && (
        <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ You've used {percentage.toFixed(0)}% of your budget
          </p>
        </div>
      )}

      {isExceeded && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg">
          <p className="text-xs text-red-800">
            ⚠️ Budget exceeded by ₹{Math.abs(remaining).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetGoalTracker;

