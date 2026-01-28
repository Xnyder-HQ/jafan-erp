import api from './api';

export interface RawMaterial {
  unique_id: string;
  reference: string;
  name: string;
  type: string | null;
  description: string | null;
  unit_of_measure: string | null;
  current_quantity: number;
  reorder_level: number | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: {
    unique_id: string;
    firstname: string;
    middlename: string;
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

export interface RawMaterialsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: RawMaterial[];
    pages: number;
  } | null;
}

export interface RawMaterialResponse {
  success: boolean;
  message: string;
  data: RawMaterial | null;
}

export interface AddRawMaterialPayload {
  name: string;
  type?: string;
  description?: string;
  unit_of_measure?: string;
  current_quantity: number;
  reorder_level?: number;
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

export const rawMaterialsService = {
  getRawMaterials: async (params: PaginationParams): Promise<RawMaterialsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/raw/materials?${queryParams.toString()}`);
    return response.data;
  },

  getRawMaterial: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<RawMaterialResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/raw/material?${queryParams.toString()}`);
    return response.data;
  },

  searchRawMaterials: async (params: SearchParams): Promise<RawMaterialsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/raw/materials?${queryParams.toString()}`);
    return response.data;
  },

  filterRawMaterials: async (params: FilterParams): Promise<RawMaterialsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/raw/materials?${queryParams.toString()}`);
    return response.data;
  },

  addRawMaterial: async (payload: AddRawMaterialPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/raw/material/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateRawMaterialDetails: async (
    unique_id: string,
    payload: { name: string; type?: string; unit_of_measure?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/raw/material/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateRawMaterialDescription: async (
    unique_id: string,
    payload: { description?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/raw/material/edit/description?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateRawMaterialReorderLevel: async (
    unique_id: string,
    payload: { reorder_level?: number },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/raw/material/edit/reorder_level?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  deleteRawMaterial: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/raw/material?${queryParams.toString()}`);
    return response.data;
  },
};

export default rawMaterialsService;
