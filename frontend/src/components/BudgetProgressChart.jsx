import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const BudgetProgressChart = () => {
  const { balance, budgets, loadBudgets } = useFinance();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Load budgets if not already loaded
    if (!budgets || budgets.length === 0) {
      loadBudgets();
    }
  }, [budgets, loadBudgets]);

  useEffect(() => {
    // Calculate budget achievement
    const budgetList = Array.isArray(budgets) ? budgets : [];
    
    if (budgetList.length > 0) {
      // Get active budgets and calculate total
      const activeBudgets = budgetList.filter(b => b.isActive !== false);
      
      if (activeBudgets.length > 0) {
        // Check if there's an "Overall Budget" - if so, use total expenses from balance
        const overallBudget = activeBudgets.find(b => 
          b.category === 'Overall Budget' || b.category === 'Overall'
        );
        
        let totalBudget, totalSpent;
        
        if (overallBudget) {
          // For overall budget, use total expenses from balance
          totalBudget = parseFloat(overallBudget.budgetAmount) || 0;
          totalSpent = parseFloat(balance?.expense) || 0;
        } else {
          // Sum all active budgets and their spent amounts
          totalBudget = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.budgetAmount) || 0), 0);
          totalSpent = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.spentAmount) || 0), 0);
        }
        
        const remaining = Math.max(0, totalBudget - totalSpent);
        const exceeded = Math.max(0, totalSpent - totalBudget);
        
        const data = [];
        
        if (exceeded > 0) {
          // Budget exceeded
          data.push(
            { name: 'Budget', value: totalBudget, color: '#3B82F6' },
            { name: 'Exceeded', value: exceeded, color: '#EF4444' }
          );
        } else {
          // Within budget
          if (totalBudget > 0) {
            data.push(
              { name: 'Spent', value: totalSpent, color: '#10B981' },
              { name: 'Remaining', value: remaining, color: '#E5E7EB' }
            );
          }
        }
        
        if (data.length > 0) {
          setChartData(data);
        } else {
          showSavingsGoal();
        }
      } else {
        // No active budgets - show savings goal
        showSavingsGoal();
      }
    } else {
      // No budgets set - show savings goal
      showSavingsGoal();
    }

    function showSavingsGoal() {
      const income = parseFloat(balance?.income) || 0;
      const expense = parseFloat(balance?.expense) || 0;
      const savings = Math.max(0, income - expense);
      const goal = income > 0 ? income * 0.2 : 0; // 20% savings goal
      
      if (goal > 0) {
        setChartData([
          { name: 'Achieved', value: Math.min(savings, goal), color: '#10B981' },
          { name: 'Remaining', value: Math.max(0, goal - savings), color: '#E5E7EB' }
        ]);
      } else {
        setChartData([]);
      }
    }
  }, [budgets, balance]);

  // Calculate achievement percentage
  const getAchievementPercentage = () => {
    const budgetList = Array.isArray(budgets) ? budgets : [];
    
    if (budgetList.length > 0) {
      const activeBudgets = budgetList.filter(b => b.isActive !== false);
      if (activeBudgets.length > 0) {
        // Check for overall budget
        const overallBudget = activeBudgets.find(b => 
          b.category === 'Overall Budget' || b.category === 'Overall'
        );
        
        let totalBudget, totalSpent;
        
        if (overallBudget) {
          totalBudget = parseFloat(overallBudget.budgetAmount) || 0;
          totalSpent = parseFloat(balance?.expense) || 0;
        } else {
          totalBudget = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.budgetAmount) || 0), 0);
          totalSpent = activeBudgets.reduce((sum, b) => sum + (parseFloat(b.spentAmount) || 0), 0);
        }
        
        if (totalBudget > 0) {
          return Math.min(100, (totalSpent / totalBudget) * 100);
        }
      }
    }
    // Fallback to savings goal
    const income = parseFloat(balance?.income) || 0;
    const goal = income > 0 ? income * 0.2 : 0;
    if (goal > 0) {
      const savings = Math.max(0, income - (parseFloat(balance?.expense) || 0));
      return Math.min(100, (savings / goal) * 100);
    }
    return 0;
  };

  const achievementPercentage = getAchievementPercentage();
  const hasData = chartData.length > 0 && chartData.some(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-blue-600 font-bold">₹{payload[0].value?.toFixed(2) || '0.00'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {budgets && Array.isArray(budgets) && budgets.length > 0 ? 'Budget Achievement' : 'Savings Goal'}
          </p>
          <p className="text-2xl font-bold text-gray-900">{achievementPercentage.toFixed(0)}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
          <Target className="w-6 h-6 text-gray-700" />
        </div>
      </div>

      {hasData ? (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-2 pt-4 border-t border-gray-100">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">₹{(item.value || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Target className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No budget set yet</p>
          <p className="text-xs text-gray-400 mt-1">Set a budget to track your progress</p>
        </div>
      )}
    </div>
  );
};

export default BudgetProgressChart;

