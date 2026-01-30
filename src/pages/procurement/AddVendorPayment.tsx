import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import vendorPaymentsService from '../../services/vendorPayments.service';
import vendorsService, { type Vendor } from '../../services/vendors.service';
import purchaseOrdersService, { type PurchaseOrder } from '../../services/purchaseOrders.service';
import { Alert, showAlert, ImageUpload } from '../../components/common';

interface VendorPaymentForm {
  vendor_unique_id: string;
  purchase_order_unique_id: string;
  payment_date: string;
  amount_paid: number;
  payment_method: string;
  receipt_reference: string;
  notes: string;
  receipt_image: string;
  receipt_image_public_id: string;
}

const AddVendorPayment = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const accessIds = getAccessIds('procurement-vendor-management', 'vendor-payments');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VendorPaymentForm>({
    defaultValues: {
      vendor_unique_id: '',
      purchase_order_unique_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: 0,
      payment_method: '',
      receipt_reference: '',
      notes: '',
      receipt_image: '',
      receipt_image_public_id: '',
    },
  });

  const receiptImage = watch('receipt_image');

  const handleImageChange = (url: string, publicId: string) => {
    setValue('receipt_image', url);
    setValue('receipt_image_public_id', publicId);
  };

  const handleImageError = (errorMsg: string) => {
    setError(errorMsg);
    showAlert('error-alert');
  };

  const watchVendor = watch('vendor_unique_id');

  const fetchVendors = useCallback(async () => {
    try {
      const response = await vendorsService.getVendorsForDropdown();

      if (response.success && response.data && 'rows' in response.data) {
        setVendors(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const response = await purchaseOrdersService.getPurchaseOrdersForDropdown();

      if (response.success && response.data) {
        const orders = Array.isArray(response.data) ? response.data : response.data.rows || [];
        setPurchaseOrders(orders);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await Promise.all([fetchVendors(), fetchPurchaseOrders()]);
      setLoadingData(false);
    };
    loadData();
  }, [fetchVendors, fetchPurchaseOrders]);

  const filteredOrders = watchVendor
    ? purchaseOrders.filter((po) => po.vendor_unique_id === watchVendor && po.payment_status !== 'paid')
    : [];

  const onSubmit = async (data: VendorPaymentForm) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        vendor_unique_id: data.vendor_unique_id,
        purchase_order_unique_id: data.purchase_order_unique_id || undefined,
        payment_date: data.payment_date,
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        receipt_reference: data.receipt_reference || undefined,
        notes: data.notes || undefined,
        receipt_image: data.receipt_image || undefined,
        receipt_image_public_id: data.receipt_image_public_id || undefined,
      };

      const response = await vendorPaymentsService.addVendorPayment(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Payment recorded successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/payments');
        }, 1500);
      } else {
        setError(response.message || 'Failed to record payment');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to record payment'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <Navbar title="Record Payment" subtitle="Record a payment to vendor" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Record Payment" subtitle="Record a payment to vendor" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the payment details below. Fields marked with * are required.</p>
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
                <label htmlFor="purchase_order_unique_id">Purchase Order (Optional)</label>
                <select
                  id="purchase_order_unique_id"
                  {...register('purchase_order_unique_id')}
                  disabled={!watchVendor}
                >
                  <option value="">--None--</option>
                  {filteredOrders.map((po) => (
                    <option key={po.unique_id} value={po.unique_id}>
                      {po.reference} — {formatCurrency(po.total_amount)} (Bal: {formatCurrency(po.balance_due)})
                    </option>
                  ))}
                </select>
                {!watchVendor && (
                  <span className="xui-font-sz-80 xui-opacity-5">Select a vendor first to see their purchase orders</span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="payment_date">Payment Date *</label>
                <input
                  type="date"
                  id="payment_date"
                  {...register('payment_date', { required: 'Payment date is required' })}
                  className={errors.payment_date ? 'xui-bdr-red' : ''}
                />
                {errors.payment_date && <span className="xui-font-sz-80 xui-text-red">{errors.payment_date.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="amount_paid">Amount (₦) *</label>
                <input
                  type="number"
                  id="amount_paid"
                  step="0.01"
                  min="0"
                  {...register('amount_paid', {
                    required: 'Amount is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Amount cannot be negative' },
                  })}
                  className={errors.amount_paid ? 'xui-bdr-red' : ''}
                  placeholder="Enter payment amount"
                />
                {errors.amount_paid && <span className="xui-font-sz-80 xui-text-red">{errors.amount_paid.message}</span>}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="payment_method">Payment Method *</label>
                <select
                  id="payment_method"
                  {...register('payment_method', { required: 'Payment method is required' })}
                  className={errors.payment_method ? 'xui-bdr-red' : ''}
                >
                  <option value="" disabled>--Select payment method--</option>
                  <option value="Cash">Cash</option>
                  <option value="Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="POS">POS</option>
                </select>
                {errors.payment_method && <span className="xui-font-sz-80 xui-text-red">{errors.payment_method.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="receipt_reference">Receipt Reference</label>
                <input
                  type="text"
                  id="receipt_reference"
                  {...register('receipt_reference')}
                  placeholder="Enter reference/transaction number"
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes"
                  rows={4}
                />
              </div>

              <ImageUpload
                value={receiptImage}
                onChange={handleImageChange}
                onError={handleImageError}
                label="Receipt Image"
                folder="jafanerp/vendor-payments"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-half"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Recording Payment...' : 'Record Payment'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddVendorPayment;
