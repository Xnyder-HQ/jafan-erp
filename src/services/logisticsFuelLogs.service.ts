import api from './api';

export interface LogisticsFuelLog {
  unique_id: string;
  vehicle_unique_id: string;
  fuel_type: string;
  liters_dispensed: number;
  price_per_liter: number;
  benchmark_liters: number;
  expected_trips: number;
  actual_trips: number;
  dispense_date: string;
  notes: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
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
  User?: {
    unique_id: string;
    firstname: string;
    middlename: string | null;
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

export interface LogisticsFuelLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: LogisticsFuelLog[];
    pages: number;
  } | LogisticsFuelLog[] | null;
}

export interface LogisticsFuelLogResponse {
  success: boolean;
  message: string;
  data: LogisticsFuelLog | null;
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

export interface AddLogisticsFuelLogPayload {
  vehicle_unique_id: string;
  fuel_type?: string;
  liters_dispensed: number;
  actual_trips: number;
  dispense_date: string;
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

export const logisticsFuelLogsService = {
  getLogisticsFuelLogs: async (params: PaginationParams): Promise<LogisticsFuelLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/logistics/fuel/logs?${query}`);
    return response.data;
  },

  getLogisticsFuelLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<LogisticsFuelLogResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/logistics/fuel/log?${query}`);
    return response.data;
  },

  searchLogisticsFuelLogs: async (params: SearchParams): Promise<LogisticsFuelLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/logistics/fuel/logs?${query}`);
    return response.data;
  },

  filterLogisticsFuelLogs: async (params: FilterParams): Promise<LogisticsFuelLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/logistics/fuel/logs?${query}`);
    return response.data;
  },

  addLogisticsFuelLog: async (
    data: AddLogisticsFuelLogPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<LogisticsFuelLogResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/logistics/fuel/log/add?${query}`, data);
    return response.data;
  },
};

export default logisticsFuelLogsService;
