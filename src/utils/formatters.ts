import moment from 'moment';

export const formatCurrency = (amount: number, currency: string = '₦'): string => {
  return `${currency}${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-NG');
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    const val = num / 1000000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'B';
  }
  if (num >= 1000000) {
    const val = num / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M';
  }
  if (num >= 1000) {
    const val = num / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K';
  }
  return num.toString();
};

export const formatCompactCurrency = (amount: number, currency: string = '₦'): string => {
  return `${currency}${formatCompactNumber(amount)}`;
};

export const formatDate = (date: string | Date, format: string = 'MMM D, YYYY'): string => {
  return moment(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return moment(date).format('MMM D, YYYY h:mm A');
};

export const formatRelativeTime = (date: string | Date): string => {
  return moment(date).fromNow();
};

export const formatDateRange = (start: string | Date, end: string | Date): string => {
  const startDate = moment(start);
  const endDate = moment(end);

  if (startDate.isSame(endDate, 'day')) {
    return startDate.format('MMM D, YYYY');
  }

  if (startDate.isSame(endDate, 'month')) {
    return `${startDate.format('MMM D')} - ${endDate.format('D, YYYY')}`;
  }

  return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    open: 'Open',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    active: 'Active',
    inactive: 'Inactive',
    available: 'Available',
    on_delivery: 'On Delivery',
    down_for_maintenance: 'Down',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

export const getStatusClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    open: 'badge-info',
    processing: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
    unpaid: 'badge-error',
    partially_paid: 'badge-warning',
    paid: 'badge-success',
    active: 'badge-success',
    inactive: 'badge-error',
    available: 'badge-success',
    on_delivery: 'badge-info',
    down_for_maintenance: 'badge-error',
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
  };

  return statusClasses[status] || 'badge-info';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const generateOrderNumber = (prefix: string = 'ORD'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

interface ValidationError {
  msg: string;
  path?: string;
  type?: string;
  value?: any;
  location?: string;
}

interface ApiErrorResponse {
  success: boolean;
  message: string;
  data?: ValidationError[] | null;
}

export const extractErrorMessage = (error: any, fallbackMessage: string = 'An error occurred'): string => {
  const response: ApiErrorResponse | undefined = error?.response?.data;

  if (!response) {
    return error?.message || fallbackMessage;
  }

  if (Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0].msg || response.message || fallbackMessage;
  }

  return response.message || fallbackMessage;
};

export const extractAllErrorMessages = (error: any): string[] => {
  const response: ApiErrorResponse | undefined = error?.response?.data;

  if (!response) {
    return [error?.message || 'An error occurred'];
  }
  if (Array.isArray(response.data) && response.data.length > 0) {
    return response.data.map(err => err.msg);
  }

  return [response.message || 'An error occurred'];
};

export const isValidationError = (error: any): boolean => {
  const response = error?.response?.data;
  return response && Array.isArray(response.data) && response.data.length > 0;
};
