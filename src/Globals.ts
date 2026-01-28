
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const APP_NAME = 'Jafan Standard Block Industry';
export const APP_SHORT_NAME = 'Jafan ERP';
export const COMPANY_NAME = 'GC-OKOLI ENTERPRISES';
export const COMPANY_LOCATION = 'Ikobi, Otukpo';

export const DEFAULT_CURRENCY = '₦';
export const CURRENCY_CODE = 'NGN';

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'MMM D, YYYY';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATETIME_FORMAT = 'MMM D, YYYY h:mm A';

export const STOCK_ALERTS = {
  CEMENT_LOW: 50,
  SAND_LOW: 2,
  DIESEL_LOW: 100,
  PETROL_LOW: 50,
  BLOCKS_LOW: 500,
};

export const PAYMENT_TERMS = {
  IMMEDIATE: 0,
  SEVEN_DAY: 7,
  FOURTEEN_DAY: 14,
};

export const DEFAULT_PRODUCTION_FORMULAS = {
  SAND_TRIP_TO_BLOCKS: 1200,
  CEMENT_BAG_TO_BLOCKS: 45,
};

export const USER_ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'general_manager', label: 'General Manager' },
  { value: 'sales_staff', label: 'Sales Staff' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'supply_manager', label: 'Supply Manager' },
  { value: 'transport_manager', label: 'Transport Manager' },
];

export const EMPLOYEE_ROLES = [
  { value: 'operator', label: 'Operator' },
  { value: 'mixer', label: 'Mixer' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'loader', label: 'Loader' },
  { value: 'driver', label: 'Driver' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales', label: 'Sales' },
  { value: 'security', label: 'Security' },
];

export const VEHICLE_TYPES = [
  { value: 'tipper', label: 'Tipper' },
  { value: 'block_truck', label: 'Block Truck' },
  { value: 'water_tanker', label: 'Water Tanker' },
];

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
];

export const BLOCK_TYPES = [
  { value: '9-inch', label: '9-inch Hollow Block' },
  { value: '6-inch', label: '6-inch Hollow Block' },
  { value: 'breakage_sand', label: 'Breakage Sand' },
];

export const VENDOR_TYPES = [
  { value: 'sand', label: 'Sand Supplier' },
  { value: 'cement', label: 'Cement Supplier' },
  { value: 'diesel', label: 'Diesel Supplier' },
  { value: 'petrol', label: 'Petrol Supplier' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

export const BREAKAGE_CAUSES = [
  { value: 'production', label: 'Production' },
  { value: 'stacking', label: 'Stacking' },
  { value: 'loading', label: 'Loading' },
  { value: 'transit', label: 'Transit' },
];

export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'Word (.doc)' },
  { value: 'xls', label: 'Excel (.xls)' },
];
