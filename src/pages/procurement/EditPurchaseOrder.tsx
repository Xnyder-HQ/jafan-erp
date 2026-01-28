import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import purchaseOrdersService, { type PurchaseOrder } from '../../services/purchaseOrders.service';
import rawMaterialsService, { type RawMaterial } from '../../services/rawMaterials.service';
import { Alert, showAlert } from '../../components/common';

interface PurchaseOrderFormData {
  po_type: string;
  total_amount: number;
  order_date: string;
  expected_delivery_date: string;
  raw_material_unique_id: string;
  quantity: number;
  notes: string;
}

const EditPurchaseOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const accessIds = getAccessIds('procurement-vendor-management', 'purchase-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const rawMaterialAccessIds = getAccessIds('inventory-stock-management', 'raw-materials');
  const rawMaterialModuleId = rawMaterialAccessIds?.module_unique_id;
  const rawMaterialSubModuleId = rawMaterialAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    defaultValues: {
      po_type: '',
      total_amount: 0,
      order_date: '',
      expected_delivery_date: '',
      raw_material_unique_id: '',
      quantity: 0,
      notes: '',
    },
  });

  const watchRawMaterial = watch('raw_material_unique_id');

  const fetchRawMaterials = useCallback(async () => {
    if (!rawMaterialModuleId || !rawMaterialSubModuleId) return;

    try {
      const response = await rawMaterialsService.getRawMaterials({
        page: 1,
        size: 100,
        module_unique_id: rawMaterialModuleId,
        sub_module_unique_id: rawMaterialSubModuleId,
      });

      if (response.success && response.data && 'rows' in response.data) {
        setRawMaterials(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch raw materials:', err);
    }
  }, [rawMaterialModuleId, rawMaterialSubModuleId]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!moduleId || !subModuleId || !id) {
        setError('Unable to load purchase order');
        setLoadingOrder(false);
        return;
      }

      try {
        const [orderResponse] = await Promise.all([
          purchaseOrdersService.getPurchaseOrder(id, {
            module_unique_id: moduleId,
            sub_module_unique_id: subModuleId,
          }),
          fetchRawMaterials(),
        ]);

        if (orderResponse.success && orderResponse.data) {
          const po = orderResponse.data;
          setOrder(po);
          reset({
            po_type: po.po_type || '',
            total_amount: po.total_amount || 0,
            order_date: po.order_date ? new Date(po.order_date).toISOString().split('T')[0] : '',
            expected_delivery_date: po.expected_delivery_date ? new Date(po.expected_delivery_date).toISOString().split('T')[0] : '',
            raw_material_unique_id: po.raw_material_unique_id || '',
            quantity: po.quantity || 0,
            notes: po.notes || '',
          });
        } else {
          setError('Purchase order not found');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch purchase order'));
        showAlert('error-alert');
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [moduleId, subModuleId, id, reset, fetchRawMaterials]);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (!moduleId || !subModuleId || !id || !order) {
      setError('Unable to update purchase order');
      showAlert('error-alert');
      return;
    }

    if (data.raw_material_unique_id && (!data.quantity || data.quantity <= 0)) {
      setError('Quantity is required when a raw material is selected');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      };

      const updatePromises: Promise<{ success: boolean; message: string }>[] = [];

      if (data.po_type !== order.po_type) {
        updatePromises.push(
          purchaseOrdersService.updatePOType(id, data.po_type, params)
        );
      }
      const originalOrderDate = order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '';
      const originalDeliveryDate = order.expected_delivery_date ? new Date(order.expected_delivery_date).toISOString().split('T')[0] : '';
      if (data.order_date !== originalOrderDate || data.expected_delivery_date !== originalDeliveryDate) {
        updatePromises.push(
          purchaseOrdersService.updateDates(id, {
            order_date: data.order_date,
            expected_delivery_date: data.expected_delivery_date || undefined,
          }, params)
        );
      }
      if (data.total_amount !== order.total_amount) {
        updatePromises.push(
          purchaseOrdersService.updateTotalAmount(id, data.total_amount, params)
        );
      }
      const originalRawMaterial = order.raw_material_unique_id || '';
      const originalQuantity = order.quantity || 0;
      if (data.raw_material_unique_id !== originalRawMaterial || data.quantity !== originalQuantity) {
        updatePromises.push(
          purchaseOrdersService.updateRawMaterial(id, {
            raw_material_unique_id: data.raw_material_unique_id || undefined,
            quantity: data.raw_material_unique_id ? data.quantity : undefined,
          }, params)
        );
      }
      const originalNotes = order.notes || '';
      if (data.notes !== originalNotes) {
        updatePromises.push(
          purchaseOrdersService.updateNotes(id, data.notes, params)
        );
      }

      if (updatePromises.length === 0) {
        setError('No changes detected');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const settled = await Promise.allSettled(updatePromises);
      if (settled.every(r => r.status === 'rejected')) {
        const firstRejected = settled.find((r): r is PromiseRejectedResult => r.status === 'rejected');
        throw firstRejected?.reason || new Error('Failed to update purchase order');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Purchase order updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/orders');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update purchase order'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrder) {
    return (
      <div>
        <Navbar title="Edit Purchase Order" subtitle="Update purchase order details" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Navbar title="Edit Purchase Order" subtitle="Update purchase order details" />
        <div className="xui-py-1">
          <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          <div className="xui-py-3 xui-text-center">
            <p className="xui-opacity-5">{error || 'Purchase order not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Purchase Order" subtitle="Update purchase order details" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>
        <div className="xui-bg-white xui-bdr-rad-half xui-p-1-half xui-mb-2" style={{ border: '1px solid var(--neutral-200)' }}>
          <p className="xui-font-sz-90 xui-font-w-bold xui-mb-1">Order Summary</p>
          <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1">
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Reference</p>
              <p className="xui-font-w-500">{order.reference}</p>
            </div>
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Vendor</p>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                <p className="xui-font-w-500">{order.Vendor?.name || 'N/A'}</p>
                {order.Vendor?.unique_id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/procurement/vendors/edit/${order.Vendor?.unique_id}`)}
                    className="xui-btn xui-font-sz-70 xui-py-half xui-px-half xui-bdr-rad-half"
                    style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', border: 'none' }}
                  >
                    View
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Order Status</p>
              <p className="xui-font-w-500">{order.order_status}</p>
            </div>
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Payment</p>
              <p className="xui-font-w-500">
                {formatCurrency(order.amount_paid)} paid / {formatCurrency(order.balance_due)} due
              </p>
            </div>
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Created By</p>
              <p className="xui-font-w-500">
                {order.User ? `${order.User.firstname} ${order.User.lastname}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="xui-font-sz-80 xui-opacity-5">Created</p>
              <p className="xui-font-w-500">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the purchase order details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="po_type">PO Type *</label>
                <select
                  id="po_type"
                  {...register('po_type', { required: 'PO type is required' })}
                  className={errors.po_type ? 'xui-bdr-red' : ''}
                >
                  <option value="" disabled>--Select PO type--</option>
                  <option value="Cement">Cement</option>
                  <option value="General">General</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                {errors.po_type && <span className="xui-font-sz-80 xui-text-red">{errors.po_type.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="total_amount">Total Amount *</label>
                <input
                  type="number"
                  id="total_amount"
                  step="0.01"
                  min="0"
                  {...register('total_amount', {
                    required: 'Total amount is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Amount cannot be negative' },
                  })}
                  className={errors.total_amount ? 'xui-bdr-red' : ''}
                  placeholder="Enter total amount"
                />
                {errors.total_amount && <span className="xui-font-sz-80 xui-text-red">{errors.total_amount.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="order_date">Order Date *</label>
                <input
                  type="date"
                  id="order_date"
                  {...register('order_date', { required: 'Order date is required' })}
                  className={errors.order_date ? 'xui-bdr-red' : ''}
                />
                {errors.order_date && <span className="xui-font-sz-80 xui-text-red">{errors.order_date.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="expected_delivery_date">Expected Delivery Date</label>
                <input
                  type="date"
                  id="expected_delivery_date"
                  {...register('expected_delivery_date')}
                />
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="raw_material_unique_id">Raw Material</label>
                <select
                  id="raw_material_unique_id"
                  {...register('raw_material_unique_id')}
                >
                  <option value="">--None--</option>
                  {rawMaterials.map((material) => (
                    <option key={material.unique_id} value={material.unique_id}>
                      {material.name} {material.unit_of_measure ? `(${material.unit_of_measure})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {watchRawMaterial && (
                <div className="xui-form-box">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    step="0.01"
                    min="0"
                    {...register('quantity', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Quantity cannot be negative' },
                    })}
                    className={errors.quantity ? 'xui-bdr-red' : ''}
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && <span className="xui-font-sz-80 xui-text-red">{errors.quantity.message}</span>}
                </div>
              )}

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-half"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Order...' : 'Update Purchase Order'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditPurchaseOrder;
