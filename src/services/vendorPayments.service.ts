import api from './api';

export interface VendorPayment {
  unique_id: string;
  vendor_unique_id: string;
  purchase_order_unique_id: string | null;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_reference: string | null;
  notes: string | null;
  receipt_image: string | null;
  receipt_image_public_id: string | null;
  created_by: string;
  facilitated_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Vendor?: {
    unique_id: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone_number: string | null;
    total_spend: number;
  };
  PurchaseOrder?: {
    unique_id: string;
    reference: string;
    po_type: string;
    total_amount: number;
    amount_paid: number;
    payment_status: string;
    delivery_status: string;
  };
  Creator?: {
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
  Facilitator?: {
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
}

export interface VendorPaymentsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: VendorPayment[];
    pages: number;
  } | VendorPayment[] | null;
}

export interface VendorPaymentResponse {
  success: boolean;
  message: string;
  data: VendorPayment | null;
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

export interface AddVendorPaymentPayload {
  vendor_unique_id: string;
  purchase_order_unique_id?: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_reference?: string;
  notes?: string;
  facilitated_by?: string;
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

export const vendorPaymentsService = {
  getVendorPayments: async (params: PaginationParams): Promise<VendorPaymentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/vendor/payments?${query}`);
    return response.data;
  },

  getVendorPayment: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<VendorPaymentResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/vendor/payment?${query}`);
    return response.data;
  },

  searchVendorPayments: async (params: SearchParams): Promise<VendorPaymentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/vendor/payments?${query}`);
    return response.data;
  },

  filterVendorPayments: async (params: FilterParams): Promise<VendorPaymentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/vendor/payments?${query}`);
    return response.data;
  },

  addVendorPayment: async (
    data: AddVendorPaymentPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/vendor/payment/add?${query}`, data);
    return response.data;
  },

  updateReceiptReference: async (
    unique_id: string,
    receipt_reference: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vendor/payment/edit/receipt_reference?${query}`, { unique_id, receipt_reference });
    return response.data;
  },

  updateNotes: async (
    unique_id: string,
    notes: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vendor/payment/edit/notes?${query}`, { unique_id, notes });
    return response.data;
  },

  updateReceiptImage: async (
    unique_id: string,
    data: { receipt_image: string; receipt_image_public_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vendor/payment/edit/receipt_image?${query}`, { unique_id, ...data });
    return response.data;
  },

  deleteVendorPayment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.delete(`/user/vendor/payment?${query}`);
    return response.data;
  },
};

export default vendorPaymentsService;
