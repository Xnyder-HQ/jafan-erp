import api from './api';

export interface ProductionTeam {
  unique_id: string;
  machine_unique_id: string | null;
  name: string;
  is_active: boolean;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Machine?: {
    unique_id: string;
    name: string;
    code: string;
    type: string;
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

export interface ProductionTeamsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: ProductionTeam[];
    pages: number;
  } | null;
}

export interface ProductionTeamResponse {
  success: boolean;
  message: string;
  data: ProductionTeam | null;
}

export interface AddProductionTeamPayload {
  name: string;
  is_active: boolean;
  machine_unique_id?: string;
}

export interface MachineOption {
  unique_id: string;
  name: string;
  code: string;
  type: string;
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

const productionTeamsService = {
  getProductionTeams: async (params: PaginationParams): Promise<ProductionTeamsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/teams?${queryParams.toString()}`);
    return response.data;
  },

  getProductionTeam: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ProductionTeamResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/production/team?${queryParams.toString()}`);
    return response.data;
  },

  searchProductionTeams: async (params: SearchParams): Promise<ProductionTeamsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/production/teams?${queryParams.toString()}`);
    return response.data;
  },

  filterProductionTeams: async (params: FilterParams): Promise<ProductionTeamsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/production/teams?${queryParams.toString()}`);
    return response.data;
  },

  addProductionTeam: async (payload: AddProductionTeamPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/production/team/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateProductionTeamDetails: async (payload: { unique_id: string; name: string; is_active: boolean }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/production/team/edit/details?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateProductionTeamMachine: async (payload: { unique_id: string; machine_unique_id?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/production/team/edit/category?${queryParams.toString()}`, payload);
    return response.data;
  },

  deleteProductionTeam: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/production/team?${queryParams.toString()}`, {
      data: { unique_id },
    });
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

export default productionTeamsService;
