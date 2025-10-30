import React from 'react';

const BudgetOverview = () => {
  // Sample budget data
  const budgetCategories = [
    {
      category: 'Food & Dining',
      spent: 450,
      budget: 600,
      icon: '🍽️',
      color: 'bg-blue-500'
    },
    {
      category: 'Transportation',
      spent: 180,
      budget: 250,
      icon: '🚗',
      color: 'bg-green-500'
    },
    {
      category: 'Entertainment',
      spent: 120,
      budget: 150,
      icon: '🎬',
      color: 'bg-purple-500'
    },
    {
      category: 'Shopping',
      spent: 320,
      budget: 300,
      icon: '🛍️',
      color: 'bg-red-500'
    },
    {
      category: 'Utilities',
      spent: 180,
      budget: 200,
      icon: '⚡',
      color: 'bg-yellow-500'
    }
  ];

  const getProgressPercentage = (spent, budget) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Overview</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Manage
        </button>
      </div>

      <div className="space-y-4">
        {budgetCategories.map((item, index) => {
          const progressPercentage = getProgressPercentage(item.spent, item.budget);
          const progressColor = getProgressColor(item.spent, item.budget);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-gray-900 text-sm">{item.category}</span>
                </div>
                <span className="text-sm text-gray-600">
                  ${item.spent} / ${item.budget}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progressPercentage.toFixed(0)}% used</span>
                <span>${item.budget - item.spent} remaining</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900">Total Budget</span>
          <span className="font-bold text-lg text-gray-900">
            $1,250 / $1,500
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-500 h-3 rounded-full" style={{ width: '83%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
