import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import logisticsFuelLogsService from '../../services/logisticsFuelLogs.service';
import vehiclesService from '../../services/vehicles.service';
import type { Vehicle } from '../../services/vehicles.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FuelLogFormData {
  vehicle_unique_id: string;
  fuel_type: string;
  liters_dispensed: string;
  actual_trips: string;
  dispense_date: string;
  notes: string;
}

const AddLogisticsFuelLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('logistics-supply-chain', 'logistics-fuel-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const now = new Date();
  const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FuelLogFormData>({
    defaultValues: {
      vehicle_unique_id: '',
      fuel_type: '',
      liters_dispensed: '',
      actual_trips: '',
      dispense_date: defaultDateTime,
      notes: '',
    },
  });

  const selectedVehicleId = watch('vehicle_unique_id');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await vehiclesService.getVehiclesForDropdown();

        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setVehicles((rows || []).filter((v: Vehicle) => v.is_active));
        }
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setValue('fuel_type', '');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.unique_id === selectedVehicleId);
    if (selectedVehicle?.fuel_type) {
      setValue('fuel_type', selectedVehicle.fuel_type.toLowerCase());
    }
  }, [selectedVehicleId, vehicles, setValue]);

  const onSubmit = async (data: FuelLogFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dispenseDate = data.dispense_date.replace('T', ' ');

      const response = await logisticsFuelLogsService.addLogisticsFuelLog(
        {
          vehicle_unique_id: data.vehicle_unique_id,
          fuel_type: data.fuel_type || undefined,
          liters_dispensed: Number(data.liters_dispensed),
          actual_trips: Number(data.actual_trips),
          dispense_date: dispenseDate,
          ...(data.notes && { notes: data.notes }),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Fuel log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/logistics/fuel');
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

  const selectedVehicle = vehicles.find(v => v.unique_id === selectedVehicleId);

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Dispense Fuel" subtitle="Record a fuel dispense entry" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Dispense Fuel" subtitle="Record a fuel dispense entry" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the details below to log a fuel dispense. This will deduct fuel from raw material stock and create a stock log entry.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="vehicle_unique_id">Vehicle *</label>
                <select
                  id="vehicle_unique_id"
                  {...register('vehicle_unique_id', { required: 'Vehicle is required' })}
                >
                  <option value="">--Select vehicle--</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.unique_id} value={vehicle.unique_id}>
                      {vehicle.plate_number} — {vehicle.code} ({vehicle.fuel_type})
                    </option>
                  ))}
                </select>
                {errors.vehicle_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.vehicle_unique_id.message}
                  </span>
                )}
              </div>

              {selectedVehicle && (
                <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
                  <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Vehicle Details</p>
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-half xui-font-sz-80">
                    <span className="xui-opacity-6">Type:</span>
                    <span className="xui-font-w-500">{selectedVehicle.type}</span>
                    <span className="xui-opacity-6">Fuel Type:</span>
                    <span className="xui-font-w-500">{selectedVehicle.fuel_type}</span>
                    <span className="xui-opacity-6">Benchmark Fuel:</span>
                    <span className="xui-font-w-500">{selectedVehicle.benchmark_fuel_liters}L</span>
                    <span className="xui-opacity-6">Expected Trips/Benchmark:</span>
                    <span className="xui-font-w-500">{selectedVehicle.expected_trips_per_benchmark}</span>
                  </div>
                </div>
              )}

              <div className="xui-form-box">
                <label htmlFor="fuel_type">Fuel Type</label>
                <select
                  id="fuel_type"
                  {...register('fuel_type')}
                  disabled={!!selectedVehicle}
                >
                  <option value="">--Auto-detected from vehicle--</option>
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                </select>
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  Fuel type is automatically set based on the selected vehicle
                </small>
              </div>

              <div className="xui-form-box">
                <label htmlFor="dispense_date">Dispense Date & Time *</label>
                <input
                  type="datetime-local"
                  id="dispense_date"
                  {...register('dispense_date', { required: 'Dispense date is required' })}
                />
                {errors.dispense_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.dispense_date.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="liters_dispensed">Liters Dispensed *</label>
                <input
                  type="number"
                  id="liters_dispensed"
                  placeholder="Enter liters of fuel dispensed"
                  min="0"
                  step="any"
                  {...register('liters_dispensed', {
                    required: 'Liters dispensed is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.liters_dispensed && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.liters_dispensed.message}
                  </span>
                )}
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  This amount will be deducted from the raw material fuel stock
                </small>
              </div>

              <div className="xui-form-box">
                <label htmlFor="actual_trips">Actual Trips *</label>
                <input
                  type="number"
                  id="actual_trips"
                  placeholder="Enter actual number of trips made"
                  min="0"
                  step="any"
                  {...register('actual_trips', {
                    required: 'Actual trips is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {errors.actual_trips && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.actual_trips.message}
                  </span>
                )}
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  Expected trips will be calculated from vehicle benchmark data
                </small>
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Additional notes (optional)"
                  rows={3}
                  {...register('notes', {
                    minLength: { value: 2, message: 'Notes must be at least 2 characters' },
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
            {loading ? 'Recording Fuel Dispense...' : 'Record Fuel Dispense'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddLogisticsFuelLog;
