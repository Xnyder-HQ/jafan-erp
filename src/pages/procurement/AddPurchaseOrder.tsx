import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage } from '../../utils/formatters';
import purchaseOrdersService from '../../services/purchaseOrders.service';
import vendorsService, { type Vendor } from '../../services/vendors.service';
import rawMaterialsService, { type RawMaterial } from '../../services/rawMaterials.service';
import { Alert, showAlert } from '../../components/common';

interface PurchaseOrderForm {
  vendor_unique_id: string;
  po_type: string;
  total_amount: number;
  order_date: string;
  expected_delivery_date: string;
  raw_material_unique_id: string;
  quantity: number;
  notes: string;
}

const AddPurchaseOrder = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const accessIds = getAccessIds('procurement-vendor-management', 'purchase-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const vendorAccessIds = getAccessIds('procurement-vendor-management', 'vendors');
  const vendorModuleId = vendorAccessIds?.module_unique_id;
  const vendorSubModuleId = vendorAccessIds?.sub_module_unique_id;

  const rawMaterialAccessIds = getAccessIds('inventory-stock-management', 'raw-materials');
  const rawMaterialModuleId = rawMaterialAccessIds?.module_unique_id;
  const rawMaterialSubModuleId = rawMaterialAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderForm>({
    defaultValues: {
      vendor_unique_id: '',
      po_type: '',
      total_amount: 0,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      raw_material_unique_id: '',
      quantity: 0,
      notes: '',
    },
  });

  const watchRawMaterial = watch('raw_material_unique_id');

  const fetchVendors = useCallback(async () => {
    if (!vendorModuleId || !vendorSubModuleId) return;

    try {
      const response = await vendorsService.getVendors({
        page: 1,
        size: 100,
        module_unique_id: vendorModuleId,
        sub_module_unique_id: vendorSubModuleId,
      });

      if (response.success && response.data && 'rows' in response.data) {
        setVendors(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, [vendorModuleId, vendorSubModuleId]);

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
    const loadData = async () => {
      setLoadingData(true);
      await Promise.all([fetchVendors(), fetchRawMaterials()]);
      setLoadingData(false);
    };
    loadData();
  }, [fetchVendors, fetchRawMaterials]);

  const onSubmit = async (data: PurchaseOrderForm) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
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
      const payload = {
        vendor_unique_id: data.vendor_unique_id,
        po_type: data.po_type,
        total_amount: data.total_amount,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date || undefined,
        raw_material_unique_id: data.raw_material_unique_id || undefined,
        quantity: data.raw_material_unique_id ? data.quantity : undefined,
        notes: data.notes || undefined,
      };

      const response = await purchaseOrdersService.addPurchaseOrder(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Purchase order created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/orders');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create purchase order');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create purchase order'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <Navbar title="Create Purchase Order" subtitle="Create a new purchase order" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Create Purchase Order" subtitle="Create a new purchase order" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the purchase order details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="vendor_unique_id">Vendor *</label>
                <select
                  id="vendor_unique_id"
                  {...register('vendor_unique_id', { required: 'Vendor is required' })}
                  className={errors.vendor_unique_id ? 'xui-bdr-red' : ''}
                >
                  <option value="" disabled>--Select vendor--</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.unique_id} value={vendor.unique_id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendor_unique_id && <span className="xui-font-sz-80 xui-text-red">{errors.vendor_unique_id.message}</span>}
              </div>

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
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="expected_delivery_date">Expected Delivery Date</label>
                <input
                  type="date"
                  id="expected_delivery_date"
                  {...register('expected_delivery_date')}
                />
              </div>

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
            {loading ? 'Creating Order...' : 'Create Purchase Order'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddPurchaseOrder;
