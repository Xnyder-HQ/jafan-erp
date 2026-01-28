import api from './api';

export interface Approval {
  unique_id: string;
  user_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string | null;
  approval_status: string;
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

export interface ApprovalsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Approval[];
    pages: number;
  } | Approval[] | null;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data: Approval | null;
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

export interface AddApprovalPayload {
  module_unique_id: string;
  sub_module_unique_id?: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring?: string;
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
  approval_status?: string;
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

export const approvalsService = {
  getApprovals: async (params: PaginationParams): Promise<ApprovalsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/all/approvals?${query}`);
    return response.data;
  },

  getApproval: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<ApprovalResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/all/approval?${query}`);
    return response.data;
  },

  getApprovalsSpecifically: async (params: SpecificallyParams): Promise<ApprovalsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/all/approvals/specifically?${query}`);
    return response.data;
  },

  filterApprovals: async (params: FilterParams): Promise<ApprovalsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/all/filter/approvals?${query}`);
    return response.data;
  },

  addApproval: async (
    data: AddApprovalPayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<ApprovalResponse> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/approval/add?${query}`, data);
    return response.data;
  },

  acceptApproval: async (
    data: { unique_id: string; acl_expiring?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/approval/accept?${query}`, data);
    return response.data;
  },

  denyApproval: async (
    data: { unique_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/approval/deny?${query}`, data);
    return response.data;
  },

  deleteApproval: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/approval?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },

  getModules: async (): Promise<{ success: boolean; data: ModuleOption[] | { rows: ModuleOption[] } | null }> => {
    const response = await api.get('/modules');
    return response.data;
  },
};

export default approvalsService;
