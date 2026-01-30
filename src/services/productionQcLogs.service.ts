import api from './api';

export interface ProductionQcLog {
  unique_id: string;
  machine_unique_id: string;
  production_batch_unique_id: string;
  production_team_unique_id: string;
  finished_good_unique_id: string;
  defective_quantity: number;
  qc_date: string;
  notes: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Machine?: {
    unique_id: string;
    name: string;
    code: string;
    type: string;
    expected_blocks_per_day: number | null;
    fuel_type: string;
    installed_date: string | null;
    is_active: boolean;
  };
  ProductionBatch?: {
    unique_id: string;
    quantity_produced: number;
    production_date: string;
    shift: string;
  };
  ProductionTeam?: {
    unique_id: string;
    name: string;
    is_active: boolean;
  };
  FinishedGood?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string;
    unit_of_measure: string;
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

export interface ProductionQcLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: ProductionQcLog[];
    pages: number;
  } | null;
}

export interface ProductionQcLogResponse {
  success: boolean;
  message: string;
  data: ProductionQcLog | null;
}

export interface AddQcLogPayload {
  production_batch_unique_id: string;
  defective_quantity: number;
  qc_date: string;
  notes?: string;
}

export interface ProductionBatchOption {
  unique_id: string;
  quantity_produced: number;
  production_date: string;
  shift: string;
  Machine?: {
    unique_id: string;
    name: string;
    code: string;
  };
  ProductionTeam?: {
    unique_id: string;
    name: string;
  };
  FinishedGood?: {
    unique_id: string;
    name: string;
    type: string;
  };
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

const productionQcLogsService = {
  getQcLogs: async (params: PaginationParams): Promise<ProductionQcLogsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/qc/logs?${queryParams.toString()}`);
    return response.data;
  },

  getQcLog: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ProductionQcLogResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/qc/log?${queryParams.toString()}`);
    return response.data;
  },

  searchQcLogs: async (params: SearchParams): Promise<ProductionQcLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/production/qc/logs?${queryParams.toString()}`);
    return response.data;
  },

  filterQcLogs: async (params: FilterParams): Promise<ProductionQcLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/production/qc/logs?${queryParams.toString()}`);
    return response.data;
  },

  addQcLog: async (payload: AddQcLogPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/production/qc/log/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  getProductionBatches: async (): Promise<{ success: boolean; data: { rows: ProductionBatchOption[] } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');

    const response = await api.get(`/production/batches?${queryParams.toString()}`);
    return response.data;
  },
};

export default productionQcLogsService;
