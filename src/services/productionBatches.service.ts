import api from './api';

export interface ProductionBatch {
  unique_id: string;
  machine_unique_id: string;
  production_team_unique_id: string;
  finished_good_unique_id: string;
  quantity_produced: number;
  production_date: string;
  shift: string | null;
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
    expected_blocks_per_day: number;
    fuel_type: string;
    installed_date: string;
    is_active: boolean;
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
    type: string | null;
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

export interface ProductionBatchesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: ProductionBatch[];
    pages: number;
  } | null;
}

export interface ProductionBatchResponse {
  success: boolean;
  message: string;
  data: ProductionBatch | null;
}

export interface AddProductionBatchPayload {
  machine_unique_id: string;
  production_team_unique_id: string;
  finished_good_unique_id: string;
  quantity_produced: number;
  production_date: string;
  shift?: string;
  notes?: string;
}

export interface MachineOption {
  unique_id: string;
  name: string;
  code: string;
  type: string;
  is_active: boolean;
}

export interface ProductionTeamOption {
  unique_id: string;
  name: string;
  is_active: boolean;
}

export interface FinishedGoodOption {
  unique_id: string;
  name: string;
  reference: string;
  type: string | null;
  unit_of_measure: string;
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

const productionBatchesService = {
  getProductionBatches: async (params: PaginationParams): Promise<ProductionBatchesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/batches?${queryParams.toString()}`);
    return response.data;
  },

  getProductionBatch: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ProductionBatchResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/batch?${queryParams.toString()}`);
    return response.data;
  },

  searchProductionBatches: async (params: SearchParams): Promise<ProductionBatchesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/production/batches?${queryParams.toString()}`);
    return response.data;
  },

  filterProductionBatches: async (params: FilterParams): Promise<ProductionBatchesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/production/batches?${queryParams.toString()}`);
    return response.data;
  },

  addProductionBatch: async (payload: AddProductionBatchPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/production/batch/add?${queryParams.toString()}`, payload);
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

  getProductionTeams: async (params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; data: { rows: ProductionTeamOption[] } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/teams?${queryParams.toString()}`);
    return response.data;
  },

  getFinishedGoods: async (params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; data: { rows: FinishedGoodOption[] } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/finished/goods?${queryParams.toString()}`);
    return response.data;
  },
};

export default productionBatchesService;
