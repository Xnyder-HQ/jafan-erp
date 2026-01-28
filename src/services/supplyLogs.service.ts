import api from './api';

export interface SupplyLogEntry {
  unique_id: string;
  delivery_assignment_unique_id: string;
  sales_order_unique_id: string;
  sales_order_item_unique_id: string;
  customer_unique_id: string;
  product_unique_id: string;
  vehicle_unique_id: string;
  site_address: string;
  delivery_date: string;
  blocks_loaded: number;
  blocks_dropped: number;
  blocks_returned: number;
  breakage_quantity: number;
  notes: string | null;
  created_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Customer?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string;
    email: string | null;
    phone_number: string | null;
    balance: number;
    profile_image: string | null;
  };
  Product?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string;
    unit_of_measure: string;
    quantity: number;
    price: number;
    Category?: {
      unique_id: string;
      name: string;
    };
  };
  Vehicle?: {
    unique_id: string;
    reference: string;
    code: string;
    plate_number: string;
    type: string;
    capacity_unit: string;
    capacity_value: number;
    fuel_type: string;
    benchmark_fuel_liters: number;
    expected_trips_per_benchmark: number;
    purchase_date: string | null;
    availability_status: string;
    is_active: boolean;
  };
  DeliveryAssignment?: {
    unique_id: string;
    assignment_status: string;
    scheduled_date: string;
    auto_assigned: boolean;
    started_at: string | null;
    completed_at: string | null;
  };
  SalesOrder?: {
    unique_id: string;
    reference: string;
    total_amount: number;
    amount_payable: number;
    total_items_ordered: number;
    total_items_dropped: number;
    order_status: string;
  };
  SalesOrderItem?: {
    unique_id: string;
    product_name: string;
    unit_price: number;
    quantity_ordered: number;
    quantity_supplied: number;
    total_price: number;
  };
  User?: {
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
}

export interface SupplyLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: SupplyLogEntry[];
    pages: number;
  } | SupplyLogEntry[] | null;
}

export interface SupplyLogResponse {
  success: boolean;
  message: string;
  data: SupplyLogEntry | null;
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

export interface AddSupplyLogPayload {
  delivery_assignment_unique_id: string;
  sales_order_item_unique_id: string;
  site_address: string;
  delivery_date: string;
  blocks_loaded: number;
  blocks_dropped: number;
  blocks_returned: number;
  breakage_quantity: number;
  notes?: string;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

export const supplyLogsService = {
  getSupplyLogs: async (params: PaginationParams): Promise<SupplyLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/supply/logs?${query}`);
    return response.data;
  },

  getSupplyLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<SupplyLogResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/supply/log?${query}`);
    return response.data;
  },

  searchSupplyLogs: async (params: SearchParams): Promise<SupplyLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/supply/logs?${query}`);
    return response.data;
  },

  filterSupplyLogs: async (params: FilterParams): Promise<SupplyLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/supply/logs?${query}`);
    return response.data;
  },

  addSupplyLog: async (
    data: AddSupplyLogPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<SupplyLogResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/supply/log/add?${query}`, data);
    return response.data;
  },
};

export default supplyLogsService;
