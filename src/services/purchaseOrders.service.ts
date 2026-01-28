import api from './api';

export interface PurchaseOrder {
  unique_id: string;
  vendor_unique_id: string;
  raw_material_unique_id: string | null;
  reference: string;
  po_type: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  quantity: number | null;
  order_date: string;
  expected_delivery_date: string | null;
  notes: string | null;
  payment_status: string;
  delivery_status: string;
  order_status: string;
  created_by: string;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Vendor?: {
    unique_id: string;
    reference: string;
    type: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone_number: string | null;
    total_spend: number;
  };
  RawMaterial?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string | null;
    unit_of_measure: string | null;
    current_quantity: number;
    reorder_level: number | null;
  };
  User?: {
    unique_id: string;
    firstname: string;
    lastname: string;
    email: string;
    Role?: {
      unique_id: string;
      name: string;
    };
  };
}

export interface PurchaseOrdersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: PurchaseOrder[];
    pages: number;
  } | PurchaseOrder[] | null;
}

export interface PurchaseOrderResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
  vendor_unique_id?: string;
}

interface SearchParams extends PaginationParams {
  search: string;
}

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

export interface AddPurchaseOrderPayload {
  vendor_unique_id: string;
  raw_material_unique_id?: string;
  po_type: string;
  total_amount: number;
  quantity?: number;
  order_date: string;
  expected_delivery_date?: string;
  notes?: string;
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

export const purchaseOrdersService = {
  getPurchaseOrders: async (params: PaginationParams): Promise<PurchaseOrdersResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/purchase/orders?${query}`);
    return response.data;
  },

  getPurchaseOrder: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<PurchaseOrderResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/purchase/order?${query}`);
    return response.data;
  },

  searchPurchaseOrders: async (params: SearchParams): Promise<PurchaseOrdersResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/purchase/orders?${query}`);
    return response.data;
  },

  filterPurchaseOrders: async (params: FilterParams): Promise<PurchaseOrdersResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/purchase/orders?${query}`);
    return response.data;
  },

  addPurchaseOrder: async (
    data: AddPurchaseOrderPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string; reference: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/purchase/order/add?${query}`, data);
    return response.data;
  },

  updatePOType: async (
    unique_id: string,
    po_type: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/po_type?${query}`, { unique_id, po_type });
    return response.data;
  },

  updateDates: async (
    unique_id: string,
    data: { order_date: string; expected_delivery_date?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/dates?${query}`, { unique_id, ...data });
    return response.data;
  },

  updateTotalAmount: async (
    unique_id: string,
    total_amount: number,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/total_amount?${query}`, { unique_id, total_amount });
    return response.data;
  },

  updateRawMaterial: async (
    unique_id: string,
    data: { raw_material_unique_id?: string; quantity?: number },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/raw_material?${query}`, { unique_id, ...data });
    return response.data;
  },

  updateNotes: async (
    unique_id: string,
    notes: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/notes?${query}`, { unique_id, notes });
    return response.data;
  },

  updateDeliveryStatus: async (
    unique_id: string,
    delivery_status: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/purchase/order/edit/delivery_status?${query}`, { unique_id, delivery_status });
    return response.data;
  },

  approvePurchaseOrder: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/approve/purchase/order?${query}`, { unique_id });
    return response.data;
  },

  completePurchaseOrder: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/complete/purchase/order?${query}`, { unique_id });
    return response.data;
  },

  deletePurchaseOrder: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.delete(`/user/purchase/order?${query}`);
    return response.data;
  },
};

export default purchaseOrdersService;
