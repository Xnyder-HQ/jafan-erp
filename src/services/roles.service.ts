import api from './api';

export interface Role {
  unique_id: string;
  name: string;
  stripped: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Role[];
    pages: number;
  } | Role[] | null;
}

export interface RoleResponse {
  success: boolean;
  message: string;
  data: Role | null;
}

export interface AddRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  unique_id: string;
  name: string;
  description?: string;
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
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

export const rolesService = {
  getRoles: async (params: PaginationParams): Promise<RolesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/roles?${query}`);
    return response.data;
  },

  getRole: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<RoleResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/role?${query}`);
    return response.data;
  },

  searchRoles: async (params: SearchParams): Promise<RolesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/roles?${query}`);
    return response.data;
  },

  filterRoles: async (params: FilterParams): Promise<RolesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/roles?${query}`);
    return response.data;
  },

  addRole: async (
    data: AddRolePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<RoleResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/role/add?${query}`, data);
    return response.data;
  },

  updateRole: async (
    data: UpdateRolePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/role/edit/details?${query}`, data);
    return response.data;
  },

  deleteRole: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/role?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },
};

export default rolesService;
