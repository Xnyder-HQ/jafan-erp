import api from './api';

export interface User {
  unique_id: string;
  firstname: string;
  middlename: string | null;
  lastname: string;
  username: string | null;
  email: string;
  phone_number: string | null;
  profile_image: string | null;
  Role?: {
    unique_id: string;
    name: string;
    stripped: string;
  };
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: User[];
    pages: number;
  } | User[] | null;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User | null;
}

export interface RoleOption {
  unique_id: string;
  name: string;
  stripped: string;
}

export interface AddUserPayload {
  firstname: string;
  middlename?: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone_number?: string;
  alt_phone_number?: string;
  gender: string;
  date_of_birth?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  profile_image?: string;
  role_unique_id?: string;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
}

interface SearchParams extends PaginationParams {
  search: string;
}

interface ModuleParams {
  module_unique_id: string;
  sub_module_unique_id?: string;
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

export const usersService = {
  getUsers: async (params: PaginationParams): Promise<UsersResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/users?${query}`);
    return response.data;
  },

  getUser: async (unique_id: string): Promise<UserResponse> => {
    const query = buildQueryParams({ unique_id });
    const response = await api.get(`/user?${query}`);
    return response.data;
  },

  searchUsers: async (params: SearchParams): Promise<UsersResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/search/users?${query}`);
    return response.data;
  },

  addUser: async (
    data: AddUserPayload,
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/add?${query}`, data);
    return response.data;
  },

  grantAccess: async (
    data: { unique_id: string },
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/access/grant?${query}`, data);
    return response.data;
  },

  suspendAccess: async (
    data: { unique_id: string },
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/access/suspend?${query}`, data);
    return response.data;
  },

  revokeAccess: async (
    data: { unique_id: string },
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/access/revoke?${query}`, data);
    return response.data;
  },

  updateUserRole: async (
    data: { unique_id: string; role_unique_id: string },
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/update/role?${query}`, data);
    return response.data;
  },

  deleteUser: async (
    unique_id: string,
    params: ModuleParams
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },

  getRoles: async (): Promise<{ success: boolean; data: RoleOption[] | { rows: RoleOption[] } | null }> => {
    const response = await api.get('/roles');
    return response.data;
  },
};

export default usersService;
