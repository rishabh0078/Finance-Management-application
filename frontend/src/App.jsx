import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Login from './components/Login';

// Main app component with authentication
const MainApp = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const handleAddTransaction = () => {
    setIsTransactionFormOpen(true);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Transactions</h2>
              <p className="text-gray-600 mb-6">Detailed transaction management coming soon!</p>
              <button 
                onClick={() => setIsTransactionFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Add New Transaction
              </button>
            </div>
          </div>
        );
      case 'budget':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Budget Management</h2>
              <p className="text-gray-600">Advanced budget tracking features coming soon!</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">App configuration options coming soon!</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-gray-50">
        <Header 
          onAddTransaction={handleAddTransaction}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        
        <main>
          {renderContent()}
        </main>
        
        <TransactionForm 
          isOpen={isTransactionFormOpen}
          onClose={() => setIsTransactionFormOpen(false)}
        />
      </div>
    </FinanceProvider>
  );
};

// Root App component with providers
const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;