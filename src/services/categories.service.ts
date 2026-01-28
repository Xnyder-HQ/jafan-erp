import api from './api';

export interface Category {
  unique_id: string;
  name: string;
  stripped: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Category[];
    pages: number;
  } | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  module_unique_id: string;
  sub_module_unique_id?: string;
}

export const categoriesService = {
  getCategories: async (params: PaginationParams): Promise<CategoriesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/categories?${queryParams.toString()}`);
    return response.data;
  },

  addCategory: async (payload: { name: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/category/add?${queryParams.toString()}`, payload);
    return response.data;
  },
};

export default categoriesService;
