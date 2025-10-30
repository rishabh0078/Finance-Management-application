// API Service for backend communication
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Financial Records methods
  async getFinancialRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/records${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async createFinancialRecord(recordData) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async updateFinancialRecord(id, recordData) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  }

  async deleteFinancialRecord(id) {
    return this.request(`/records/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserBalance() {
    return this.request('/records/balance');
  }

  async getMonthlySummary(year, month) {
    return this.request(`/records/monthly-summary?year=${year}&month=${month}`);
  }

  async getCategoryBreakdown(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/records/category-breakdown?${queryString}`);
  }

  async getSpendingTrends(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/records/spending-trends?${queryString}`);
  }

  // Budget methods
  async getBudgets() {
    return this.request('/budget');
  }

  async createBudget(budgetData) {
    return this.request('/budget', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id, budgetData) {
    return this.request(`/budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id) {
    return this.request(`/budget/${id}`, {
      method: 'DELETE',
    });
  }

  async getBudgetOverview() {
    return this.request('/budget/overview');
  }

  // Dashboard data aggregation
  async getDashboardData() {
    try {
      const [balance, recentRecords, monthlyData] = await Promise.all([
        this.getUserBalance(),
        this.getFinancialRecords({ limit: 10, sort: '-date' }),
        this.getMonthlySummary(new Date().getFullYear(), new Date().getMonth() + 1)
      ]);

      return {
        balance,
        recentRecords: recentRecords.records || recentRecords,
        monthlyData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  // AI Integration helper
  async getFinancialDataForAI() {
    try {
      const [records, balance, categoryBreakdown] = await Promise.all([
        this.getFinancialRecords({ limit: 100 }),
        this.getUserBalance(),
        this.getCategoryBreakdown({ period: 'month' })
      ]);

      return {
        totalBalance: balance.balance,
        monthlyIncome: balance.income,
        monthlyExpenses: balance.expense,
        transactions: records.records || records,
        categories: categoryBreakdown
      };
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      return this.request('/health');
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }
}

// Export singleton instance
export default new ApiService();
