import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import salesOrdersService, { type SalesOrder } from '../../services/salesOrders.service';
import { Alert, showAlert, ErrorState } from '../../components/common';

interface EditSalesOrderForm {
  outside_town: boolean;
  outside_town_location: string;
  outside_town_surcharge: number;
  estimated_trip_liters: number;
  notes: string;
}

const EditSalesOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [order, setOrder] = useState<SalesOrder | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditSalesOrderForm>({
    defaultValues: {
      outside_town: false,
      outside_town_location: '',
      outside_town_surcharge: 0,
      estimated_trip_liters: 0,
      notes: '',
    },
  });

  const watchOutsideTown = watch('outside_town');

  const fetchOrder = useCallback(async () => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      setLoadingOrder(false);
      return;
    }

    setLoadingOrder(true);
    setError('');

    try {
      const response = await salesOrdersService.getSalesOrder(id, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success && response.data) {
        setOrder(response.data);
        reset({
          outside_town: response.data.outside_town,
          outside_town_location: response.data.outside_town_location || '',
          outside_town_surcharge: response.data.outside_town_surcharge || 0,
          estimated_trip_liters: response.data.estimated_trip_liters || 0,
          notes: response.data.notes || '',
        });
      } else {
        setError(response.message || 'Failed to fetch sales order');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to fetch sales order'));
    } finally {
      setLoadingOrder(false);
    }
  }, [moduleId, subModuleId, id, reset]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const onSubmit = async (data: EditSalesOrderForm) => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const outsideTownResponse = await salesOrdersService.updateOutsideTownDetails(
        id,
        {
          outside_town: data.outside_town,
          outside_town_location: data.outside_town ? data.outside_town_location : undefined,
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!outsideTownResponse.success) {
        setError(outsideTownResponse.message || 'Failed to update outside town details');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const tripLitersResponse = await salesOrdersService.updateEstimatedTripLiters(
        id,
        { estimated_trip_liters: data.estimated_trip_liters || undefined },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!tripLitersResponse.success) {
        setError(tripLitersResponse.message || 'Failed to update estimated trip liters');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const notesResponse = await salesOrdersService.updateNotes(
        id,
        { notes: data.notes || undefined },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!notesResponse.success) {
        setError(notesResponse.message || 'Failed to update notes');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      setSuccessMessage('Sales order updated successfully');
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/sales/orders');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update sales order'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="xui-badge xui-badge-success">Completed</span>;
      case 'approved':
        return <span className="xui-badge xui-badge-info">Approved</span>;
      case 'processing':
        return <span className="xui-badge xui-badge-primary">Processing</span>;
      case 'cancelled':
        return <span className="xui-badge xui-badge-danger">Cancelled</span>;
      case 'pending':
      default:
        return <span className="xui-badge xui-badge-warning">Pending</span>;
    }
  };

  if (loadingOrder) {
    return (
      <div>
        <Navbar title="Edit Sales Order" subtitle="Update sales order details" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading sales order...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <Navbar title="Edit Sales Order" subtitle="Update sales order details" />
        <div className="xui-py-1">
          <a
            onClick={() => navigate(-1)}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container">
              <ArrowLeft size={20} />
            </span>
          </a>
          <ErrorState title="Failed to load sales order" message={error} onRetry={fetchOrder} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Sales Order" subtitle="Update sales order details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container">
            <ArrowLeft size={20} />
          </span>
        </a>

        {order && (
          <>
            <div
              className="xui-bg-white xui-p-1 xui-bdr-rad-half xui-mb-2"
              style={{ border: '1px solid var(--neutral-200)' }}
            >
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                <div>
                  <h3 className="xui-font-sz-90 xui-font-w-bold" style={{ color: 'var(--primary-600)' }}>
                    {order.reference}
                  </h3>
                  <p className="xui-font-sz-80 xui-opacity-6">
                    Created on {formatDate(order.createdAt)}
                  </p>
                </div>
                {getStatusBadge(order.order_status)}
              </div>

              <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Customer</p>
                  <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                    <p className="xui-font-sz-85 xui-font-w-500">{order.Customer?.name || 'N/A'}</p>
                    {order.Customer?.unique_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/sales/customers/edit/${order.Customer?.unique_id}`)}
                        className="xui-btn xui-font-sz-70 xui-py-half xui-px-half xui-bdr-rad-half"
                        style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', border: 'none' }}
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Total Amount</p>
                  <p className="xui-font-sz-85 xui-font-w-500">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Amount Payable</p>
                  <p className="xui-font-sz-85 xui-font-w-bold" style={{ color: 'var(--primary-600)' }}>
                    {formatCurrency(order.amount_payable)}
                  </p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Items</p>
                  <p className="xui-font-sz-85 xui-font-w-500">
                    {order.total_items_ordered} ordered / {order.total_items_dropped} dropped
                  </p>
                </div>
              </div>
            </div>

            {order.SalesOrderItems && order.SalesOrderItems.length > 0 && (
              <div
                className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-mb-2"
                style={{ border: '1px solid var(--neutral-200)' }}
              >
                <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <p className="xui-font-sz-85 xui-font-w-bold">Order Items</p>
                  <span className="xui-font-sz-75 xui-opacity-6">Items cannot be modified after creation</span>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Qty Ordered</th>
                        <th>Qty Supplied</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.SalesOrderItems.map((item) => (
                        <tr key={item.unique_id}>
                          <td className="xui-font-w-500">{item.Product?.name || item.product_name}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td>{item.quantity_ordered}</td>
                          <td>{item.quantity_supplied}</td>
                          <td className="xui-font-w-600">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="xui-font-sz-80 xui-opacity-6 xui-mb-1">
              Update the delivery and notes details below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
              <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-2">
                <div>
                  <div className="xui-form-box">
                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                      <input
                        type="checkbox"
                        {...register('outside_town')}
                        style={{ width: 'auto' }}
                      />
                      <span>Outside Town Delivery</span>
                    </label>
                  </div>

                  {watchOutsideTown && (
                    <>
                      <div className="xui-form-box">
                        <label htmlFor="outside_town_location">Outside Town Location *</label>
                        <input
                          type="text"
                          id="outside_town_location"
                          placeholder="Enter delivery location"
                          {...register('outside_town_location', {
                            required: watchOutsideTown ? 'Location is required for outside town delivery' : false,
                          })}
                          className={errors.outside_town_location ? 'xui-bdr-red' : ''}
                        />
                        {errors.outside_town_location && (
                          <span className="xui-font-sz-80 xui-text-red">{errors.outside_town_location.message}</span>
                        )}
                      </div>

                      {/*
                      <div className="xui-form-box">
                        <label htmlFor="outside_town_surcharge">Outside Town Surcharge *</label>
                        <input
                          type="number"
                          id="outside_town_surcharge"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...register('outside_town_surcharge', {
                            required: watchOutsideTown ? 'Surcharge is required for outside town delivery' : false,
                            valueAsNumber: true,
                            min: { value: 0, message: 'Surcharge cannot be negative' },
                          })}
                          className={errors.outside_town_surcharge ? 'xui-bdr-red' : ''}
                        />
                        {errors.outside_town_surcharge && (
                          <span className="xui-font-sz-80 xui-text-red">{errors.outside_town_surcharge.message}</span>
                        )}
                      </div>
                      */}
                    </>
                  )}
                </div>

                <div>
                  <div className="xui-form-box">
                    <label htmlFor="estimated_trip_liters">Estimated Trip Liters</label>
                    <input
                      type="number"
                      id="estimated_trip_liters"
                      placeholder="0"
                      step="0.01"
                      min="0"
                      {...register('estimated_trip_liters', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cannot be negative' },
                      })}
                      className={errors.estimated_trip_liters ? 'xui-bdr-red' : ''}
                    />
                    {errors.estimated_trip_liters && (
                      <span className="xui-font-sz-80 xui-text-red">{errors.estimated_trip_liters.message}</span>
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

              <button
                type="submit"
                disabled={loading || !isDirty}
                className="xui-btn xui-mt-1 xui-bdr-rad-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                {loading ? 'Updating Order...' : 'Update Order'}
              </button>
            </form>
          </>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditSalesOrder;
