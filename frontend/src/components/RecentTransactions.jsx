import React from 'react';
import { useFinance } from '../context/FinanceContext';

const RecentTransactions = () => {
  const { dashboardData } = useFinance();
  
  // Get transactions from context or use empty array
  const transactions = dashboardData?.recentRecords || [];
  
  // Category to icon mapping
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Salary': '💼',
      'Freelance': '💻',
      'Investment': '📈',
      'Business': '🏢',
      'Food': '🛒',
      'Food & Dining': '🍽️',
      'Transportation': '⛽',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Utilities': '💡',
      'Healthcare': '🏥',
      'Housing': '🏠',
      'Other': '📌'
    };
    return iconMap[category] || '💰';
  };

  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    return amount >= 0 ? `+$${absAmount.toFixed(2)}` : `-$${absAmount.toFixed(2)}`;
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Start by adding your first transaction</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            // Format date
            const transactionDate = new Date(transaction.date);
            const formattedDate = transactionDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: transactionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
            
            // Calculate display amount (expenses are negative in DB)
            const displayAmount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
            
            return (
              <div key={transaction._id} className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 rounded-xl transition-all duration-200 group cursor-pointer border border-transparent hover:border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <span className="text-xl">{getCategoryIcon(transaction.category)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium">{transaction.category}</span>
                      <span className="mx-1.5">•</span>
                      <span>{formattedDate}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getAmountColor(displayAmount)}`}>
                    {formatAmount(displayAmount)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
