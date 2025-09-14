const API_BASE_URL = 'http://35.244.40.230:8000';

export interface Account {
  setting_id: string;
  account_type: 'bank' | 'cash';
  bank_name?: string;
  balance: number;
  holder_name?: string;
  account_number?: string;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  group_id: string;
  setting_id?: string;
  transaction_type: 'income' | 'expense' | 'loan_payable' | 'loan_receivable' | 'asset';
  category: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'credit_card' | 'upi' | 'other';
  description?: string;
  transaction_date: string;
}

export interface FinancialSummary {
  user_id: string;
  group_id: string;
  total_balance: number;
  balance: {
    accounts: Array<{
      account_name: string;
      account_type: 'bank' | 'cash';
      balance: number;
    }>;
    by_type: {
      bank: number;
      cash: number;
    };
  };
  income: number;
  expense: number;
  loan_payable: number;
  loan_receivable: number;
}

// API Functions
export const api = {
  // Account endpoints
  createBankAccount: async (data: {
    user_id: string;
    group_id: string;
    holder_name: string;
    account_type: 'bank';
    bank_name: string;
    account_number: string;
    balance: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/create_bank_account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  createCashAccount: async (data: {
    user_id: string;
    group_id: string;
    holder_name: string;
    setting_id?: string;
    cash: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/create_cash_account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAccounts: async (user_id: string, group_id: string): Promise<Account[]> => {
    const response = await fetch(`${API_BASE_URL}/bank_details?user_id=${user_id}&group_id=${group_id}`);
    return response.json();
  },

  // Transaction endpoints
  addTransaction: async (data: {
    user_id: string;
    group_id: string;
    setting_id?: string;
    transaction_type: string;
    category: string;
    amount: number;
    payment_method: string;
    description?: string;
    transaction_date: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/transactions/add-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  addTransactionByQuery: async (data: {
    user_id: string;
    group_id: string;
    setting_id?: string;
    query: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/transactions/add-transaction/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    // If the response is not successful, throw the error so it can be caught
    if (!response.ok) {
      throw result;
    }
    
    return result;
  },

  getFinancialSummary: async (user_id: string, group_id: string): Promise<FinancialSummary> => {
    const response = await fetch(`${API_BASE_URL}/transactions/account_info?user_id=${user_id}&group_id=${group_id}`);
    return response.json();
  },

  getTransactionHistory: async (
    user_id: string,
    group_id: string,
    filter_type: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom',
    start_date?: string,
    end_date?: string
  ) => {
    let url = `${API_BASE_URL}/transactions/history?user_id=${user_id}&group_id=${group_id}&filter_type=${filter_type}`;
    if (filter_type === 'custom' && start_date && end_date) {
      url += `&start_date=${start_date}&end_date=${end_date}`;
    }
    const response = await fetch(url);
    return response.json();
  },
};

// Helper function to get current user data
export const getCurrentUser = () => {
  const user_id = localStorage.getItem('user_id') || '1';
  const group_id = localStorage.getItem('group_id') || '1';
  return { user_id, group_id };
};

// Demo user data (fallback)
export const DEMO_USER = {
  user_id: '1',
  group_id: '1',
};