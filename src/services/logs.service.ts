import api from './api';

export interface Log {
  unique_id: string;
  user_unique_id: string | null;
  type: string;
  description: string | null;
  content: Record<string, any> | null;
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

export interface LogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Log[];
    pages: number;
  } | Log[] | null;
}

export interface LogResponse {
  success: boolean;
  message: string;
  data: Log | null;
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

interface SpecificallyParams extends PaginationParams {
  type?: string;
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

export const logsService = {
  getLogs: async (params: PaginationParams): Promise<LogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/logs?${query}`);
    return response.data;
  },

  getLog: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<LogResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/log?${query}`);
    return response.data;
  },

  searchLogs: async (params: SearchParams): Promise<LogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/search/logs?${query}`);
    return response.data;
  },

  filterLogs: async (params: FilterParams): Promise<LogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/filter/logs?${query}`);
    return response.data;
  },

  getLogsSpecifically: async (params: SpecificallyParams): Promise<LogsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/log/specifically?${query}`);
    return response.data;
  },

  deleteLog: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/log?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },
};

export default logsService;
