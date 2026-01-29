import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import discountsService from '../../services/discounts.service';
import salesOrdersService from '../../services/salesOrders.service';
import type { SalesOrder } from '../../services/salesOrders.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

interface DiscountFormData {
  sales_order_unique_id: string;
  discount_amount: string;
  reason: string;
}

const AddDiscount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiscountFormData>({
    defaultValues: {
      sales_order_unique_id: '',
      discount_amount: '',
      reason: '',
    },
  });

  const selectedOrderId = watch('sales_order_unique_id');

  const fetchSalesOrders = useCallback(async () => {
    if (!accessIds) {
      setLoadingSalesOrders(false);
      return;
    }

    try {
      const response = await salesOrdersService.getSalesOrders({
        page: 1,
        size: 100,
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setSalesOrders(response.data);
        } else {
          setSalesOrders(response.data.rows || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch sales orders:', err);
    } finally {
      setLoadingSalesOrders(false);
    }
  }, [accessIds]);

  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = salesOrders.find((o) => o.unique_id === selectedOrderId);
      setSelectedOrder(order || null);
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId, salesOrders]);

  useEffect(() => {
    const salesOrderId = searchParams.get('sales_order_unique_id');
    if (salesOrderId && salesOrders.length > 0) {
      const orderExists = salesOrders.some((o) => o.unique_id === salesOrderId);
      if (orderExists) {
        setValue('sales_order_unique_id', salesOrderId);
      }
    }
  }, [searchParams, salesOrders, setValue]);

  const onSubmit = async (data: DiscountFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sales_order_unique_id: data.sales_order_unique_id,
        discount_amount: Number(data.discount_amount),
        reason: data.reason || undefined,
      };

      const response = await discountsService.addDiscount(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Discount added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/discounts');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add discount');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add discount'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Add Discount" subtitle="Create a new discount for a sales order" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the discount details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="sales_order_unique_id">Sales Order *</label>
                <select
                  id="sales_order_unique_id"
                  disabled={loadingSalesOrders}
                  {...register('sales_order_unique_id', {
                    required: 'Sales order is required',
                  })}
                >
                  <option value="" disabled>
                    {loadingSalesOrders ? 'Loading sales orders...' : '--Select sales order--'}
                  </option>
                  {salesOrders.map((order) => (
                    <option key={order.unique_id} value={order.unique_id}>
                      {order.reference} - {order.Customer?.name || 'N/A'} ({formatCurrency(order.total_amount)})
                    </option>
                  ))}
                </select>
                {errors.sales_order_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.sales_order_unique_id.message}
                  </span>
                )}
              </div>

              {selectedOrder && (
                <div
                  className="xui-p-1 xui-bdr-rad-half xui-mb-1"
                  style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
                >
                  <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Selected Order Details:</p>
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-half xui-font-sz-80">
                    <span className="xui-opacity-6">Customer:</span>
                    <span className="xui-font-w-500">{selectedOrder.Customer?.name || 'N/A'}</span>
                    <span className="xui-opacity-6">Total Amount:</span>
                    <span className="xui-font-w-500">{formatCurrency(selectedOrder.total_amount)}</span>
                    <span className="xui-opacity-6">Current Discount:</span>
                    <span className="xui-font-w-500" style={{ color: 'var(--error)' }}>
                      {formatCurrency(selectedOrder.discount_amount)}
                    </span>
                  </div>
                </div>
              )}

              <div className="xui-form-box">
                <label htmlFor="discount_amount">Discount Amount *</label>
                <input
                  type="number"
                  id="discount_amount"
                  placeholder="Enter discount amount"
                  min="0"
                  step="0.01"
                  {...register('discount_amount', {
                    required: 'Discount amount is required',
                    min: { value: 0, message: 'Amount must be at least 0' },
                    validate: (value) => {
                      if (selectedOrder && Number(value) > selectedOrder.total_amount) {
                        return `Discount cannot exceed the order total of ${formatCurrency(selectedOrder.total_amount)}`;
                      }
                      return true;
                    },
                  })}
                />
                {errors.discount_amount && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.discount_amount.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="reason">Reason for Discount</label>
                <textarea
                  id="reason"
                  placeholder="Enter reason for applying this discount"
                  rows={5}
                  {...register('reason', {
                    maxLength: { value: 1000, message: 'Reason must be less than 1000 characters' },
                  })}
                />
                {errors.reason && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.reason.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Saving Discount...' : 'Save Discount'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddDiscount;
