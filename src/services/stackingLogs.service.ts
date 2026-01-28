import api from './api';

export interface StackingLog {
  unique_id: string;
  finished_good_unique_id: string;
  blocks_stacked: number;
  stacking_rate: number;
  breakage_quantity: number;
  total_cost: number;
  stack_date: string;
  notes: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  FinishedGood?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string | null;
    unit_of_measure: string | null;
    current_quantity: number;
    unit_cost: number;
    selling_price: number;
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

export interface StackingLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: StackingLog[];
    pages: number;
  } | null;
}

export interface StackingLogResponse {
  success: boolean;
  message: string;
  data: StackingLog | null;
}

export interface AddStackingLogPayload {
  finished_good_unique_id: string;
  blocks_stacked: number;
  stacking_rate: number;
  breakage_quantity: number;
  stack_date: string;
  notes?: string;
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

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

const stackingLogsService = {
  getStackingLogs: async (params: PaginationParams): Promise<StackingLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/stacking/logs?${query}`);
    return response.data;
  },

  getStackingLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<StackingLogResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/stacking/log?${query}`);
    return response.data;
  },

  searchStackingLogs: async (params: SearchParams): Promise<StackingLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/stacking/logs?${query}`);
    return response.data;
  },

  filterStackingLogs: async (params: FilterParams): Promise<StackingLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/stacking/logs?${query}`);
    return response.data;
  },

  addStackingLog: async (
    data: AddStackingLogPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/stacking/log/add?${query}`, data);
    return response.data;
  },
};

export default stackingLogsService;
