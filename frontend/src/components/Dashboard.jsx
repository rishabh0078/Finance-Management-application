import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import StatsCard from './StatsCard';
import RecentTransactions from './RecentTransactions';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import BudgetOverview from './BudgetOverview';
import BudgetGoalTracker from './BudgetGoalTracker';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    balance, 
    dashboardData, 
    loading, 
    error, 
    loadDashboardData,
    clearError,
    budgets,
    loadBudgets
  } = useFinance();

  // State for month selection and view mode
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'alltime'
  
  // State for modals
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Load dashboard data on component mount or when month/view changes
  useEffect(() => {
    loadDashboardData(viewMode === 'monthly' ? selectedDate : null);
    loadBudgets(); // Load budgets for overview
  }, [loadDashboardData, loadBudgets, selectedDate, viewMode]);

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Format selected month for display
  const formattedMonth = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && 
                         selectedDate.getFullYear() === new Date().getFullYear();

  // Dynamic stats based on real data and view mode (3 stats + 1 budget tracker)
  const stats = [
    {
      title: viewMode === 'monthly' ? 'Monthly Savings' : 'Total Balance',
      value: `₹${balance.balance?.toLocaleString() || '0.00'}`,
      change: '+2.5%',
      changeType: balance.balance >= 0 ? 'positive' : 'negative',
      icon: <Wallet className="w-6 h-6" />,
      gradient: true
    },
    {
      title: viewMode === 'monthly' ? 'Income' : 'Total Income',
      value: `₹${balance.income?.toLocaleString() || '0.00'}`,
      change: '+8.1%',
      changeType: 'positive',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: viewMode === 'monthly' ? 'Expenses' : 'Total Expenses',
      value: `₹${balance.expense?.toLocaleString() || '0.00'}`,
      change: '-3.2%',
      changeType: 'negative',
      icon: <CreditCard className="w-6 h-6" />
    }
  ];

  // Handler functions for quick actions
  const handleAddIncome = () => {
    setTransactionType('income');
    setTransactionModalOpen(true);
  };

  const handleAddExpense = () => {
    setTransactionType('expense');
    setTransactionModalOpen(true);
  };

  const handleSetBudget = () => {
    // Check if there's an existing budget
    const budgetList = Array.isArray(budgets) ? budgets : [];
    const activeBudgets = budgetList.filter(b => b.isActive !== false);
    
    // Prefer "Overall Budget" if it exists, otherwise use the first active budget
    const existingBudget = activeBudgets.find(b => 
      b.category === 'Overall Budget' || b.category === 'Overall'
    ) || activeBudgets[0];
    
    if (existingBudget) {
      // Open in edit mode with existing budget
      setEditingBudget(existingBudget);
    } else {
      // Open in create mode (no existing budget)
      setEditingBudget(null);
    }
    
    setBudgetModalOpen(true);
  };

  const quickActions = [
    {
      title: 'Add Income',
      description: 'Record new income',
      icon: <ArrowUpRight className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: handleAddIncome
    },
    {
      title: 'Add Expense',
      description: 'Log new expense',
      icon: <ArrowDownRight className="w-5 h-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: handleAddExpense
    },
    {
      title: 'Set Budget',
      description: 'Create budget plan',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: handleSetBudget
    }
  ];

  // Show error if there's an issue loading data
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              loadDashboardData();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Welcome back{user?.name ? `, ${user.name}` : ''}!
              </h2>
              <p className="text-gray-600 mt-3 flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-medium">{viewMode === 'monthly' ? `Viewing ${formattedMonth}` : 'All-Time Overview'}</span>
              </p>
            </div>
          
          {/* View Mode Toggle and Month Selector */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  viewMode === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('alltime')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  viewMode === 'alltime'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                All-Time
              </button>
            </div>

            {/* Month Selector Container - Fixed width to prevent layout shift */}
            <div className="w-[180px]">
              {viewMode === 'monthly' && (
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-2 shadow-sm">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={goToCurrentMonth}
                    disabled={isCurrentMonth}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      isCurrentMonth
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                    title="Go to current month"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden lg:flex space-x-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105`}
              >
                {action.icon}
                <span className="hidden xl:inline">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
          {/* Budget Goal Tracker - Replaces Savings Rate */}
          <BudgetGoalTracker />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>

          {/* Budget Overview - Takes 1 column */}
          <div className="lg:col-span-1">
            <BudgetOverview />
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="lg:hidden mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-5 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-4 shadow-lg hover:shadow-xl hover:scale-[1.02]`}
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-base">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        initialType={transactionType}
      />

      {/* Budget Form Modal */}
      <BudgetForm
        isOpen={budgetModalOpen}
        onClose={() => {
          setBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        budget={editingBudget}
      />
    </div>
  );
};

export default Dashboard;
