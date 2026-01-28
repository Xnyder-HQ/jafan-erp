import api from './api';

export interface ProductionFuelLog {
  unique_id: string;
  machine_unique_id: string | null;
  fuel_type: string;
  liters_dispensed: number;
  destination: string;
  dispensed_date: string;
  notes: string | null;
  dispensed_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Machine?: {
    unique_id: string;
    name: string;
    code: string;
    type: string;
    fuel_type: string;
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

export interface ProductionFuelLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: ProductionFuelLog[];
    pages: number;
  } | null;
}

export interface ProductionFuelLogResponse {
  success: boolean;
  message: string;
  data: ProductionFuelLog | null;
}

export interface AddFuelLogPayload {
  fuel_type: string;
  liters_dispensed: number;
  destination: string;
  dispensed_date: string;
  notes?: string;
  machine_unique_id?: string;
}

export interface MachineOption {
  unique_id: string;
  name: string;
  code: string;
  type: string;
  fuel_type: string;
  is_active: boolean;
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

const productionFuelLogsService = {
  getFuelLogs: async (params: PaginationParams): Promise<ProductionFuelLogsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/fuel/logs?${queryParams.toString()}`);
    return response.data;
  },

  getFuelLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ProductionFuelLogResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/fuel/log?${queryParams.toString()}`);
    return response.data;
  },

  searchFuelLogs: async (params: SearchParams): Promise<ProductionFuelLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/production/fuel/logs?${queryParams.toString()}`);
    return response.data;
  },

  filterFuelLogs: async (params: FilterParams): Promise<ProductionFuelLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/production/fuel/logs?${queryParams.toString()}`);
    return response.data;
  },

  addFuelLog: async (payload: AddFuelLogPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/production/fuel/log/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  getMachines: async (params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; data: { rows: MachineOption[] } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/machines?${queryParams.toString()}`);
    return response.data;
  },
};

export default productionFuelLogsService;
