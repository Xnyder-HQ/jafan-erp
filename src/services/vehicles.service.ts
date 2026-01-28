import api from './api';

export interface Vehicle {
  unique_id: string;
  reference: string;
  code: string;
  plate_number: string;
  type: string;
  capacity_unit: string;
  capacity_value: number;
  fuel_type: string;
  benchmark_fuel_liters: number;
  expected_trips_per_benchmark: number;
  purchase_date: string | null;
  availability_status: string;
  notes: string | null;
  is_active: boolean;
  created_by: string;
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

export interface VehiclesResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: Vehicle[];
    pages: number;
  } | null;
}

export interface VehicleResponse {
  success: boolean;
  message: string;
  data: Vehicle | null;
}

export interface AddVehiclePayload {
  code: string;
  plate_number: string;
  type: string;
  capacity_unit: string;
  capacity_value: number;
  fuel_type: string;
  benchmark_fuel_liters: number;
  expected_trips_per_benchmark: number;
  purchase_date?: string;
  availability_status: string;
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

const vehiclesService = {
  getVehicles: async (params: PaginationParams): Promise<VehiclesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/vehicles?${query}`);
    return response.data;
  },

  getVehicle: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<VehicleResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/vehicle?${query}`);
    return response.data;
  },

  searchVehicles: async (params: SearchParams): Promise<VehiclesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/vehicles?${query}`);
    return response.data;
  },

  filterVehicles: async (params: FilterParams): Promise<VehiclesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/vehicles?${query}`);
    return response.data;
  },

  addVehicle: async (
    data: AddVehiclePayload,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string; data: { unique_id: string } | null }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/vehicle/add?${query}`, data);
    return response.data;
  },

  updateVehicleDetails: async (
    data: { unique_id: string; code: string; plate_number: string; type: string; fuel_type: string; purchase_date?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vehicle/edit/details?${query}`, data);
    return response.data;
  },

  updateVehicleOtherDetails: async (
    data: { unique_id: string; capacity_unit: string; capacity_value: number; benchmark_fuel_liters: number; expected_trips_per_benchmark: number },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vehicle/edit/other/details?${query}`, data);
    return response.data;
  },

  updateAvailabilityStatus: async (
    data: { unique_id: string; availability_status: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vehicle/edit/availability_status?${query}`, data);
    return response.data;
  },

  updateVehicleNotes: async (
    data: { unique_id: string; notes?: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vehicle/edit/notes?${query}`, data);
    return response.data;
  },

  toggleVehicle: async (
    data: { unique_id: string; is_active: boolean },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/vehicle/toggles?${query}`, data);
    return response.data;
  },

  deleteVehicle: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/vehicle?${query}`, {
      data: { unique_id },
    });
    return response.data;
  },
};

export default vehiclesService;
