import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, Loader, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const TransactionForm = ({ isOpen, onClose, initialType = 'expense', transaction = null }) => {
  const { createRecord, updateRecord, loadDashboardData, error } = useFinance();
  const isEditMode = !!transaction;
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: initialType,
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction && isEditMode) {
        // Pre-fill form with transaction data for editing
        const transactionDate = new Date(transaction.date);
        setFormData({
          description: transaction.description || '',
          amount: transaction.amount || '',
          type: transaction.type || initialType,
          category: transaction.category || '',
          date: transactionDate.toISOString().split('T')[0]
        });
      } else {
        // Reset form for new transaction
        setFormData({
          description: '',
          amount: '',
          type: initialType,
          category: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialType, transaction, isEditMode]);

  const categories = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other']
  };

  const typeLabels = {
    income: 'Income',
    expense: 'Expense'
  };

  const typeColors = {
    income: 'from-green-500 to-green-600',
    expense: 'from-red-500 to-red-600'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const recordData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (isEditMode && transaction?._id) {
        await updateRecord(transaction._id, recordData);
      } else {
        await createRecord(recordData);
      }
      
      // Refresh dashboard to show updated/new transaction
      await loadDashboardData();
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        type: initialType,
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} transaction:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { category: '' })
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className={`sticky top-0 bg-gradient-to-r ${typeColors[formData.type]} px-6 py-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {formData.type === 'income' ? (
                <ArrowUpRight className="w-6 h-6 text-white" />
              ) : (
                <ArrowDownRight className="w-6 h-6 text-white" />
              )}
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit' : 'Add'} {typeLabels[formData.type]}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/90 mt-2">{isEditMode ? 'Update transaction details' : 'Quick and easy transaction entry'}</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Description */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                <FileText className="w-5 h-5 inline mr-2 text-blue-600" />
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g., Groceries, Salary, etc."
                autoFocus
              />
            </div>

            {/* Amount - Large and Prominent */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                <DollarSign className="w-5 h-5 inline mr-2 text-blue-600" />
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-medium">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                <Tag className="w-5 h-5 inline mr-2 text-blue-600" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select a category</option>
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                <Calendar className="w-5 h-5 inline mr-2 text-blue-600" />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
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
                disabled={isSubmitting || !formData.description || !formData.amount || !formData.category}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${typeColors[formData.type]} text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {formData.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 mr-2" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 mr-2" />
                    )}
                    {isEditMode ? 'Update' : 'Add'} {typeLabels[formData.type]}
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

export default TransactionForm;
