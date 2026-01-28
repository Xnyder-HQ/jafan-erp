
export interface User {
  unique_id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type UserRole =
  | 'administrator'
  | 'general_manager'
  | 'sales_staff'
  | 'production_manager'
  | 'supply_manager'
  | 'transport_manager';

export interface UserPermissions {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  modules: string[];
}

export interface Customer {
  unique_id: string;
  name: string;
  phone_number: string;
  email?: string;
  customer_type: 'engineer' | 'developer' | 'other';
  account_balance: number;
  site_addresses: SiteAddress[];
  created_at: string;
  updated_at: string;
}

export interface SiteAddress {
  unique_id: string;
  address: string;
  city: string;
  state: string;
  is_primary: boolean;
}

export interface Product {
  unique_id: string;
  product_code: string;
  name: string;
  description?: string;
  unit_price: number;
  category: 'block' | 'sand' | 'other';
  block_type?: '9-inch' | '6-inch' | 'breakage_sand';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  unique_id: string;
  order_number: string;
  customer: Customer;
  items: SalesOrderItem[];
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  outside_town_surcharge: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  order_status: 'open' | 'processing' | 'completed' | 'cancelled';
  is_outside_town: boolean;
  delivery_location?: string;
  estimated_liters?: number;
  payment_method?: string;
  applied_from_balance: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  unique_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
  blocks_delivered: number;
  blocks_remaining: number;
}

export interface Invoice {
  unique_id: string;
  invoice_number: string;
  sales_order: SalesOrder;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  payment_terms: 'immediate' | '7_day' | '14_day';
  due_date: string;
  payments: InvoicePayment[];
  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  unique_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  receipt_number: string;
}

export interface Vendor {
  unique_id: string;
  name: string;
  vendor_type: 'sand' | 'cement' | 'diesel' | 'petrol' | 'maintenance' | 'other';
  phone_number: string;
  email?: string;
  address?: string;
  total_spend: number;
  created_at: string;
  updated_at: string;
}

export interface RawMaterial {
  unique_id: string;
  name: string;
  unit: 'bags' | 'tons' | 'liters' | 'trips';
  current_stock: number;
  minimum_stock: number;
  last_restock_date: string;
}

export interface FinishedGood {
  unique_id: string;
  product: Product;
  current_stock: number;
  minimum_stock: number;
}

export interface ProductionBatch {
  unique_id: string;
  batch_number: string;
  machine_id: string;
  team: ProductionTeam;
  block_type: '9-inch' | '6-inch';
  quantity_produced: number;
  sand_used: number;
  cement_used: number;
  water_used: number;
  qc_passed: number;
  qc_failed: number;
  production_date: string;
  created_at: string;
}

export interface ProductionTeam {
  unique_id: string;
  name: string;
  operator: Employee;
  members: Employee[];
}

export interface QCLog {
  unique_id: string;
  batch: ProductionBatch;
  cracked_blocks: number;
  failed_blocks: number;
  reason?: string;
  logged_by: string;
  logged_at: string;
}

export interface Vehicle {
  unique_id: string;
  registration_number: string;
  vehicle_type: 'tipper' | 'block_truck' | 'water_tanker';
  capacity: string;
  fuel_type: 'diesel' | 'petrol';
  benchmark_fuel_quantity: number;
  expected_trips_per_benchmark: number;
  status: 'available' | 'on_delivery' | 'down_for_maintenance';
  assigned_driver?: Employee;
}

export interface SupplyLog {
  unique_id: string;
  sales_order: SalesOrder;
  vehicle: Vehicle;
  driver: Employee;
  customer_name: string;
  site_address: string;
  blocks_loaded: number;
  blocks_dropped: number;
  blocks_returned: number;
  breakages_transit: number;
  delivery_date: string;
  logged_by: string;
}

export interface DeliveryQueue {
  unique_id: string;
  sales_order: SalesOrder;
  assigned_vehicle?: Vehicle;
  assigned_driver?: Employee;
  priority: number;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  estimated_delivery?: string;
}

export interface Employee {
  unique_id: string;
  employee_id: string;
  name: string;
  phone_number: string;
  email?: string;
  role: EmployeeRole;
  pay_type: 'daily' | 'weekly' | 'monthly';
  base_salary?: number;
  rate_per_block?: number;
  team?: ProductionTeam;
  status: 'active' | 'inactive';
  hire_date: string;
  created_at: string;
}

export type EmployeeRole =
  | 'operator'
  | 'mixer'
  | 'carrier'
  | 'loader'
  | 'driver'
  | 'manager'
  | 'sales'
  | 'security';

export interface AttendanceLog {
  unique_id: string;
  employee: Employee;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late';
}

export interface ManualPenalty {
  unique_id: string;
  employee: Employee;
  amount: number;
  reason: string;
  applied_by: string;
  applied_at: string;
  deducted_in_payroll?: string;
}

export interface EmployeeLoan {
  unique_id: string;
  employee: Employee;
  amount: number;
  amount_repaid: number;
  amount_remaining: number;
  status: 'active' | 'paid';
  issued_date: string;
  repayments: LoanRepayment[];
}

export interface LoanRepayment {
  unique_id: string;
  amount: number;
  repayment_date: string;
  deducted_from_payroll: boolean;
}

export interface ChartOfAccount {
  unique_id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_account?: string;
  balance: number;
  status: 'active' | 'archived';
}

export interface LedgerEntry {
  unique_id: string;
  account: ChartOfAccount;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  entry_date: string;
  created_by: string;
}

export interface RefundRequest {
  unique_id: string;
  sales_order: SalesOrder;
  customer: Customer;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  refunded_from_account?: string;
}

export interface BreakageLog {
  unique_id: string;
  block_type: '9-inch' | '6-inch';
  quantity: number;
  cause: 'production' | 'stacking' | 'loading' | 'transit';
  responsible_team?: ProductionTeam;
  responsible_driver?: Employee;
  logged_by: string;
  logged_at: string;
}

export interface AuditLog {
  unique_id: string;
  action: string;
  module: string;
  record_id: string;
  old_value?: string;
  new_value?: string;
  performed_by: string;
  performed_at: string;
  ip_address?: string;
}

export interface DashboardStats {
  today_sales: number;
  today_production: number;
  trucks_on_delivery: number;
  cement_stock: number;
  sand_stock: number;
  diesel_stock: number;
  petrol_stock: number;
}

export interface Alert {
  unique_id: string;
  type: 'low_stock' | 'production' | 'invoice' | 'fuel' | 'refund' | 'driver_performance';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  rows: T[];
  pages: number;
  count: number;
  current_page: number;
}

export interface BusinessRules {
  production_formulas: {
    sand_trip_to_blocks: number;
    cement_bag_to_blocks: number;
  };
  payroll_rates: {
    operator_per_block: number;
    mixer_per_block: number;
    carrier_per_block: number;
    loader_per_block: number;
    stacking_rate: number;
  };
  fuel_benchmarks: {
    liters_per_trip: number;
  };
  transport_rates: {
    base_rate_per_block: number;
    maintenance_markup_percent: number;
  };
  current_prices: {
    diesel_per_liter: number;
    petrol_per_liter: number;
  };
}
