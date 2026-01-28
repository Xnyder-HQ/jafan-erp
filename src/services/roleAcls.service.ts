import api from './api';

export interface RoleAcl {
  unique_id: string;
  role_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
  Role?: {
    unique_id: string;
    name: string;
    stripped: string;
  };
  Module?: {
    unique_id: string;
    name: string;
    stripped: string;
  };
  SubModule?: {
    unique_id: string;
    name: string;
    stripped: string;
  } | null;
}

export interface RoleAclsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: RoleAcl[];
    pages: number;
  } | RoleAcl[] | null;
}

export interface RoleAclResponse {
  success: boolean;
  message: string;
  data: RoleAcl | null;
}

export interface RoleOption {
  unique_id: string;
  name: string;
  stripped: string;
}

export interface ModuleOption {
  unique_id: string;
  name: string;
  stripped: string;
  SubModules?: {
    unique_id: string;
    name: string;
    stripped: string;
  }[];
}

export interface AddRoleAclPayload {
  role_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id?: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
}

export interface UpdateRoleAclPayload {
  unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
}

export interface BulkRoleAclItem {
  module_unique_id: string;
  sub_module_unique_id?: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
}

export interface AddMultipleRoleAclsPayload {
  role_unique_id: string;
  role_acls: BulkRoleAclItem[];
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
}

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

interface SpecificallyParams extends PaginationParams {
  role_unique_id?: string;
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

export const roleAclsService = {
  getRoleAcls: async (params: PaginationParams): Promise<RoleAclsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/role/acls?${query}`);
    return response.data;
  },

  getRoleAcl: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<RoleAclResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/role/acl?${query}`);
    return response.data;
  },

  getRoleAclsSpecifically: async (params: SpecificallyParams): Promise<RoleAclsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/role/acls/specifically?${query}`);
    return response.data;
  },

  filterRoleAcls: async (params: FilterParams): Promise<RoleAclsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/role/acls?${query}`);
    return response.data;
  },

  addRoleAcl: async (
    data: AddRoleAclPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<RoleAclResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/role/acl/add?${query}`, data);
    return response.data;
  },

  addMultipleRoleAcls: async (
    data: AddMultipleRoleAclsPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/role/acl/add/multiple?${query}`, data);
    return response.data;
  },

  updateRoleAcl: async (
    data: UpdateRoleAclPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/role/acl/edit/details?${query}`, data);
    return response.data;
  },

  deleteRoleAcl: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/role/acl?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },

  getRoles: async (): Promise<{ success: boolean; data: RoleOption[] | { rows: RoleOption[] } | null }> => {
    const response = await api.get('/roles');
    return response.data;
  },

  getModules: async (): Promise<{ success: boolean; data: ModuleOption[] | { rows: ModuleOption[] } | null }> => {
    const response = await api.get('/modules');
    return response.data;
  },
};

export default roleAclsService;
