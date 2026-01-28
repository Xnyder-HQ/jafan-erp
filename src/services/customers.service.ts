import api from './api';

export interface Customer {
  unique_id: string;
  reference: string;
  type: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  alt_phone_number: string | null;
  billing_address: string | null;
  other_address: string | null;
  balance: number;
  profile_image: string | null;
  profile_image_public_id: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: {
    unique_id: string;
    firstname: string;
    middlename: string;
    lastname: string;
    username: string;
    email: string;
    Role?: {
      unique_id: string;
      name: string;
      stripped: string;
    };
  };
}

export interface CustomersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Customer[];
    pages: number;
  } | null;
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer | null;
}

export interface AddCustomerPayload {
  type: string;
  name: string;
  email?: string;
  phone_number?: string;
  alt_phone_number?: string;
  billing_address?: string;
  other_address?: string;
  balance?: number;
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

export const customersService = {
  getCustomers: async (params: PaginationParams): Promise<CustomersResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/customers?${queryParams.toString()}`);
    return response.data;
  },

  getCustomer: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<CustomerResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/customer?${queryParams.toString()}`);
    return response.data;
  },

  searchCustomers: async (params: SearchParams): Promise<CustomersResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/customers?${queryParams.toString()}`);
    return response.data;
  },

  filterCustomers: async (params: FilterParams): Promise<CustomersResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/customers?${queryParams.toString()}`);
    return response.data;
  },

  addCustomer: async (payload: AddCustomerPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/customer/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateCustomerDetails: async (unique_id: string, payload: { name: string; email?: string; phone_number?: string; alt_phone_number?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/customer/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateCustomerAddress: async (unique_id: string, payload: { billing_address?: string; other_address?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/customer/edit/address?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateCustomerBalance: async (unique_id: string, payload: { balance: number }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/customer/edit/balance?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateCustomerProfileImage: async (unique_id: string, payload: { profile_image: string; profile_image_public_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/customer/edit/profile/image?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  deleteCustomer: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/customer?${queryParams.toString()}`);
    return response.data;
  },
};

export default customersService;
