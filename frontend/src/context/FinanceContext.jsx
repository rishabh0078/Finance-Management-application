import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';

// Set to true to use mock data (for development without MongoDB)
const USE_MOCK_DATA = false;

// Initial state
const initialState = {
  records: [],
  balance: { income: 0, expense: 0, balance: 0 },
  budgets: [],
  dashboardData: null,
  loading: false,
  error: null,
  lastUpdated: null
};

// Action types
const FINANCE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_RECORDS: 'SET_RECORDS',
  ADD_RECORD: 'ADD_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  SET_BALANCE: 'SET_BALANCE',
  SET_BUDGETS: 'SET_BUDGETS',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const financeReducer = (state, action) => {
  switch (action.type) {
    case FINANCE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case FINANCE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case FINANCE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case FINANCE_ACTIONS.SET_RECORDS:
      return {
        ...state,
        records: action.payload,
        loading: false,
        lastUpdated: new Date().toISOString()
      };
    
    case FINANCE_ACTIONS.ADD_RECORD:
      return {
        ...state,
        records: [action.payload, ...state.records],
        lastUpdated: new Date().toISOString()
      };
    
    case FINANCE_ACTIONS.UPDATE_RECORD:
      return {
        ...state,
        records: state.records.map(record =>
          record._id === action.payload._id ? action.payload : record
        ),
        lastUpdated: new Date().toISOString()
      };
    
    case FINANCE_ACTIONS.DELETE_RECORD:
      return {
        ...state,
        records: state.records.filter(record => record._id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case FINANCE_ACTIONS.SET_BALANCE:
      return {
        ...state,
        balance: action.payload
      };
    
    case FINANCE_ACTIONS.SET_BUDGETS:
      return {
        ...state,
        budgets: action.payload
      };
    
    case FINANCE_ACTIONS.SET_DASHBOARD_DATA:
      return {
        ...state,
        dashboardData: action.payload,
        balance: action.payload.balance,
        records: action.payload.recentRecords || state.records,
        loading: false,
        lastUpdated: new Date().toISOString()
      };
    
    case FINANCE_ACTIONS.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Create context
const FinanceContext = createContext();

// Finance provider component
export const FinanceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Error handler
  const handleError = useCallback((error) => {
    console.error('Finance operation error:', error);
    dispatch({
      type: FINANCE_ACTIONS.SET_ERROR,
      payload: error.message || 'An error occurred'
    });
  }, []);

  // Load dashboard data - using mock data or real API
  // If date is provided, returns monthly data for that month
  // If date is null, returns all-time data
  const loadDashboardData = useCallback(async (date = null) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: FINANCE_ACTIONS.SET_LOADING, payload: true });
    
    try {
      let balanceData;
      let recentRecords;
      
      if (USE_MOCK_DATA) {
        // MOCK DATA MODE - No backend needed
        if (date) {
          // Monthly mock data
          const month = date.getMonth();
          const year = date.getFullYear();
          const monthlyIncome = 5000 + (month * 100);
          const monthlyExpense = 3200 + (month * 80);
          
          balanceData = {
            income: monthlyIncome,
            expense: monthlyExpense,
            balance: monthlyIncome - monthlyExpense
          };
          
          recentRecords = [
            { _id: '1', description: 'Salary', amount: monthlyIncome, type: 'income', category: 'Salary', date: new Date(year, month, 5).toISOString() },
            { _id: '2', description: 'Rent', amount: 1200, type: 'expense', category: 'Housing', date: new Date(year, month, 10).toISOString() },
            { _id: '3', description: 'Groceries', amount: 500, type: 'expense', category: 'Food & Dining', date: new Date(year, month, 15).toISOString() },
            { _id: '4', description: 'Utilities', amount: 150, type: 'expense', category: 'Utilities', date: new Date(year, month, 20).toISOString() },
            { _id: '5', description: 'Transportation', amount: 200, type: 'expense', category: 'Transportation', date: new Date(year, month, 25).toISOString() }
          ];
        } else {
          // All-time mock data
          balanceData = {
            income: 60000,
            expense: 38400,
            balance: 21600
          };
          
          recentRecords = [
            { _id: '1', description: 'Salary', amount: 5000, type: 'income', category: 'Salary', date: new Date().toISOString() },
            { _id: '2', description: 'Freelance Project', amount: 800, type: 'income', category: 'Freelance', date: new Date(Date.now() - 86400000).toISOString() },
            { _id: '3', description: 'Rent', amount: 1200, type: 'expense', category: 'Housing', date: new Date(Date.now() - 172800000).toISOString() },
            { _id: '4', description: 'Groceries', amount: 350, type: 'expense', category: 'Food & Dining', date: new Date(Date.now() - 259200000).toISOString() },
            { _id: '5', description: 'Gas', amount: 60, type: 'expense', category: 'Transportation', date: new Date(Date.now() - 345600000).toISOString() }
          ];
        }
      } else {
        // REAL API MODE - Requires backend and MongoDB
        if (date) {
          // Monthly view - get data for specific month
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          
          const monthlySummary = await apiService.getMonthlySummary(year, month);
          const startDate = new Date(year, month - 1, 1).toISOString();
          const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
          const recordsResponse = await apiService.getFinancialRecords({ 
            startDate, 
            endDate, 
            limit: 5,
            sort: '-date'
          });
          
          balanceData = {
            income: monthlySummary.income || 0,
            expense: monthlySummary.expense || 0,
            balance: monthlySummary.balance || 0
          };
          
          recentRecords = recordsResponse.records || recordsResponse || [];
        } else {
          // All-time view
          balanceData = await apiService.getUserBalance();
          const recordsResponse = await apiService.getFinancialRecords({ 
            limit: 5,
            sort: '-date'
          });
          
          recentRecords = recordsResponse.records || recordsResponse || [];
        }
      }
      
      const dashboardData = {
        balance: balanceData,
        recentRecords: recentRecords,
        monthlyData: date ? {
          income: balanceData.income,
          expense: balanceData.expense,
          savings: balanceData.balance,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        } : null,
        timestamp: new Date().toISOString()
      };
      
      dispatch({
        type: FINANCE_ACTIONS.SET_DASHBOARD_DATA,
        payload: dashboardData
      });
    } catch (error) {
      handleError(error);
    }
  }, [isAuthenticated, handleError]);

  // Load financial records - using real API
  const loadRecords = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: FINANCE_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await apiService.getFinancialRecords(params);
      dispatch({
        type: FINANCE_ACTIONS.SET_RECORDS,
        payload: response.records || response || []
      });
    } catch (error) {
      handleError(error);
    }
  }, [isAuthenticated, handleError]);

  // Create financial record
  const createRecord = useCallback(async (recordData) => {
    if (!isAuthenticated) return;
    
    try {
      if (USE_MOCK_DATA) {
        // MOCK MODE - Just simulate success
        console.log('✅ Mock transaction created:', recordData);
        const mockRecord = {
          _id: Date.now().toString(),
          ...recordData,
          date: recordData.date || new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        dispatch({
          type: FINANCE_ACTIONS.ADD_RECORD,
          payload: mockRecord
        });
        
        return mockRecord;
      } else {
        // REAL API MODE
        const newRecord = await apiService.createFinancialRecord(recordData);
        dispatch({
          type: FINANCE_ACTIONS.ADD_RECORD,
          payload: newRecord
        });
        
        // Refresh balance
        const balance = await apiService.getUserBalance();
        dispatch({
          type: FINANCE_ACTIONS.SET_BALANCE,
          payload: balance
        });
        
        return newRecord;
      }
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Update financial record
  const updateRecord = useCallback(async (id, recordData) => {
    if (!isAuthenticated) return;
    
    try {
      const updatedRecord = await apiService.updateFinancialRecord(id, recordData);
      dispatch({
        type: FINANCE_ACTIONS.UPDATE_RECORD,
        payload: updatedRecord
      });
      
      // Refresh balance
      const balance = await apiService.getUserBalance();
      dispatch({
        type: FINANCE_ACTIONS.SET_BALANCE,
        payload: balance
      });
      
      return updatedRecord;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Delete financial record
  const deleteRecord = useCallback(async (id) => {
    if (!isAuthenticated) return;
    
    try {
      await apiService.deleteFinancialRecord(id);
      dispatch({
        type: FINANCE_ACTIONS.DELETE_RECORD,
        payload: id
      });
      
      // Refresh balance
      const balance = await apiService.getUserBalance();
      dispatch({
        type: FINANCE_ACTIONS.SET_BALANCE,
        payload: balance
      });
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Load budgets
  const loadBudgets = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiService.getBudgets();
      const budgets = response.budgets || response || [];
      dispatch({
        type: FINANCE_ACTIONS.SET_BUDGETS,
        payload: budgets
      });
    } catch (error) {
      handleError(error);
    }
  }, [isAuthenticated, handleError]);

  // Create budget
  const createBudget = useCallback(async (budgetData) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiService.createBudget(budgetData);
      const newBudget = response.budget || response;
      
      // Reload budgets to get updated list
      await loadBudgets();
      
      return newBudget;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError, loadBudgets]);

  // Update budget
  const updateBudget = useCallback(async (id, budgetData) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiService.updateBudget(id, budgetData);
      const updatedBudget = response.budget || response;
      
      // Reload budgets to get updated list
      await loadBudgets();
      
      return updatedBudget;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError, loadBudgets]);

  // Delete budget
  const deleteBudget = useCallback(async (id) => {
    if (!isAuthenticated) return;
    
    try {
      await apiService.deleteBudget(id);
      
      // Reload budgets to get updated list
      await loadBudgets();
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [isAuthenticated, handleError, loadBudgets]);

  // Get financial data for AI
  const getFinancialDataForAI = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    try {
      return await apiService.getFinancialDataForAI();
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [isAuthenticated, handleError]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: FINANCE_ACTIONS.CLEAR_ERROR });
  }, []);

  // Reset state (for logout)
  const resetState = useCallback(() => {
    dispatch({ type: FINANCE_ACTIONS.RESET_STATE });
  }, []);

  const value = {
    ...state,
    loadDashboardData,
    loadRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getFinancialDataForAI,
    clearError,
    resetState
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook to use finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export default FinanceContext;
