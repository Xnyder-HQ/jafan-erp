import api from './api';

export interface Machine {
  unique_id: string;
  reference: string;
  name: string;
  code: string;
  type: string;
  description: string | null;
  supported_block_types: string[];
  expected_blocks_per_day: number | null;
  fuel_type: string;
  installed_date: string | null;
  is_active: boolean;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
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

export interface MachinesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Machine[];
    pages: number;
  } | null;
}

export interface MachineResponse {
  success: boolean;
  message: string;
  data: Machine | null;
}

export interface AddMachinePayload {
  name: string;
  code: string;
  type: string;
  description?: string;
  supported_block_types: string[];
  expected_blocks_per_day?: number;
  fuel_type: string;
  installed_date?: string;
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

const machinesService = {
  getMachines: async (params: PaginationParams): Promise<MachinesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/machines?${queryParams.toString()}`);
    return response.data;
  },

  getMachine: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<MachineResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/machine?${queryParams.toString()}`);
    return response.data;
  },

  searchMachines: async (params: SearchParams): Promise<MachinesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/machines?${queryParams.toString()}`);
    return response.data;
  },

  filterMachines: async (params: FilterParams): Promise<MachinesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/machines?${queryParams.toString()}`);
    return response.data;
  },

  addMachine: async (payload: AddMachinePayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/machine/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateMachineDetails: async (payload: { unique_id: string; name: string; code: string; type: string; fuel_type: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/machine/edit/details?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateMachineDescription: async (payload: { unique_id: string; description?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/machine/edit/description?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateMachineOtherDetails: async (payload: { unique_id: string; expected_blocks_per_day?: number; installed_date?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/machine/edit/other/details?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateMachineSupportedBlockTypes: async (payload: { unique_id: string; supported_block_types: string[] }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/machine/edit/supported_block_types?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateMachineToggles: async (payload: { unique_id: string; is_active: boolean }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/machine/toggles?${queryParams.toString()}`, payload);
    return response.data;
  },

  deleteMachine: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/machine?${queryParams.toString()}`, {
      data: { unique_id },
    });
    return response.data;
  },

  // Public endpoint for dropdowns
  getMachinesForDropdown: async (): Promise<MachinesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');

    const response = await api.get(`/machines?${queryParams.toString()}`);
    return response.data;
  },
};

export default machinesService;
