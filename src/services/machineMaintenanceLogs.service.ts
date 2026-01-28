import api from './api';

export interface MachineMaintenanceLog {
  unique_id: string;
  machine_unique_id: string;
  vendor_unique_id: string | null;
  service_date: string;
  cost: number;
  next_service_date: string | null;
  notes: string;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Machine?: {
    unique_id: string;
    reference: string;
    name: string;
    code: string;
    type: string;
    fuel_type: string;
    is_active: boolean;
  };
  Vendor?: {
    unique_id: string;
    reference: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone_number: string | null;
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

export interface MachineMaintenanceLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: MachineMaintenanceLog[];
    pages: number;
  } | null;
}

export interface MachineMaintenanceLogResponse {
  success: boolean;
  message: string;
  data: MachineMaintenanceLog | null;
}

export interface AddMaintenanceLogPayload {
  machine_unique_id: string;
  vendor_unique_id?: string;
  service_date: string;
  cost: number;
  next_service_date?: string;
  notes: string;
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

const machineMaintenanceLogsService = {
  getMaintenanceLogs: async (params: PaginationParams): Promise<MachineMaintenanceLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/machine/maintenance/logs?${query}`);
    return response.data;
  },

  getMaintenanceLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<MachineMaintenanceLogResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/machine/maintenance/log?${query}`);
    return response.data;
  },

  searchMaintenanceLogs: async (params: SearchParams): Promise<MachineMaintenanceLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/machine/maintenance/logs?${query}`);
    return response.data;
  },

  filterMaintenanceLogs: async (params: FilterParams): Promise<MachineMaintenanceLogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/machine/maintenance/logs?${query}`);
    return response.data;
  },

  addMaintenanceLog: async (
    data: AddMaintenanceLogPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/machine/maintenance/log/add?${query}`, data);
    return response.data;
  },
};

export default machineMaintenanceLogsService;
