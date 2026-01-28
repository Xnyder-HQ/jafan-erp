import api from './api';

export interface FinishedGoodStockLog {
  unique_id: string;
  finished_good_unique_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  quantity_after: number;
  source_module: string;
  reference: string | null;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  FinishedGood?: {
    unique_id: string;
    reference: string;
    name: string;
    type: string | null;
    unit_of_measure: string;
    current_quantity: number;
    unit_cost: number;
    selling_price: number;
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

export interface FinishedGoodStockLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: FinishedGoodStockLog[];
    pages: number;
  } | null;
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

const finishedGoodStockLogsService = {
  getStockLogs: async (params: PaginationParams): Promise<FinishedGoodStockLogsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/finished/good/stock/logs?${queryParams.toString()}`);
    return response.data;
  },

  searchStockLogs: async (params: SearchParams): Promise<FinishedGoodStockLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/finished/good/stock/logs?${queryParams.toString()}`);
    return response.data;
  },

  filterStockLogs: async (params: FilterParams): Promise<FinishedGoodStockLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/finished/good/stock/logs?${queryParams.toString()}`);
    return response.data;
  },
};

export default finishedGoodStockLogsService;
