import api from './api';

export interface FinishedGood {
  unique_id: string;
  reference: string;
  name: string;
  type: string | null;
  description: string | null;
  unit_of_measure: string;
  current_quantity: number;
  unit_cost: number;
  selling_price: number;
  product_unique_id: string | null;
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
  Product?: {
    unique_id: string;
    name: string;
    Category?: {
      unique_id: string;
      name: string;
    };
  };
}

export interface FinishedGoodsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: FinishedGood[];
    pages: number;
  } | null;
}

export interface FinishedGoodResponse {
  success: boolean;
  message: string;
  data: FinishedGood | null;
}

export interface AddFinishedGoodPayload {
  name: string;
  type?: string;
  description?: string;
  unit_of_measure: string;
  current_quantity: number;
  unit_cost: number;
  selling_price: number;
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

export const finishedGoodsService = {
  getFinishedGoods: async (params: PaginationParams): Promise<FinishedGoodsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/finished/goods?${queryParams.toString()}`);
    return response.data;
  },

  getFinishedGood: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<FinishedGoodResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/finished/good?${queryParams.toString()}`);
    return response.data;
  },

  searchFinishedGoods: async (params: SearchParams): Promise<FinishedGoodsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/finished/goods?${queryParams.toString()}`);
    return response.data;
  },

  filterFinishedGoods: async (params: FilterParams): Promise<FinishedGoodsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/finished/goods?${queryParams.toString()}`);
    return response.data;
  },

  addFinishedGood: async (payload: AddFinishedGoodPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/finished/good/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateFinishedGoodDetails: async (
    unique_id: string,
    payload: { name: string; type?: string; unit_of_measure?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/finished/good/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateFinishedGoodDescription: async (
    unique_id: string,
    payload: { description?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/finished/good/edit/description?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateFinishedGoodCost: async (
    unique_id: string,
    payload: { unit_cost: number; selling_price: number },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/finished/good/edit/cost?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  deleteFinishedGood: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/finished/good?${queryParams.toString()}`);
    return response.data;
  },

  updateFinishedGoodProduct: async (
    unique_id: string,
    payload: { product_unique_id: string | null },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/finished/good/edit/product?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  // Public endpoint for dropdowns
  getFinishedGoodsForDropdown: async (): Promise<FinishedGoodsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');

    const response = await api.get(`/finished/goods?${queryParams.toString()}`);
    return response.data;
  },
};

export default finishedGoodsService;
