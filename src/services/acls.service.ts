import api from './api';

export interface Acl {
  unique_id: string;
  user_unique_id: string;
  role_unique_id: string | null;
  module_unique_id: string;
  sub_module_unique_id: string | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string | null;
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
    profile_image: string | null;
    Role?: {
      unique_id: string;
      name: string;
      stripped: string;
    };
  };
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

export interface AclsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Acl[];
    pages: number;
  } | Acl[] | null;
}

export interface AclResponse {
  success: boolean;
  message: string;
  data: Acl | null;
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

export interface UserOption {
  unique_id: string;
  firstname: string;
  middlename: string | null;
  lastname: string;
  email: string;
  Role?: {
    unique_id: string;
    name: string;
    stripped: string;
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

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

export interface AddAclPayload {
  user_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id?: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring?: string;
}

export interface UpdateAclPayload {
  unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring?: string;
}

export interface BulkAclItem {
  module_unique_id: string;
  sub_module_unique_id?: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring?: string;
}

export interface AddMultipleAclsPayload {
  user_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id?: string;
  acls: BulkAclItem[];
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

export const aclsService = {
  getAcls: async (params: PaginationParams): Promise<AclsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/acls?${query}`);
    return response.data;
  },

  getAcl: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<AclResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/acl?${query}`);
    return response.data;
  },

  filterAcls: async (params: FilterParams): Promise<AclsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/acls?${query}`);
    return response.data;
  },

  addAcl: async (
    data: AddAclPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<AclResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/acl/add?${query}`, data);
    return response.data;
  },

  updateAcl: async (
    data: UpdateAclPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/acl/edit/details?${query}`, data);
    return response.data;
  },

  deleteAcl: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/acl?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },

  addMultipleAcls: async (
    data: AddMultipleAclsPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/acl/add/multiple?${query}`, data);
    return response.data;
  },

  getModules: async (): Promise<{ success: boolean; data: ModuleOption[] | { rows: ModuleOption[] } | null }> => {
    const response = await api.get('/modules');
    return response.data;
  },

  getUsers: async (): Promise<{ success: boolean; data: UserOption[] | { rows: UserOption[] } | null }> => {
    const response = await api.get('/users');
    return response.data;
  },
};

export default aclsService;
