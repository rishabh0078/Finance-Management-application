import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Search, Filter, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionForm from './TransactionForm';

const Transactions = () => {
  const { records, loadRecords, deleteRecord, loading, error } = useFinance();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('all');

  // Load all transactions on component mount
  useEffect(() => {
    loadRecords({ sort: '-date' }); // Sort by date descending (newest first)
  }, [loadRecords]);

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
    return amount >= 0 ? `+₹${absAmount.toFixed(2)}` : `-₹${absAmount.toFixed(2)}`;
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteRecord(transactionId);
        // Small delay to ensure backend has processed the deletion
        setTimeout(() => {
          loadRecords({ sort: '-date' }); // Reload transactions
        }, 300);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddClose = () => {
    setIsAddModalOpen(false);
  };

  // Reload transactions after modal closes (TransactionForm calls loadDashboardData, but we need to reload records too)
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
      // Small delay to ensure TransactionForm has finished saving
      const timer = setTimeout(() => {
        loadRecords({ sort: '-date' }); // Reload transactions when modals close
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAddModalOpen, isEditModalOpen, loadRecords]);

  // Get unique categories from transactions
  const categories = [...new Set(records.map(t => t.category))].sort();

  // Filter transactions
  const filteredTransactions = records.filter(transaction => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = filterType === 'all' || transaction.type === filterType;

    // Category filter
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date);
    const dateKey = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {});

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">View and manage all your financial transactions</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">₹{totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Transactions List */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-6">
                {records.length === 0 
                  ? "Start by adding your first transaction"
                  : "Try adjusting your filters"}
              </p>
              {records.length === 0 && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Add Transaction
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedTransactions).map(([dateKey, transactions]) => (
                <div key={dateKey} className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-1">
                    {dateKey}
                  </h3>
                  <div className="space-y-2">
                    {transactions.map((transaction) => {
                      const displayAmount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
                      
                      return (
                        <div
                          key={transaction._id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                              <span className="text-xl">{getCategoryIcon(transaction.category)}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getAmountColor(displayAmount)}`}>
                                {formatAmount(displayAmount)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(transaction)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit transaction"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(transaction._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={handleAddClose}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionForm
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          transaction={editingTransaction}
          initialType={editingTransaction.type}
        />
      )}
    </div>
  );
};

export default Transactions;

