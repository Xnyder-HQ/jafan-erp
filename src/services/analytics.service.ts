import api from './api';

export interface DailyEntry {
  date: string;
  total_count: number;
  total_amount?: number;
  liters_purchased?: number;
  total_cost?: number;
}

export interface GeneralStats {
  total_approvals: number;
  total_customers: number;
  total_delivery_assignments: number;
  total_discounts: number;
  total_expenses: number;
  total_finished_goods: number;
  total_fuel_purchases: number;
  total_invoices: number;
  total_machines: number;
  total_production_batches: number;
  total_products: number;
  total_purchase_orders: number;
  total_raw_materials: number;
  total_sales_orders: number;
  total_users: number;
  total_vehicles: number;
  total_vendors: number;
  total_expense_amount: number;
  total_fuel_purchase_liters: number;
  total_fuel_purchase_cost: number;
  total_invoice_amount: number;
  total_sales_order_amount: number;
  daily_sales_orders: DailyEntry[];
  daily_invoices: DailyEntry[];
  daily_fuel_purchases: DailyEntry[];
  daily_expenses: DailyEntry[];
}

export interface GeneralStatsResponse {
  success: boolean;
  message: string;
  data: GeneralStats | null;
}

interface ModuleParams {
  module_unique_id: string;
  sub_module_unique_id?: string;
}

export interface SalesStats {
  total_customers: number;
  total_products: number;
  total_sales_orders: number;
  total_sales_order_items: number;
  total_invoices: number;
  total_invoice_payments: number;
  total_discounts: number;
  total_products_via_is_inventory_tracked: { is_inventory_tracked: boolean; total_count: number }[];
  total_sales_orders_via_order_status: { order_status: string; total_count: number }[];
  total_invoices_via_invoice_type: { invoice_type: string; total_count: number }[];
  total_invoices_via_invoice_status: { invoice_status: string; total_count: number }[];
  total_invoice_payments_via_payment_method: { payment_method: string; total_count: number }[];
  total_sales_orders_via_customer: {
    Customer: { name: string; reference: string };
    total_count: number;
    total_amount: number;
    discount_amount: number;
    amount_payable: number;
  }[];
  total_sales_orders_via_user: {
    Creator: { firstname: string; lastname: string; unique_id: string };
    total_count: number;
    total_amount: number;
    discount_amount: number;
    amount_payable: number;
  }[];
  total_sales_orders_via_approver: {
    Approver: { firstname: string; lastname: string; unique_id: string };
    total_count: number;
    total_amount: number;
    discount_amount: number;
    amount_payable: number;
  }[];
  total_sales_order_items_via_product: {
    Product: { name: string; reference: string };
    total_count: number;
    total_price: number;
    quantity_ordered: number;
    quantity_supplied: number;
  }[];
  total_discount_via_user: {
    Creator: { firstname: string; lastname: string; unique_id: string };
    total_count: number;
    discount_amount: number;
  }[];
  total_discount_via_approver: {
    Approver: { firstname: string; lastname: string; unique_id: string };
    total_count: number;
    discount_amount: number;
  }[];
  total_invoices_via_customer: {
    Customer: { name: string; reference: string };
    total_count: number;
    discount_amount: number;
    subtotal_amount: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
  }[];
  customer_balance_sum: number;
  sales_order_discount_sum: number;
  discount_sum: number;
  salesOrderAnalysisDaily: { date: string; total_count: number; sales_total_amount: number }[];
  salesOrderAnalysisWeekly: { week: string; total_count: number; sales_total_amount: number }[];
  salesOrderAnalysisMonthly: { month: string; total_count: number; sales_total_amount: number }[];
  salesOrderAnalysisYearly: { year: string; total_count: number; sales_total_amount: number }[];
  invoiceDateAnalysisDaily: { date: string; total_count: number }[];
  invoiceDateAnalysisWeekly: { week: string; total_count: number }[];
  invoiceDateAnalysisMonthly: { month: string; total_count: number }[];
  invoiceDateAnalysisYearly: { year: string; total_count: number }[];
  invoiceDueDateAnalysisDaily: { date: string; total_count: number }[];
  invoiceDueDateAnalysisWeekly: { week: string; total_count: number }[];
  invoiceDueDateAnalysisMonthly: { month: string; total_count: number }[];
  invoiceDueDateAnalysisYearly: { year: string; total_count: number }[];
  invoicePaymentDateAnalysisDaily: { date: string; total_count: number }[];
  invoicePaymentDateAnalysisWeekly: { week: string; total_count: number }[];
  invoicePaymentDateAnalysisMonthly: { month: string; total_count: number }[];
  invoicePaymentDateAnalysisYearly: { year: string; total_count: number }[];
  invoiceOverdueAlerts: {
    unique_id: string;
    due_date: string;
    customer_unique_id: string;
    invoice_type: string;
    days_overdue: number;
    Customer: {
      unique_id: string;
      reference: string;
      type: string;
      name: string;
      email: string;
      phone_number: string;
      alt_phone_number: string | null;
      balance: number;
      profile_image: string | null;
    };
  }[];
  customerBalanceAlerts: { unique_id: string; name: string; balance: number }[];
  excessiveDiscountAlerts: {
    created_by: string;
    discount_amount: number;
    total_amount: number;
    discount_percentage: number;
    User: {
      unique_id: string;
      firstname: string;
      middlename: string | null;
      lastname: string;
      username: string;
      email: string;
    };
  }[];
}

export interface SalesStatsResponse {
  success: boolean;
  message: string;
  data: SalesStats | null;
}

export interface ProcurementStats {
  total_vendors: number;
  total_purchase_orders: number;
  total_vendor_payments: number;
  total_fuel_purchases: number;
  total_expenses: number;
  total_vendor_spend: number;
  total_purchase_order_amount_paid: number;
  total_purchase_order_balance_due: number;
  total_vendor_payment_amount_paid: number;
  total_fuel_purchase_liters_purchased: number;
  total_fuel_purchase_total_cost: number;
  total_expense_amount: number;
  total_purchase_order_via_po_type: { po_type: string; total_count: number }[];
  total_purchase_order_via_payment_status: { payment_status: string; total_count: number }[];
  total_purchase_order_via_delivery_status: { delivery_status: string; total_count: number }[];
  total_purchase_order_via_order_status: { order_status: string; total_count: number }[];
  total_vendor_payment_via_payment_method: { payment_method: string; total_count: number }[];
  total_fuel_purchase_via_fuel_type: { fuel_type: string; total_count: number }[];
  total_fuel_purchase_via_payment_status: { payment_status: string; total_count: number }[];
  total_fuel_purchase_via_delivery_status: { delivery_status: string; total_count: number }[];
  total_expense_via_category: { category: string; total_count: number; total_amount: number }[];
  total_purchase_orders_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; total_amount: number }[];
  total_purchase_orders_via_user_approval: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; total_amount: number }[];
  total_vendor_payment_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; amount_paid: number }[];
  total_vendor_payment_via_facilitator: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; amount_paid: number }[];
  total_fuel_purchase_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; total_cost: number }[];
  total_expense_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; total_amount: number }[];
  purchaseOrderDateAnalysisDaily: { date: string; total_count: number }[];
  purchaseOrderDateAnalysisWeekly: { week: string; total_count: number }[];
  purchaseOrderDateAnalysisMonthly: { month: string; total_count: number }[];
  purchaseOrderDateAnalysisYearly: { year: string; total_count: number }[];
  vendorPaymentDateAnalysisDaily: { date: string; total_count: number }[];
  vendorPaymentDateAnalysisWeekly: { week: string; total_count: number }[];
  vendorPaymentDateAnalysisMonthly: { month: string; total_count: number }[];
  vendorPaymentDateAnalysisYearly: { year: string; total_count: number }[];
  fuelPurchaseDateAnalysisDaily: { date: string; total_count: number }[];
  fuelPurchaseDateAnalysisWeekly: { week: string; total_count: number }[];
  fuelPurchaseDateAnalysisMonthly: { month: string; total_count: number }[];
  fuelPurchaseDateAnalysisYearly: { year: string; total_count: number }[];
  expenseDateAnalysisDaily: { date: string; total_count: number }[];
  expenseDateAnalysisWeekly: { week: string; total_count: number }[];
  expenseDateAnalysisMonthly: { month: string; total_count: number }[];
  expenseDateAnalysisYearly: { year: string; total_count: number }[];
}

export interface ProcurementStatsResponse {
  success: boolean;
  message: string;
  data: ProcurementStats | null;
}

export interface InventoryStats {
  total_raw_materials: number;
  total_raw_material_stock_logs: number;
  total_finished_goods: number;
  total_finished_good_stock_logs: number;
  total_raw_material_stock_log_via_movement_type: { movement_type: string; total_count: number }[];
  total_raw_material_stock_log_via_source_module: { source_module: string; total_count: number }[];
  total_finished_good_stock_log_via_movement_type: { movement_type: string; total_count: number }[];
  total_finished_good_stock_log_via_source_module: { source_module: string; total_count: number }[];
  total_raw_material_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number }[];
  total_finished_good_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number }[];
}

export interface InventoryStatsResponse {
  success: boolean;
  message: string;
  data: InventoryStats | null;
}

export interface ProductionStats {
  total_production_batches: number;
  total_production_teams: number;
  total_production_qc_logs: number;
  total_production_fuel_logs: number;
  total_machine_maintenance_logs: number;
  total_stacking_logs: number;
  total_production_batch_quantity_produced: number;
  total_production_fuel_log_liters_dispensed: number;
  total_machine_maintenance_log_cost: number;
  total_stacking_log_blocks_stacked: number;
  total_stacking_log_breakage_quantity: number;
  total_stacking_log_total_cost: number;
  total_production_batch_via_shift: { shift: string; total_count: number }[];
  total_production_fuel_log_via_fuel_type: { fuel_type: string; total_count: number; liters_dispensed: number }[];
  total_production_batch_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; quantity_produced: number }[];
  total_production_batch_via_machine: { Machine: { name: string; code: string; reference: string }; total_count: number; quantity_produced: number }[];
  total_production_batch_via_production_team: { ProductionTeam: { name: string; is_active: boolean; unique_id: string }; total_count: number; quantity_produced: number }[];
  total_production_batch_via_finished_good: { FinishedGood: { name: string; type: string; reference: string }; total_count: number; quantity_produced: number }[];
  total_production_qc_log_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; defective_quantity: number }[];
  total_production_qc_log_via_machine: { Machine: { name: string; code: string; reference: string }; total_count: number; defective_quantity: number }[];
  total_production_qc_log_via_production_team: { ProductionTeam: { name: string; is_active: boolean; unique_id: string }; total_count: number; defective_quantity: number }[];
  total_production_qc_log_via_production_batch: { ProductionBatch: { quantity_produced: number; shift: string; unique_id: string }; total_count: number; defective_quantity: number }[];
  total_production_qc_log_via_finished_good: { FinishedGood: { name: string; type: string; reference: string }; total_count: number; defective_quantity: number }[];
  total_production_fuel_log_via_dispenser: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; liters_dispensed: number }[];
  total_production_fuel_log_via_machine: { Machine: { name: string; code: string; reference: string }; total_count: number; liters_dispensed: number }[];
  total_machine_maintenance_log_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; cost: number }[];
  total_machine_maintenance_log_via_machine: { Machine: { name: string; code: string; reference: string }; total_count: number; cost: number }[];
  total_machine_maintenance_log_via_vendor: { Vendor: { name: string; type: string; reference: string }; total_count: number; cost: number }[];
  total_stacking_log_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; blocks_stacked: number; breakage_quantity: number; total_cost: number }[];
  total_stacking_log_via_finished_good: { FinishedGood: { name: string; type: string; reference: string }; total_count: number; blocks_stacked: number; breakage_quantity: number; total_cost: number }[];
  productionBatchProductionDateAnalysisDaily: { date: string; total_count: number; quantity_produced: number }[];
  productionBatchProductionDateAnalysisWeekly: { week: string; total_count: number; quantity_produced: number }[];
  productionBatchProductionDateAnalysisMonthly: { month: string; total_count: number; quantity_produced: number }[];
  productionBatchProductionDateAnalysisYearly: { year: string; total_count: number; quantity_produced: number }[];
  productionQcLogQcDateAnalysisDaily: { date: string; total_count: number; defective_quantity: number }[];
  productionQcLogQcDateAnalysisWeekly: { week: string; total_count: number; defective_quantity: number }[];
  productionQcLogQcDateAnalysisMonthly: { month: string; total_count: number; defective_quantity: number }[];
  productionQcLogQcDateAnalysisYearly: { year: string; total_count: number; defective_quantity: number }[];
  productionFuelLogDispensedDateAnalysisDaily: { date: string; total_count: number }[];
  productionFuelLogDispensedDateAnalysisWeekly: { week: string; total_count: number }[];
  productionFuelLogDispensedDateAnalysisMonthly: { month: string; total_count: number }[];
  productionFuelLogDispensedDateAnalysisYearly: { year: string; total_count: number }[];
  machineMaintenanceLogServiceDateAnalysisDaily: { date: string; total_count: number }[];
  machineMaintenanceLogServiceDateAnalysisWeekly: { week: string; total_count: number }[];
  machineMaintenanceLogServiceDateAnalysisMonthly: { month: string; total_count: number }[];
  machineMaintenanceLogServiceDateAnalysisYearly: { year: string; total_count: number }[];
  stackingLogStackDateAnalysisDaily: { date: string; total_count: number }[];
  stackingLogStackDateAnalysisWeekly: { week: string; total_count: number }[];
  stackingLogStackDateAnalysisMonthly: { month: string; total_count: number }[];
  stackingLogStackDateAnalysisYearly: { year: string; total_count: number }[];
}

export interface ProductionStatsResponse {
  success: boolean;
  message: string;
  data: ProductionStats | null;
}

export interface LogisticsStats {
  total_delivery_assignments: number;
  total_supply_logs: number;
  total_logistics_fuel_logs: number;
  total_supply_log_blocks_loaded: number;
  total_supply_log_blocks_dropped: number;
  total_supply_log_blocks_returned: number;
  total_supply_log_breakage_quantity: number;
  total_logistics_fuel_log_liters_dispensed: number;
  total_logistics_fuel_log_expected_trips: number;
  total_logistics_fuel_log_actual_trips: number;
  total_delivery_assignment_via_auto_assigned: { auto_assigned: boolean; total_count: number }[];
  total_delivery_assignment_via_assignment_status: { assignment_status: string; total_count: number }[];
  total_logistics_fuel_log_via_fuel_type: { fuel_type: string; total_count: number; liters_dispensed: number; expected_trips: number; actual_trips: number }[];
  total_delivery_assignment_via_vehicle: { Vehicle: { type: string; code: string; plate_number: string; reference: string }; total_count: number }[];
  total_delivery_assignment_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number }[];
  total_supply_log_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; blocks_loaded: number; blocks_dropped: number; blocks_returned: number; breakage_quantity: number }[];
  total_logistics_fuel_log_via_user: { User: { firstname: string; lastname: string; unique_id: string }; total_count: number; liters_dispensed: number; expected_trips: number; actual_trips: number }[];
  total_logistics_fuel_log_via_vehicle: { Vehicle: { type: string; code: string; plate_number: string; reference: string }; total_count: number; liters_dispensed: number; expected_trips: number; actual_trips: number }[];
  deliveryAssignmentScheduledDateAnalysisDaily: { date: string; total_count: number }[];
  deliveryAssignmentScheduledDateAnalysisWeekly: { week: string; total_count: number }[];
  deliveryAssignmentScheduledDateAnalysisMonthly: { month: string; total_count: number }[];
  deliveryAssignmentScheduledDateAnalysisYearly: { year: string; total_count: number }[];
  supplyLogDeliveryDateAnalysisDaily: { date: string; total_count: number; blocks_loaded: number; blocks_dropped: number; blocks_returned: number; breakage_quantity: number }[];
  supplyLogDeliveryDateAnalysisWeekly: { week: string; total_count: number }[];
  supplyLogDeliveryDateAnalysisMonthly: { month: string; total_count: number }[];
  supplyLogDeliveryDateAnalysisYearly: { year: string; total_count: number }[];
  logisticsFuelLogDispenseDateAnalysisDaily: { date: string; total_count: number }[];
  logisticsFuelLogDispenseDateAnalysisWeekly: { week: string; total_count: number }[];
  logisticsFuelLogDispenseDateAnalysisMonthly: { month: string; total_count: number }[];
  logisticsFuelLogDispenseDateAnalysisYearly: { year: string; total_count: number }[];
}

export interface LogisticsStatsResponse {
  success: boolean;
  message: string;
  data: LogisticsStats | null;
}

export interface AdministrationStats {
  total_vehicles: number;
  total_machines: number;
  total_users: number;
  total_machine_via_fuel_type: { fuel_type: string; total_count: number }[];
  total_machine_via_type: { type: string; total_count: number }[];
  total_machine_via_is_active: { is_active: boolean; total_count: number }[];
  total_users_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
  total_vehicle_via_fuel_type: { fuel_type: string; total_count: number }[];
  total_vehicle_via_type: { type: string; total_count: number }[];
  total_vehicle_via_is_active: { is_active: boolean; total_count: number }[];
  total_vehicle_via_availability_status: { availability_status: string; total_count: number }[];
}

export interface AdministrationStatsResponse {
  success: boolean;
  message: string;
  data: AdministrationStats | null;
}

export interface ApprovalStats {
  total_approvals: number;
  total_approval_via_approval_status: { approval_status: string; total_count: number }[];
  total_approvals_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_approvals_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface ApprovalStatsResponse {
  success: boolean;
  message: string;
  data: ApprovalStats | null;
}

export interface LogStats {
  total_logs: number;
  total_log_via_type: { type: string; total_count: number }[];
}

export interface LogStatsResponse {
  success: boolean;
  message: string;
  data: LogStats | null;
}

export interface AclStats {
  total_acls: number;
  total_acls_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
  total_acls_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_acls_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface AclStatsResponse {
  success: boolean;
  message: string;
  data: AclStats | null;
}

export interface RoleStats {
  total_roles: number;
  total_role_acls: number;
  total_role_acls_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
  total_role_acls_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_role_acls_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface RoleStatsResponse {
  success: boolean;
  message: string;
  data: RoleStats | null;
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

export const analyticsService = {
  getGeneralStats: async (params: ModuleParams): Promise<GeneralStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/general/stats?${query}`);
    return response.data;
  },

  getSalesStats: async (params: ModuleParams): Promise<SalesStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/sales_and_customer_management/stats?${query}`);
    return response.data;
  },

  getProcurementStats: async (params: ModuleParams): Promise<ProcurementStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/procurement_and_vendor_management/stats?${query}`);
    return response.data;
  },

  getInventoryStats: async (params: ModuleParams): Promise<InventoryStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/inventory_and_stock_management/stats?${query}`);
    return response.data;
  },

  getProductionStats: async (params: ModuleParams): Promise<ProductionStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/production_and_quality_control/stats?${query}`);
    return response.data;
  },

  getLogisticsStats: async (params: ModuleParams): Promise<LogisticsStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/logistics_and_supply_chain/stats?${query}`);
    return response.data;
  },

  getAdministrationStats: async (params: ModuleParams): Promise<AdministrationStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/administration/stats?${query}`);
    return response.data;
  },

  getApprovalStats: async (params: ModuleParams): Promise<ApprovalStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/approval/stats?${query}`);
    return response.data;
  },

  getLogStats: async (params: ModuleParams): Promise<LogStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/log/stats?${query}`);
    return response.data;
  },

  getAclStats: async (params: ModuleParams): Promise<AclStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/acl/stats?${query}`);
    return response.data;
  },

  getRoleStats: async (params: ModuleParams): Promise<RoleStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/role/stats?${query}`);
    return response.data;
  },
};

export default analyticsService;
