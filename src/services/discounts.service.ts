import api from './api';

export interface Discount {
  unique_id: string;
  sales_order_unique_id: string;
  invoice_unique_id: string | null;
  discount_amount: number;
  reason: string | null;
  created_by: string;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SalesOrder?: {
    unique_id: string;
    reference: string;
    total_amount: number;
    discount_amount: number;
    outside_town: boolean;
    outside_town_location: string | null;
    estimated_trip_liters: number;
    outside_town_surcharge: number;
    amount_payable: number;
    total_items_ordered: number;
    total_items_dropped: number;
    order_status: string;
    Customer?: {
      unique_id: string;
      reference: string;
      type: string;
      name: string;
      email: string | null;
      phone_number: string | null;
      alt_phone_number: string | null;
      balance: number;
      profile_image: string | null;
    };
  };
  Invoice?: {
    unique_id: string;
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
  };
  Creator?: {
    unique_id: string;
    firstname: string;
    middlename: string | null;
    lastname: string;
    username: string;
    email: string;
    profile_image: string | null;
    Role?: {
      unique_id: string;
      name: string;
      stripped: string;
    };
  };
  Approver?: {
    unique_id: string;
    firstname: string;
    middlename: string | null;
    lastname: string;
    username: string;
  };
}

export interface DiscountsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Discount[];
    pages: number;
  } | null;
}

export interface DiscountResponse {
  success: boolean;
  message: string;
  data: Discount | null;
}

export interface AddDiscountPayload {
  sales_order_unique_id: string;
  discount_amount: number;
  reason?: string;
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

export const discountsService = {
  getDiscounts: async (params: PaginationParams): Promise<DiscountsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/discounts?${queryParams.toString()}`);
    return response.data;
  },

  getDiscount: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<DiscountResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/discount?${queryParams.toString()}`);
    return response.data;
  },

  searchDiscounts: async (params: SearchParams): Promise<DiscountsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/discounts?${queryParams.toString()}`);
    return response.data;
  },

  filterDiscounts: async (params: FilterParams): Promise<DiscountsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/discounts?${queryParams.toString()}`);
    return response.data;
  },

  addDiscount: async (payload: AddDiscountPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/discount/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateDiscount: async (unique_id: string, payload: { discount_amount: number; reason?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/discount/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  approveDiscount: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/approve/discount?${queryParams.toString()}`, { unique_id });
    return response.data;
  },

  deleteDiscount: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/discount?${queryParams.toString()}`);
    return response.data;
  },
};

export default discountsService;
