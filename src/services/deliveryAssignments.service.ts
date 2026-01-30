import api from './api';

export interface DeliveryAssignment {
  unique_id: string;
  sales_order_unique_id: string;
  vehicle_unique_id: string | null;
  scheduled_date: string;
  assigned_at: string | null;
  auto_assigned: boolean;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  assignment_status: string;
  updated_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SalesOrder?: {
    unique_id: string;
    reference: string;
    total_amount: number;
    discount_amount: number;
    outside_town: boolean;
    outside_town_location: string | null;
    estimated_trip_liters: number;
    outside_town_surcharge: number;
    amount_payable: number;
    total_items_ordered: number;
    total_items_dropped: number;
    order_status: string;
  };
  Vehicle?: {
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
    is_active: boolean;
  };
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

export interface DeliveryAssignmentsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    rows: DeliveryAssignment[];
    pages: number;
  } | DeliveryAssignment[] | null;
}

export interface DeliveryAssignmentResponse {
  success: boolean;
  message: string;
  data: DeliveryAssignment | null;
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
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

export const deliveryAssignmentsService = {
  getDeliveryAssignments: async (params: PaginationParams): Promise<DeliveryAssignmentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/delivery/assignments?${query}`);
    return response.data;
  },

  getDeliveryAssignment: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<DeliveryAssignmentResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/delivery/assignment?${query}`);
    return response.data;
  },

  searchDeliveryAssignments: async (params: SearchParams): Promise<DeliveryAssignmentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/delivery/assignments?${query}`);
    return response.data;
  },

  filterDeliveryAssignments: async (params: FilterParams): Promise<DeliveryAssignmentsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/delivery/assignments?${query}`);
    return response.data;
  },

  updateScheduledDate: async (
    unique_id: string,
    data: { scheduled_date: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/delivery/assignment/edit/scheduled_date?${query}`, data);
    return response.data;
  },

  reassignDeliveryAssignment: async (
    unique_id: string,
    data: { vehicle_unique_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/delivery/assignment/edit/reassignment?${query}`, data);
    return response.data;
  },

  updateNotes: async (
    unique_id: string,
    data: { notes: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/delivery/assignment/edit/notes?${query}`, data);
    return response.data;
  },

  startDeliveryAssignment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/start/delivery/assignment?${query}`);
    return response.data;
  },

  completeDeliveryAssignment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/complete/delivery/assignment?${query}`);
    return response.data;
  },

  cancelDeliveryAssignment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.put(`/user/cancel/delivery/assignment?${query}`);
    return response.data;
  },

  deleteDeliveryAssignment: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.delete(`/user/delivery/assignment?${query}`);
    return response.data;
  },

  // Public endpoint for dropdowns
  getDeliveryAssignmentsForDropdown: async (): Promise<DeliveryAssignmentsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('size', '100');

    const response = await api.get(`/delivery/assignments?${queryParams.toString()}`);
    return response.data;
  },
};

export default deliveryAssignmentsService;
