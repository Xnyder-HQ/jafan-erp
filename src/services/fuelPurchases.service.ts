import api from './api';

export interface FuelPurchase {
  unique_id: string;
  vendor_unique_id: string;
  raw_material_unique_id: string | null;
  reference: string;
  fuel_type: string;
  liters_purchased: number;
  price_per_liter: number;
  total_cost: number;
  purchase_date: string;
  notes: string | null;
  receipt_image: string | null;
  receipt_image_public_id: string | null;
  payment_status: string;
  delivery_status: string;
  created_by: string;
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

export interface FuelPurchasesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: FuelPurchase[];
    pages: number;
  } | FuelPurchase[] | null;
}

export interface FuelPurchaseResponse {
  success: boolean;
  message: string;
  data: FuelPurchase | null;
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

export interface AddFuelPurchasePayload {
  vendor_unique_id: string;
  fuel_type: string;
  liters_purchased: number;
  purchase_date: string;
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

export const fuelPurchasesService = {
  getFuelPurchases: async (params: PaginationParams): Promise<FuelPurchasesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/fuel/purchases?${query}`);
    return response.data;
  },

  getFuelPurchase: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<FuelPurchaseResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/fuel/purchase?${query}`);
    return response.data;
  },

  searchFuelPurchases: async (params: SearchParams): Promise<FuelPurchasesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/fuel/purchases?${query}`);
    return response.data;
  },

  filterFuelPurchases: async (params: FilterParams): Promise<FuelPurchasesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/fuel/purchases?${query}`);
    return response.data;
  },

  addFuelPurchase: async (
    data: AddFuelPurchasePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string; reference: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/fuel/purchase/add?${query}`, data);
    return response.data;
  },

  updateFuelType: async (
    unique_id: string,
    fuel_type: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/fuel_type?${query}`, { unique_id, fuel_type });
    return response.data;
  },

  updatePurchaseDate: async (
    unique_id: string,
    purchase_date: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/purchase_date?${query}`, { unique_id, purchase_date });
    return response.data;
  },

  updateLiters: async (
    unique_id: string,
    liters_purchased: number,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/liters?${query}`, { unique_id, liters_purchased });
    return response.data;
  },

  updateNotes: async (
    unique_id: string,
    notes: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/notes?${query}`, { unique_id, notes });
    return response.data;
  },

  updateRawMaterial: async (
    unique_id: string,
    raw_material_unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/raw_material?${query}`, { unique_id, raw_material_unique_id });
    return response.data;
  },

  updateDeliveryStatus: async (
    unique_id: string,
    delivery_status: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/delivery_status?${query}`, { unique_id, delivery_status });
    return response.data;
  },

  updateReceiptImage: async (
    unique_id: string,
    data: { receipt_image: string; receipt_image_public_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/fuel/purchase/edit/receipt_image?${query}`, { unique_id, ...data });
    return response.data;
  },

  payFuelPurchase: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/pay/fuel/purchase?${query}`, { unique_id });
    return response.data;
  },

  deleteFuelPurchase: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.delete(`/user/fuel/purchase?${query}`);
    return response.data;
  },
};

export default fuelPurchasesService;
