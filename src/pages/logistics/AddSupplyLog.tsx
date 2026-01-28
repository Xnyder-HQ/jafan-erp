import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import supplyLogsService from '../../services/supplyLogs.service';
import deliveryAssignmentsService from '../../services/deliveryAssignments.service';
import type { DeliveryAssignment } from '../../services/deliveryAssignments.service';
import salesOrdersService from '../../services/salesOrders.service';
import type { SalesOrderItem } from '../../services/salesOrders.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface SupplyLogFormData {
  delivery_assignment_unique_id: string;
  sales_order_item_unique_id: string;
  site_address: string;
  delivery_date: string;
  blocks_loaded: string;
  blocks_dropped: string;
  blocks_returned: string;
  breakage_quantity: string;
  notes: string;
}

const AddSupplyLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);
  const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  const accessIds = getAccessIds('logistics-supply-chain', 'supply-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const daAccessIds = getAccessIds('logistics-supply-chain', 'delivery-assignments');
  const daModuleId = daAccessIds?.module_unique_id;
  const daSubModuleId = daAccessIds?.sub_module_unique_id;

  const soAccessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const soModuleId = soAccessIds?.module_unique_id;
  const soSubModuleId = soAccessIds?.sub_module_unique_id;

  const now = new Date();
  const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplyLogFormData>({
    defaultValues: {
      delivery_assignment_unique_id: '',
      sales_order_item_unique_id: '',
      site_address: '',
      delivery_date: defaultDateTime,
      blocks_loaded: '',
      blocks_dropped: '',
      blocks_returned: '0',
      breakage_quantity: '0',
      notes: '',
    },
  });

  const selectedAssignmentId = watch('delivery_assignment_unique_id');

  useEffect(() => {
    const fetchDeliveryAssignments = async () => {
      if (!daModuleId || !daSubModuleId) {
        setLoadingOptions(false);
        return;
      }

      try {
        const response = await deliveryAssignmentsService.getDeliveryAssignments({
          page: 1,
          size: 100,
          module_unique_id: daModuleId,
          sub_module_unique_id: daSubModuleId,
        });

        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setDeliveryAssignments(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch delivery assignments:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchDeliveryAssignments();
  }, [daModuleId, daSubModuleId]);

  useEffect(() => {
    if (!selectedAssignmentId || !soModuleId) {
      setSalesOrderItems([]);
      setValue('sales_order_item_unique_id', '');
      return;
    }

    const selectedAssignment = deliveryAssignments.find(da => da.unique_id === selectedAssignmentId);
    if (!selectedAssignment?.sales_order_unique_id) {
      setSalesOrderItems([]);
      setValue('sales_order_item_unique_id', '');
      return;
    }

    const fetchSalesOrderItems = async () => {
      setLoadingItems(true);
      setSalesOrderItems([]);
      setValue('sales_order_item_unique_id', '');

      try {
        const response = await salesOrdersService.getSalesOrder(
          selectedAssignment.sales_order_unique_id,
          {
            module_unique_id: soModuleId,
            sub_module_unique_id: soSubModuleId,
          }
        );

        if (response.success && response.data?.SalesOrderItems) {
          setSalesOrderItems(response.data.SalesOrderItems);
        }
      } catch (err) {
        console.error('Failed to fetch sales order items:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchSalesOrderItems();
  }, [selectedAssignmentId, soModuleId, soSubModuleId, deliveryAssignments, setValue]);

  const onSubmit = async (data: SupplyLogFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const deliveryDate = data.delivery_date.replace('T', ' ');

      const response = await supplyLogsService.addSupplyLog(
        {
          delivery_assignment_unique_id: data.delivery_assignment_unique_id,
          sales_order_item_unique_id: data.sales_order_item_unique_id,
          site_address: data.site_address,
          delivery_date: deliveryDate,
          blocks_loaded: Number(data.blocks_loaded),
          blocks_dropped: Number(data.blocks_dropped),
          blocks_returned: Number(data.blocks_returned),
          breakage_quantity: Number(data.breakage_quantity),
          ...(data.notes && { notes: data.notes }),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Supply log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/logistics/supply-log');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add supply log');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add supply log'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Log Supply" subtitle="Record a delivery supply entry" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Log Supply" subtitle="Record a delivery supply entry" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the details below to log a supply delivery. This will update stock levels and sales order item quantities.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="delivery_assignment_unique_id">Delivery Assignment *</label>
                <select
                  id="delivery_assignment_unique_id"
                  {...register('delivery_assignment_unique_id', { required: 'Delivery assignment is required' })}
                >
                  <option value="">--Select delivery assignment--</option>
                  {deliveryAssignments.map((da) => (
                    <option key={da.unique_id} value={da.unique_id}>
                      {da.SalesOrder?.reference || da.unique_id} — {da.Vehicle?.plate_number || 'No Vehicle'} ({da.assignment_status})
                    </option>
                  ))}
                </select>
                {errors.delivery_assignment_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.delivery_assignment_unique_id.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="sales_order_item_unique_id">Sales Order Item *</label>
                <select
                  id="sales_order_item_unique_id"
                  disabled={!selectedAssignmentId || loadingItems}
                  {...register('sales_order_item_unique_id', { required: 'Sales order item is required' })}
                >
                  <option value="">
                    {loadingItems ? 'Loading items...' : !selectedAssignmentId ? '--Select a delivery assignment first--' : '--Select sales order item--'}
                  </option>
                  {salesOrderItems.map((item) => (
                    <option key={item.unique_id} value={item.unique_id}>
                      {item.product_name} — Ordered: {item.quantity_ordered}, Supplied: {item.quantity_supplied}
                    </option>
                  ))}
                </select>
                {errors.sales_order_item_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.sales_order_item_unique_id.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="site_address">Site Address *</label>
                <input
                  type="text"
                  id="site_address"
                  placeholder="Enter delivery site address"
                  {...register('site_address', {
                    required: 'Site address is required',
                    minLength: { value: 1, message: 'Site address is required' },
                    maxLength: { value: 300, message: 'Site address must be less than 300 characters' },
                  })}
                />
                {errors.site_address && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.site_address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="delivery_date">Delivery Date & Time *</label>
                <input
                  type="datetime-local"
                  id="delivery_date"
                  {...register('delivery_date', { required: 'Delivery date is required' })}
                />
                {errors.delivery_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.delivery_date.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="blocks_loaded">Blocks Loaded *</label>
                <input
                  type="number"
                  id="blocks_loaded"
                  placeholder="Enter number of blocks loaded"
                  min="0"
                  step="1"
                  {...register('blocks_loaded', {
                    required: 'Blocks loaded is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.blocks_loaded && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.blocks_loaded.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="blocks_dropped">Blocks Dropped *</label>
                <input
                  type="number"
                  id="blocks_dropped"
                  placeholder="Enter number of blocks dropped at site"
                  min="0"
                  step="1"
                  {...register('blocks_dropped', {
                    required: 'Blocks dropped is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.blocks_dropped && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.blocks_dropped.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="blocks_returned">Blocks Returned *</label>
                <input
                  type="number"
                  id="blocks_returned"
                  placeholder="Enter number of blocks returned"
                  min="0"
                  step="1"
                  {...register('blocks_returned', {
                    required: 'Blocks returned is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.blocks_returned && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.blocks_returned.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="breakage_quantity">Breakage Quantity *</label>
                <input
                  type="number"
                  id="breakage_quantity"
                  placeholder="Enter number of broken blocks"
                  min="0"
                  step="1"
                  {...register('breakage_quantity', {
                    required: 'Breakage quantity is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.breakage_quantity && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.breakage_quantity.message}
                  </span>
                )}
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  Breakage will be logged as stock reduction in the finished goods inventory
                </small>
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  rows={3}
                  {...register('notes', {
                    maxLength: { value: 300, message: 'Notes must be less than 300 characters' },
                  })}
                />
                {errors.notes && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.notes.message}
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
            {loading ? 'Adding Supply Log...' : 'Add Supply Log'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddSupplyLog;
