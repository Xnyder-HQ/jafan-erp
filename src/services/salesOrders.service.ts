import api from './api';

export interface SalesOrderItem {
  unique_id: string;
  sales_order_unique_id: string;
  product_unique_id: string;
  product_name: string;
  unit_price: number;
  quantity_ordered: number;
  quantity_supplied: number;
  total_price: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  Product?: {
    unique_id: string;
    name: string;
    price: number;
  };
}

export interface SalesOrder {
  unique_id: string;
  reference: string;
  customer_unique_id: string;
  total_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  outside_town: boolean;
  outside_town_location: string | null;
  estimated_trip_liters: number;
  outside_town_surcharge: number;
  amount_payable: number;
  total_items_ordered: number;
  total_items_dropped: number;
  notes: string | null;
  order_status: string;
  created_by: string;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
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
  ApprovedBy?: {
    unique_id: string;
    firstname: string;
    lastname: string;
  };
  SalesOrderItems?: SalesOrderItem[];
}

export interface SalesOrdersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: SalesOrder[];
    pages: number;
  } | SalesOrder[] | null;
}

export interface SalesOrderResponse {
  success: boolean;
  message: string;
  data: SalesOrder | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
  customer_unique_id?: string;
}

interface SearchParams extends PaginationParams {
  search: string;
}

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

interface AddSalesOrderPayload {
  customer_unique_id: string;
  outside_town: boolean;
  outside_town_location?: string;
  outside_town_surcharge?: number;
  estimated_trip_liters?: number;
  notes?: string;
  items: {
    product_unique_id: string;
    quantity_ordered: number;
  }[];
}

interface UpdateOutsideTownPayload {
  outside_town: boolean;
  outside_town_location?: string;
  outside_town_surcharge?: number;
}

interface UpdateEstimatedTripLitersPayload {
  estimated_trip_liters?: number;
}

interface UpdateNotesPayload {
  notes?: string;
}

export const salesOrdersService = {
  getSalesOrders: async (params: PaginationParams): Promise<SalesOrdersResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);
    if (params.customer_unique_id) queryParams.append('customer_unique_id', params.customer_unique_id);

    const response = await api.get(`/user/sales/orders?${queryParams.toString()}`);
    return response.data;
  },

  getSalesOrder: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<SalesOrderResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/sales/order?${queryParams.toString()}`);
    return response.data;
  },

  searchSalesOrders: async (params: SearchParams): Promise<SalesOrdersResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/sales/orders?${queryParams.toString()}`);
    return response.data;
  },

  filterSalesOrders: async (params: FilterParams): Promise<SalesOrdersResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/sales/orders?${queryParams.toString()}`);
    return response.data;
  },

  addSalesOrder: async (data: AddSalesOrderPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<SalesOrderResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/sales/order/add?${queryParams.toString()}`, data);
    return response.data;
  },

  updateOutsideTownDetails: async (
    unique_id: string,
    data: UpdateOutsideTownPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/sales/order/edit/outside_town_details?${queryParams.toString()}`, data);
    return response.data;
  },

  updateEstimatedTripLiters: async (
    unique_id: string,
    data: UpdateEstimatedTripLitersPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/sales/order/edit/estimated_trip_liters?${queryParams.toString()}`, data);
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

    const response = await api.put(`/user/sales/order/edit/notes?${queryParams.toString()}`, data);
    return response.data;
  },

  approveSalesOrder: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/approve/sales/order?${queryParams.toString()}`);
    return response.data;
  },

  completeSalesOrder: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/complete/sales/order?${queryParams.toString()}`);
    return response.data;
  },

  deleteSalesOrder: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/sales/order?${queryParams.toString()}`);
    return response.data;
  },
};

export default salesOrdersService;
