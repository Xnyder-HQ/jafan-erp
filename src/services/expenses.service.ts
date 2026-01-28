import api from './api';

export interface Expense {
  unique_id: string;
  purchase_order_unique_id: string | null;
  fuel_purchase_unique_id: string | null;
  vendor_payment_unique_id: string | null;
  machine_maintenance_log_unique_id: string | null;
  stacking_log_unique_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  receipt_image: string | null;
  receipt_image_public_id: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: {
    unique_id: string;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    middlename: string | null;
    profile_image: string | null;
    Role?: {
      unique_id: string;
      name: string;
      stripped: string;
    };
  };
  PurchaseOrder?: {
    unique_id: string;
    reference: string;
    po_type: string;
    total_amount: number;
  };
  FuelPurchase?: {
    unique_id: string;
    reference: string;
    fuel_type: string;
    total_cost: number;
  };
  VendorPayment?: {
    unique_id: string;
    amount_paid: number;
    payment_method: string;
  };
}

export interface ExpensesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Expense[];
    pages: number;
  } | Expense[] | null;
}

export interface ExpenseResponse {
  success: boolean;
  message: string;
  data: Expense | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
}

interface SearchParams extends PaginationParams {
  search: string;
}

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

export interface AddExpensePayload {
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
  receipt_image?: string;
  receipt_image_public_id?: string;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

export const expensesService = {
  getExpenses: async (params: PaginationParams): Promise<ExpensesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/expenses?${query}`);
    return response.data;
  },

  getExpense: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ExpenseResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/expense?${query}`);
    return response.data;
  },

  searchExpenses: async (params: SearchParams): Promise<ExpensesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/expenses?${query}`);
    return response.data;
  },

  filterExpenses: async (params: FilterParams): Promise<ExpensesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/expenses?${query}`);
    return response.data;
  },

  addExpense: async (
    data: AddExpensePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/expense/add?${query}`, data);
    return response.data;
  },

  deleteExpense: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.delete(`/user/expense?${query}`);
    return response.data;
  },
};

export default expensesService;
