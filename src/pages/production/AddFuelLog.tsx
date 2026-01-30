import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import productionFuelLogsService from '../../services/productionFuelLogs.service';
import type { MachineOption } from '../../services/productionFuelLogs.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FuelLogFormData {
  fuel_type: string;
  liters_dispensed: string;
  destination: string;
  dispensed_date: string;
  machine_unique_id: string;
  notes: string;
}

const AddFuelLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('production-quality-control', 'production-fuel-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FuelLogFormData>({
    defaultValues: {
      fuel_type: '',
      liters_dispensed: '',
      destination: '',
      dispensed_date: new Date().toISOString().split('T')[0],
      machine_unique_id: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        const response = await productionFuelLogsService.getMachines();
        if (response.success && response.data) {
          setMachines(response.data.rows || []);
        }
      } catch (err: any) {
        console.log('Failed to load machines:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [moduleId, subModuleId]);

  const onSubmit = async (data: FuelLogFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fuel_type: data.fuel_type,
        liters_dispensed: Number(data.liters_dispensed),
        destination: data.destination,
        dispensed_date: data.dispensed_date,
        ...(data.machine_unique_id && { machine_unique_id: data.machine_unique_id }),
        ...(data.notes && { notes: data.notes }),
      };

      const response = await productionFuelLogsService.addFuelLog(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Fuel log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/fuel');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add fuel log');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add fuel log'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Dispense Fuel" subtitle="Record fuel dispensed for production" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Dispense Fuel" subtitle="Record fuel dispensed for production" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the fuel dispensing details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="fuel_type">Fuel Type *</label>
                <select
                  id="fuel_type"
                  {...register('fuel_type', { required: 'Fuel type is required' })}
                >
                  <option value="">--Select fuel type--</option>
                  <option value="Diesel">Diesel (AGO)</option>
                  <option value="Petrol">Petrol (PMS)</option>
                </select>
                {errors.fuel_type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.fuel_type.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="liters_dispensed">Liters Dispensed *</label>
                <input
                  type="number"
                  id="liters_dispensed"
                  placeholder="Enter liters dispensed"
                  min="0.01"
                  step="any"
                  {...register('liters_dispensed', {
                    required: 'Liters dispensed is required',
                    min: { value: 0.01, message: 'Liters dispensed must be greater than 0' },
                  })}
                />
                {errors.liters_dispensed && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.liters_dispensed.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="destination">Destination *</label>
                <input
                  type="text"
                  id="destination"
                  placeholder="Enter destination (e.g. Main Generator, Machine 3)"
                  {...register('destination', {
                    required: 'Destination is required',
                    minLength: { value: 1, message: 'Destination is required' },
                    maxLength: { value: 100, message: 'Destination must be less than 100 characters' },
                  })}
                />
                {errors.destination && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.destination.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="dispensed_date">Dispensed Date *</label>
                <input
                  type="date"
                  id="dispensed_date"
                  {...register('dispensed_date', { required: 'Dispensed date is required' })}
                />
                {errors.dispensed_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.dispensed_date.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="machine_unique_id">Machine (Optional)</label>
                <select
                  id="machine_unique_id"
                  {...register('machine_unique_id')}
                >
                  <option value="">--No machine--</option>
                  {machines.map((machine) => (
                    <option key={machine.unique_id} value={machine.unique_id}>
                      {machine.name} ({machine.code}) - {machine.fuel_type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Enter any additional notes (optional)"
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Recording Fuel Dispensing...' : 'Record Fuel Dispensing'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddFuelLog;
