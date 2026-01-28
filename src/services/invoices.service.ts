import api from './api';

export interface Invoice {
  unique_id: string;
  sales_order_unique_id: string;
  customer_unique_id: string;
  invoice_date: string;
  due_date: string;
  invoice_type: string;
  subtotal_amount: number;
  discount_amount: number;
  outside_town_surcharge: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  invoice_status: string;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  SalesOrder?: {
    unique_id: string;
    reference: string;
    total_amount: number;
    amount_payable: number;
    order_status: string;
  };
  Customer?: {
    unique_id: string;
    name: string;
    reference: string;
    phone_number: string | null;
    email: string | null;
  };
  User?: {
    unique_id: string;
    firstname: string;
    middlename: string;
    lastname: string;
    username: string;
    email: string;
  };
}

export interface InvoicesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Invoice[];
    pages: number;
  } | Invoice[] | null;
}

export interface InvoiceResponse {
  success: boolean;
  message: string;
  data: Invoice | null;
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

interface AddInvoicePayload {
  sales_order_unique_id: string;
  invoice_date: string;
  due_date: string;
  invoice_type: string;
  notes?: string;
}

interface UpdateDueDatePayload {
  due_date: string;
}

interface UpdateInvoiceTypePayload {
  invoice_type: string;
}

interface UpdateNotesPayload {
  notes?: string;
}

export const invoicesService = {
  getInvoices: async (params: PaginationParams): Promise<InvoicesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoices?${queryParams.toString()}`);
    return response.data;
  },

  getInvoicesSpecifically: async (params: PaginationParams): Promise<InvoicesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoices/specifically?${queryParams.toString()}`);
    return response.data;
  },

  getInvoice: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<InvoiceResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoice?${queryParams.toString()}`);
    return response.data;
  },

  searchInvoices: async (params: SearchParams): Promise<InvoicesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/invoices?${queryParams.toString()}`);
    return response.data;
  },

  filterInvoices: async (params: FilterParams): Promise<InvoicesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/invoices?${queryParams.toString()}`);
    return response.data;
  },

  addInvoice: async (data: AddInvoicePayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<InvoiceResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/invoice/add?${queryParams.toString()}`, data);
    return response.data;
  },

  updateDueDate: async (
    unique_id: string,
    data: UpdateDueDatePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/invoice/edit/due_date?${queryParams.toString()}`, data);
    return response.data;
  },

  updateInvoiceType: async (
    unique_id: string,
    data: UpdateInvoiceTypePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/invoice/edit/invoice_type?${queryParams.toString()}`, data);
    return response.data;
  },

  updateNotes: async (
    unique_id: string,
    data: UpdateNotesPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/invoice/edit/notes?${queryParams.toString()}`, data);
    return response.data;
  },

  cancelInvoice: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/cancel/invoice?${queryParams.toString()}`);
    return response.data;
  },

  deleteInvoice: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/invoice?${queryParams.toString()}`);
    return response.data;
  },
};

export default invoicesService;
