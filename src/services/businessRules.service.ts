import api from './api';

export interface BusinessRule {
  unique_id: string;
  rule_key: string;
  rule_value: number;
  value_type: string;
  applies_to: string;
  notes: string | null;
  is_active: boolean;
  updated_by: string | null;
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
}

export interface BusinessRulesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: BusinessRule[];
    pages: number;
  } | null;
}

export interface BusinessRuleResponse {
  success: boolean;
  message: string;
  data: BusinessRule | null;
}

export interface AddBusinessRulePayload {
  rule_key: string;
  rule_value: number;
  value_type: string;
  applies_to: string;
  notes?: string;
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

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

const businessRulesService = {
  getBusinessRules: async (params: PaginationParams): Promise<BusinessRulesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/business/rules?${query}`);
    return response.data;
  },

  getBusinessRule: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<BusinessRuleResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/business/rule?${query}`);
    return response.data;
  },

  searchBusinessRules: async (params: SearchParams): Promise<BusinessRulesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/business/rules?${query}`);
    return response.data;
  },

  filterBusinessRules: async (params: FilterParams): Promise<BusinessRulesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/business/rules?${query}`);
    return response.data;
  },

  addBusinessRule: async (
    data: AddBusinessRulePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/business/rule/add?${query}`, data);
    return response.data;
  },

  updateBusinessRuleDetails: async (
    data: { unique_id: string; rule_key: string; rule_value: number; value_type: string; applies_to: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/business/rule/edit/details?${query}`, data);
    return response.data;
  },

  updateBusinessRuleNotes: async (
    data: { unique_id: string; notes?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/business/rule/edit/notes?${query}`, data);
    return response.data;
  },

  toggleBusinessRule: async (
    data: { unique_id: string; is_active: boolean },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/business/rule/toggles?${query}`, data);
    return response.data;
  },

  deleteBusinessRule: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/business/rule?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },
};

export default businessRulesService;
