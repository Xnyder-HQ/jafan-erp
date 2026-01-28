import api from './api';

export interface Vendor {
  unique_id: string;
  reference: string;
  type: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone_number: string | null;
  alt_phone_number: string | null;
  address: string | null;
  total_spend: number;
  profile_image: string | null;
  profile_image_public_id: string | null;
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
}

export interface VendorsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Vendor[];
    pages: number;
  } | null;
}

export interface VendorResponse {
  success: boolean;
  message: string;
  data: Vendor | null;
}

export interface AddVendorPayload {
  type: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  alt_phone_number?: string;
  address?: string;
  total_spend?: number;
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

export const vendorsService = {
  getVendors: async (params: PaginationParams): Promise<VendorsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/vendors?${queryParams.toString()}`);
    return response.data;
  },

  getVendor: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<VendorResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/vendor?${queryParams.toString()}`);
    return response.data;
  },

  searchVendors: async (params: SearchParams): Promise<VendorsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/search/vendors?${queryParams.toString()}`);
    return response.data;
  },

  filterVendors: async (params: FilterParams): Promise<VendorsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.get(`/user/filter/vendors?${queryParams.toString()}`);
    return response.data;
  },

  addVendor: async (payload: AddVendorPayload, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.post(`/user/vendor/add?${queryParams.toString()}`, payload);
    return response.data;
  },

  updateVendorDetails: async (unique_id: string, payload: { name: string; contact_person?: string; email?: string; phone_number?: string; alt_phone_number?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/vendor/edit/details?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  updateVendorAddress: async (unique_id: string, payload: { address?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.put(`/user/vendor/edit/address?${queryParams.toString()}`, { unique_id, ...payload });
    return response.data;
  },

  deleteVendor: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('unique_id', unique_id);
    queryParams.append('module_unique_id', params.module_unique_id);
    if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);

    const response = await api.delete(`/user/vendor?${queryParams.toString()}`);
    return response.data;
  },
};

export default vendorsService;
