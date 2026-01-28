import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import invoicesService from '../../services/invoices.service';
import salesOrdersService, { type SalesOrder } from '../../services/salesOrders.service';
import { Alert, showAlert } from '../../components/common';

interface InvoiceForm {
  sales_order_unique_id: string;
  invoice_date: string;
  due_date: string;
  invoice_type: string;
  notes: string;
}

const AddInvoice = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'invoices');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const salesOrderAccessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const salesOrderModuleId = salesOrderAccessIds?.module_unique_id;
  const salesOrderSubModuleId = salesOrderAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceForm>({
    defaultValues: {
      sales_order_unique_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      invoice_type: 'Immediate',
      notes: '',
    },
  });

  const watchSalesOrderId = watch('sales_order_unique_id');

  useEffect(() => {
    if (watchSalesOrderId) {
      const order = salesOrders.find((o) => o.unique_id === watchSalesOrderId);
      setSelectedOrder(order || null);
    } else {
      setSelectedOrder(null);
    }
  }, [watchSalesOrderId, salesOrders]);

  const fetchSalesOrders = useCallback(async () => {
    if (!salesOrderModuleId || !salesOrderSubModuleId) return;

    try {
      setLoadingOrders(true);
      const response = await salesOrdersService.getSalesOrders({
        page: 1,
        size: 100,
        module_unique_id: salesOrderModuleId,
        sub_module_unique_id: salesOrderSubModuleId,
      });

      if (response.success && response.data) {
        const orders = 'rows' in response.data ? response.data.rows : response.data;
        const approvedOrders = orders.filter(
          (order: SalesOrder) => order.approved_by && order.order_status?.toLowerCase() !== 'cancelled'
        );
        setSalesOrders(approvedOrders);
      }
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [salesOrderModuleId, salesOrderSubModuleId]);

  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  const onSubmit = async (data: InvoiceForm) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    if (!data.sales_order_unique_id) {
      setError('Please select a sales order');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        sales_order_unique_id: data.sales_order_unique_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        invoice_type: data.invoice_type,
        notes: data.notes || undefined,
      };

      const response = await invoicesService.addInvoice(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Invoice created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/invoices');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create invoice');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create invoice'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrders) {
    return (
      <div>
        <Navbar title="Create Invoice" subtitle="Generate a new invoice from a sales order" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Create Invoice" subtitle="Generate a new invoice from a sales order" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container">
            <ArrowLeft size={20} />
          </span>
        </a>

        <p className="xui-font-sz-80 xui-opacity-6">
          Select a sales order to create an invoice. The invoice will inherit the order details.
        </p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="sales_order_unique_id">Sales Order *</label>
                <select
                  id="sales_order_unique_id"
                  {...register('sales_order_unique_id', { required: 'Sales order is required' })}
                  className={errors.sales_order_unique_id ? 'xui-bdr-red' : ''}
                >
                  <option value="">--Select sales order--</option>
                  {salesOrders.map((order) => (
                    <option key={order.unique_id} value={order.unique_id}>
                      {order.reference} - {order.Customer?.name} ({formatCurrency(order.amount_payable)})
                    </option>
                  ))}
                </select>
                {errors.sales_order_unique_id && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.sales_order_unique_id.message}</span>
                )}
                {salesOrders.length === 0 && (
                  <span className="xui-font-sz-80 xui-opacity-6 xui-d-block xui-mt-half">
                    No approved sales orders available for invoicing.
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="invoice_type">Invoice Type *</label>
                <select
                  id="invoice_type"
                  {...register('invoice_type', { required: 'Invoice type is required' })}
                  className={errors.invoice_type ? 'xui-bdr-red' : ''}
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Credit">Credit</option>
                </select>
                {errors.invoice_type && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.invoice_type.message}</span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="invoice_date">Invoice Date *</label>
                <input
                  type="date"
                  id="invoice_date"
                  {...register('invoice_date', { required: 'Invoice date is required' })}
                  className={errors.invoice_date ? 'xui-bdr-red' : ''}
                />
                {errors.invoice_date && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.invoice_date.message}</span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="due_date">Due Date *</label>
                <input
                  type="date"
                  id="due_date"
                  {...register('due_date', { required: 'Due date is required' })}
                  className={errors.due_date ? 'xui-bdr-red' : ''}
                />
                {errors.due_date && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.due_date.message}</span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Additional notes"
                  rows={4}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>
          {selectedOrder && (
            <>
              <hr className="xui-my-2" />
              <div className="xui-mb-1">
                <p className="xui-font-sz-90 xui-font-w-bold xui-mb-1">Order Summary</p>
                <div
                  className="xui-bg-white xui-p-1 xui-bdr-rad-half"
                  style={{ border: '1px solid var(--neutral-200)' }}
                >
                  <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
                    <div>
                      <p className="xui-font-sz-75 xui-opacity-6">Customer</p>
                      <p className="xui-font-sz-85 xui-font-w-500">{selectedOrder.Customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="xui-font-sz-75 xui-opacity-6">Total Amount</p>
                      <p className="xui-font-sz-85 xui-font-w-500">{formatCurrency(selectedOrder.total_amount)}</p>
                    </div>
                    <div>
                      <p className="xui-font-sz-75 xui-opacity-6">Discount</p>
                      <p className="xui-font-sz-85 xui-font-w-500" style={{ color: selectedOrder.discount_amount > 0 ? 'var(--error)' : 'inherit' }}>
                        {selectedOrder.discount_amount > 0 ? `-${formatCurrency(selectedOrder.discount_amount)}` : formatCurrency(0)}
                      </p>
                    </div>
                    <div>
                      <p className="xui-font-sz-75 xui-opacity-6">Amount Payable</p>
                      <p className="xui-font-sz-85 xui-font-w-bold" style={{ color: 'var(--primary-600)' }}>
                        {formatCurrency(selectedOrder.amount_payable)}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.outside_town && (
                    <div className="xui-mt-1 xui-pt-1" style={{ borderTop: '1px solid var(--neutral-200)' }}>
                      <p className="xui-font-sz-75 xui-opacity-6">Outside Town Delivery</p>
                      <p className="xui-font-sz-85">
                        {selectedOrder.outside_town_location} - Surcharge: {formatCurrency(selectedOrder.outside_town_surcharge)}
                      </p>
                    </div>
                  )}
                  {selectedOrder.SalesOrderItems && selectedOrder.SalesOrderItems.length > 0 && (
                    <div className="xui-mt-1 xui-pt-1" style={{ borderTop: '1px solid var(--neutral-200)' }}>
                      <p className="xui-font-sz-75 xui-opacity-6 xui-mb-half">Order Items ({selectedOrder.total_items_ordered})</p>
                      <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                        {selectedOrder.SalesOrderItems.map((item) => (
                          <div key={item.unique_id} className="xui-d-flex xui-flex-jc-space-between xui-font-sz-85">
                            <span>{item.Product?.name || item.product_name} x {item.quantity_ordered}</span>
                            <span className="xui-font-w-500">{formatCurrency(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || salesOrders.length === 0}
            className="xui-btn xui-mt-1 xui-bdr-rad-half"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddInvoice;
