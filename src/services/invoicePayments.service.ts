import api from './api';

export interface InvoicePayment {
  unique_id: string;
  invoice_unique_id: string;
  customer_unique_id: string;
  payment_date: string;
  payment_method: string;
  amount_paid: number;
  receipt_reference: string | null;
  notes: string | null;
  receipt_image: string | null;
  receipt_image_public_id: string | null;
  received_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Invoice?: {
    unique_id: string;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    invoice_status: string;
    SalesOrder?: {
      unique_id: string;
      reference: string;
    };
  };
  Customer?: {
    unique_id: string;
    name: string;
    reference: string;
    phone_number: string | null;
  };
  User?: {
    unique_id: string;
    firstname: string;
    lastname: string;
  };
}

export interface InvoicePaymentsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: InvoicePayment[];
    pages: number;
  } | InvoicePayment[] | null;
}

export interface InvoicePaymentResponse {
  success: boolean;
  message: string;
  data: InvoicePayment | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
}

interface GetByInvoiceParams extends PaginationParams {
  invoice_unique_id: string;
}

interface AddInvoicePaymentPayload {
  invoice_unique_id: string;
  payment_date: string;
  payment_method: string;
  amount_paid: number;
  receipt_reference?: string;
  notes?: string;
  receipt_image?: string;
  receipt_image_public_id?: string;
  received_by?: string;
}

export const invoicePaymentsService = {
  getInvoicePayments: async (params: PaginationParams): Promise<InvoicePaymentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoice/payments?${queryParams.toString()}`);
    return response.data;
  },

  getPaymentsByInvoice: async (params: GetByInvoiceParams): Promise<InvoicePaymentsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('invoice_unique_id', params.invoice_unique_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoice/payments/specifically?${queryParams.toString()}`);
    return response.data;
  },

  getInvoicePayment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<InvoicePaymentResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/invoice/payment?${queryParams.toString()}`);
    return response.data;
  },

  addInvoicePayment: async (
    data: AddInvoicePaymentPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<InvoicePaymentResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('invoice_unique_id', data.invoice_unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/invoice/payment/add?${queryParams.toString()}`, data);
    return response.data;
  },

  deleteInvoicePayment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/invoice/payment?${queryParams.toString()}`);
    return response.data;
  },
};

export default invoicePaymentsService;
