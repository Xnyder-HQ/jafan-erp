import api from './api';

export interface Product {
  unique_id: string;
  category_unique_id: string;
  reference: string;
  name: string;
  type: string | null;
  description: string | null;
  unit_of_measure: string | null;
  quantity: number;
  total_quantity: number;
  price: number;
  cost_price: number;
  is_outside_town_eligible: boolean;
  is_inventory_tracked: boolean;
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
  Category?: {
    unique_id: string;
    name: string;
    stripped: string;
  };
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Product[];
    pages: number;
  } | null;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product | null;
}

export interface AddProductPayload {
  category_unique_id: string;
  name: string;
  type?: string;
  description?: string;
  unit_of_measure?: string;
  quantity: number;
  total_quantity?: number;
  price: number;
  cost_price?: number;
  is_outside_town_eligible: boolean;
  is_inventory_tracked: boolean;
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

export const productsService = {
  getProducts: async (params: PaginationParams): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/products?${queryParams.toString()}`);
    return response.data;
  },

  getProduct: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ProductResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/product?${queryParams.toString()}`);
    return response.data;
  },

  searchProducts: async (params: SearchParams): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/products?${queryParams.toString()}`);
    return response.data;
  },

  filterProducts: async (params: FilterParams): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/products?${queryParams.toString()}`);
    return response.data;
  },

  addProduct: async (payload: AddProductPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/product/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateProductCategory: async (unique_id: string, payload: { category_unique_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/edit/category?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateProductDetails: async (unique_id: string, payload: { name: string; type?: string; unit_of_measure?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateProductDescription: async (unique_id: string, payload: { description?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/edit/description?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateProductPrice: async (unique_id: string, payload: { price: number; cost_price?: number }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/edit/price?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateProductQuantity: async (unique_id: string, payload: { quantity: number; total_quantity: number }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/edit/quantity?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateProductToggles: async (unique_id: string, payload: { is_outside_town_eligible: boolean; is_inventory_tracked: boolean }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/product/toggles?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  deleteProduct: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/product?${queryParams.toString()}`);
    return response.data;
  },
};

export default productsService;
