import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import fuelPurchasesService from '../../services/fuelPurchases.service';
import type { FuelPurchase } from '../../services/fuelPurchases.service';
import rawMaterialsService, { type RawMaterial } from '../../services/rawMaterials.service';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/formatters';

interface FuelPurchaseFormData {
  fuel_type: string;
  liters_purchased: string;
  purchase_date: string;
  delivery_status: string;
  raw_material_unique_id: string;
  notes: string;
}

const EditFuelPurchase = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalPurchase, setOriginalPurchase] = useState<FuelPurchase | null>(null);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const accessIds = getAccessIds('procurement-vendor-management', 'fuel-purchases');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const rawMaterialAccessIds = getAccessIds('inventory-stock-management', 'raw-materials');
  const rawMaterialModuleId = rawMaterialAccessIds?.module_unique_id;
  const rawMaterialSubModuleId = rawMaterialAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FuelPurchaseFormData>({
    defaultValues: {
      fuel_type: '',
      liters_purchased: '',
      purchase_date: '',
      delivery_status: '',
      raw_material_unique_id: '',
      notes: '',
    },
  });

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
    if (!moduleId) {
      setLoadingPurchase(false);
      return;
    }

    const fetchPurchase = async () => {
      if (!id) {
        setLoadingPurchase(false);
        return;
      }

      try {
        const [response] = await Promise.all([
          fuelPurchasesService.getFuelPurchase(id, {
            module_unique_id: moduleId,
            sub_module_unique_id: subModuleId,
          }),
          fetchRawMaterials(),
        ]);

        if (response.success && response.data) {
          const purchase = response.data;
          setOriginalPurchase(purchase);
          reset({
            fuel_type: purchase.fuel_type || '',
            liters_purchased: purchase.liters_purchased.toString(),
            purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
            delivery_status: purchase.delivery_status || 'Pending',
            raw_material_unique_id: purchase.raw_material_unique_id || '',
            notes: purchase.notes || '',
          });
        } else {
          setError('Fuel purchase not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch fuel purchase'));
        showAlert('error-alert');
      } finally {
        setLoadingPurchase(false);
      }
    };

    fetchPurchase();
  }, [moduleId, subModuleId, id, reset, fetchRawMaterials]);

  const isUnpaid = originalPurchase?.payment_status?.toLowerCase() === 'unpaid';
  const isNotPaid = originalPurchase?.payment_status?.toLowerCase() !== 'paid';

  const onSubmit = async (data: FuelPurchaseFormData) => {
    if (!accessIds || !id || !originalPurchase) {
      setError('Unable to update fuel purchase');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const params = {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      };

      const updatePromises: Promise<{ success: boolean; message: string }>[] = [];

      if (isUnpaid && data.fuel_type !== originalPurchase.fuel_type) {
        updatePromises.push(
          fuelPurchasesService.updateFuelType(id, data.fuel_type, params)
        );
      }

      if (isUnpaid && Number(data.liters_purchased) !== originalPurchase.liters_purchased) {
        updatePromises.push(
          fuelPurchasesService.updateLiters(id, Number(data.liters_purchased), params)
        );
      }
      const originalDate = originalPurchase.purchase_date ? originalPurchase.purchase_date.split('T')[0] : '';
      if (isNotPaid && data.purchase_date !== originalDate) {
        updatePromises.push(
          fuelPurchasesService.updatePurchaseDate(id, data.purchase_date, params)
        );
      }

      const originalRawMaterial = originalPurchase.raw_material_unique_id || '';
      if (data.raw_material_unique_id !== originalRawMaterial && originalPurchase.delivery_status !== 'Delivered') {
        updatePromises.push(
          fuelPurchasesService.updateRawMaterial(id, data.raw_material_unique_id, params)
        );
      }

      if (data.delivery_status !== originalPurchase.delivery_status && originalPurchase.delivery_status !== 'Delivered') {
        updatePromises.push(
          fuelPurchasesService.updateDeliveryStatus(id, data.delivery_status, params)
        );
      }

      if (data.notes !== (originalPurchase.notes || '')) {
        updatePromises.push(
          fuelPurchasesService.updateNotes(id, data.notes, params)
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
        throw firstRejected?.reason || new Error('Failed to update fuel purchase');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Fuel purchase updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/fuel');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update fuel purchase'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPurchase = async () => {
    if (!accessIds || !id) {
      return { success: false, message: 'Unable to process payment' };
    }
    return fuelPurchasesService.payFuelPurchase(id, {
      module_unique_id: accessIds.module_unique_id,
      sub_module_unique_id: accessIds.sub_module_unique_id,
    });
  };

  const handlePaySuccess = () => {
    setTimeout(() => {
      navigate('/dashboard/procurement/fuel');
    }, 1500);
  };

  if (loadingPurchase) {
    return (
      <div>
        <Navbar title="Edit Fuel Purchase" subtitle="Update fuel purchase details" />
        <div className="xui-py-1">
          <p>Loading fuel purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Fuel Purchase" subtitle="Update fuel purchase details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalPurchase && (
          <div
            className="xui-p-1 xui-bdr-rad-half xui-mb-1"
            style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
          >
            <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Purchase Details:</p>
            <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-half xui-font-sz-80" style={{ maxWidth: '400px' }}>
              <span className="xui-opacity-6">Reference:</span>
              <span className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                {originalPurchase.reference}
              </span>
              <span className="xui-opacity-6">Vendor:</span>
              <span className="xui-font-w-500">{originalPurchase.Vendor?.name || 'N/A'}</span>
              <span className="xui-opacity-6">Total Cost:</span>
              <span className="xui-font-w-500">{formatCurrency(originalPurchase.total_cost)}</span>
              <span className="xui-opacity-6">Price/Liter:</span>
              <span className="xui-font-w-500">{formatCurrency(originalPurchase.price_per_liter)}</span>
              <span className="xui-opacity-6">Payment:</span>
              <span>
                {originalPurchase.payment_status?.toLowerCase() === 'paid' ? (
                  <span className="xui-badge xui-badge-success">Paid</span>
                ) : (
                  <span className="xui-badge xui-badge-danger">Unpaid</span>
                )}
              </span>
              <span className="xui-opacity-6">Delivery:</span>
              <span>
                {originalPurchase.delivery_status?.toLowerCase() === 'delivered' ? (
                  <span className="xui-badge xui-badge-success">Delivered</span>
                ) : originalPurchase.delivery_status?.toLowerCase() === 'partially_delivered' ? (
                  <span className="xui-badge xui-badge-warning">Partially Delivered</span>
                ) : (
                  <span className="xui-badge xui-badge-default">Pending</span>
                )}
              </span>
              <span className="xui-opacity-6">Recorded:</span>
              <span className="xui-font-w-500">{formatDate(originalPurchase.createdAt)}</span>
            </div>
          </div>
        )}

        {!isUnpaid && !isNotPaid && (
          <div
            className="xui-p-1 xui-bdr-rad-half xui-mb-1"
            style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}
          >
            <p className="xui-font-sz-80">
              This fuel purchase has been fully paid. Only notes can be updated.
            </p>
          </div>
        )}

        {!isUnpaid && isNotPaid && (
          <div
            className="xui-p-1 xui-bdr-rad-half xui-mb-1"
            style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}
          >
            <p className="xui-font-sz-80">
              Some fields are restricted because this purchase is no longer unpaid. Only purchase date and notes can be updated.
            </p>
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the fuel purchase details below.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="fuel_type">Fuel Type *</label>
                <select
                  id="fuel_type"
                  disabled={!isUnpaid}
                  {...register('fuel_type', { required: 'Fuel type is required' })}
                >
                  <option value="" disabled>--Select fuel type--</option>
                  <option value="Diesel">Diesel (AGO)</option>
                  <option value="Petrol">Petrol (PMS)</option>
                </select>
                {errors.fuel_type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.fuel_type.message}
                  </span>
                )}
                {!isUnpaid && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    Fuel type can only be changed when payment is unpaid
                  </small>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="liters_purchased">Quantity (Litres) *</label>
                <input
                  type="number"
                  id="liters_purchased"
                  placeholder="Enter quantity in litres"
                  min="0"
                  step="0.01"
                  disabled={!isUnpaid}
                  {...register('liters_purchased', {
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity cannot be negative' },
                  })}
                />
                {errors.liters_purchased && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.liters_purchased.message}
                  </span>
                )}
                {!isUnpaid && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    Quantity can only be changed when payment is unpaid
                  </small>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="purchase_date">Purchase Date *</label>
                <input
                  type="date"
                  id="purchase_date"
                  disabled={!isNotPaid}
                  {...register('purchase_date', { required: 'Purchase date is required' })}
                />
                {errors.purchase_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.purchase_date.message}
                  </span>
                )}
                {!isNotPaid && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    Purchase date cannot be changed after payment
                  </small>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="raw_material_unique_id">Raw Material</label>
                <select
                  id="raw_material_unique_id"
                  disabled={originalPurchase?.delivery_status === 'Delivered'}
                  {...register('raw_material_unique_id')}
                >
                  <option value="">--None--</option>
                  {rawMaterials.map((material) => (
                    <option key={material.unique_id} value={material.unique_id}>
                      {material.name} {material.unit_of_measure ? `(${material.unit_of_measure})` : ''}
                    </option>
                  ))}
                </select>
                {originalPurchase?.delivery_status === 'Delivered' && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    Raw material cannot be changed once delivered
                  </small>
                )}
                {originalPurchase?.delivery_status !== 'Delivered' && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    A raw material must be assigned before marking as delivered
                  </small>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="delivery_status">Delivery Status *</label>
                <select
                  id="delivery_status"
                  disabled={originalPurchase?.delivery_status === 'Delivered'}
                  {...register('delivery_status', { required: 'Delivery status is required' })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Delivered">Partially Delivered</option>
                  <option value="Delivered">Delivered</option>
                </select>
                {errors.delivery_status && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.delivery_status.message}
                  </span>
                )}
                {originalPurchase?.delivery_status === 'Delivered' && (
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    Delivery status cannot be changed once delivered
                  </small>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Additional notes"
                  rows={5}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mt-1">
            <button
              type="submit"
              disabled={loading}
              className="xui-btn xui-bdr-rad-[4px]"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              {loading ? 'Updating Purchase...' : 'Update Fuel Purchase'}
            </button>
            {isUnpaid && (
              <button
                type="button"
                onClick={() => modalShow('pay-fuel-purchase-modal')}
                disabled={loading}
                className="xui-btn xui-bdr-rad-[4px]"
                style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              >
                Mark as Paid
              </button>
            )}
          </div>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="pay-fuel-purchase-modal"
        title="Mark as Paid"
        message={`Are you sure you want to mark this fuel purchase as paid? This will record an expense of ${originalPurchase ? formatCurrency(originalPurchase.total_cost) : ''} and update the vendor's total spend. This action cannot be undone`}
        itemName={originalPurchase?.reference}
        confirmText="Mark as Paid"
        confirmingText="Processing Payment..."
        confirmButtonStyle="success"
        onConfirm={handlePayPurchase}
        onSuccess={handlePaySuccess}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default EditFuelPurchase;
