import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage } from '../../utils/formatters';
import fuelPurchasesService from '../../services/fuelPurchases.service';
import vendorsService, { type Vendor } from '../../services/vendors.service';
import { Alert, showAlert } from '../../components/common';

interface FuelPurchaseForm {
  vendor_unique_id: string;
  fuel_type: string;
  liters_purchased: number;
  purchase_date: string;
  notes: string;
}

const AddFuelPurchase = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const accessIds = getAccessIds('procurement-vendor-management', 'fuel-purchases');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const vendorAccessIds = getAccessIds('procurement-vendor-management', 'vendors');
  const vendorModuleId = vendorAccessIds?.module_unique_id;
  const vendorSubModuleId = vendorAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FuelPurchaseForm>({
    defaultValues: {
      vendor_unique_id: '',
      fuel_type: '',
      liters_purchased: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

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

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await fetchVendors();
      setLoadingData(false);
    };
    loadData();
  }, [fetchVendors]);

  const onSubmit = async (data: FuelPurchaseForm) => {
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
        fuel_type: data.fuel_type,
        liters_purchased: data.liters_purchased,
        purchase_date: data.purchase_date,
        notes: data.notes || undefined,
      };

      const response = await fuelPurchasesService.addFuelPurchase(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Fuel purchase recorded successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/fuel');
        }, 1500);
      } else {
        setError(response.message || 'Failed to record fuel purchase');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to record fuel purchase'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <Navbar title="Record Fuel Purchase" subtitle="Record a fuel purchase" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Record Fuel Purchase" subtitle="Record a fuel purchase" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the fuel purchase details below. Price and total cost are automatically calculated. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="vendor_unique_id">Fuel Vendor *</label>
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
                <label htmlFor="fuel_type">Fuel Type *</label>
                <select
                  id="fuel_type"
                  {...register('fuel_type', { required: 'Fuel type is required' })}
                  className={errors.fuel_type ? 'xui-bdr-red' : ''}
                >
                  <option value="" disabled>--Select fuel type--</option>
                  <option value="Diesel">Diesel (AGO)</option>
                  <option value="Petrol">Petrol (PMS)</option>
                </select>
                {errors.fuel_type && <span className="xui-font-sz-80 xui-text-red">{errors.fuel_type.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="liters_purchased">Quantity (Litres) *</label>
                <input
                  type="number"
                  id="liters_purchased"
                  step="0.01"
                  min="0"
                  {...register('liters_purchased', {
                    required: 'Quantity is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Quantity cannot be negative' },
                  })}
                  className={errors.liters_purchased ? 'xui-bdr-red' : ''}
                  placeholder="Enter quantity in litres"
                />
                {errors.liters_purchased && <span className="xui-font-sz-80 xui-text-red">{errors.liters_purchased.message}</span>}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="purchase_date">Purchase Date *</label>
                <input
                  type="date"
                  id="purchase_date"
                  {...register('purchase_date', { required: 'Purchase date is required' })}
                  className={errors.purchase_date ? 'xui-bdr-red' : ''}
                />
                {errors.purchase_date && <span className="xui-font-sz-80 xui-text-red">{errors.purchase_date.message}</span>}
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-half"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Recording Purchase...' : 'Record Fuel Purchase'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddFuelPurchase;
