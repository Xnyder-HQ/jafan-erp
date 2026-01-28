import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import vehiclesService from '../../services/vehicles.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface VehicleFormData {
  code: string;
  plate_number: string;
  type: string;
  fuel_type: string;
  purchase_date: string;
  capacity_unit: string;
  capacity_value: string;
  benchmark_fuel_liters: string;
  expected_trips_per_benchmark: string;
  availability_status: string;
  notes: string;
  is_active: string;
}

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('administration', 'vehicles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    defaultValues: {
      code: '',
      plate_number: '',
      type: '',
      fuel_type: '',
      purchase_date: '',
      capacity_unit: '',
      capacity_value: '',
      benchmark_fuel_liters: '',
      expected_trips_per_benchmark: '',
      availability_status: 'Available',
      notes: '',
      is_active: 'true',
    },
  });

  useEffect(() => {
    if (!moduleId || !id) {
      setFetching(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const response = await vehiclesService.getVehicle(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const vehicle = response.data;
          reset({
            code: vehicle.code,
            plate_number: vehicle.plate_number,
            type: vehicle.type,
            fuel_type: vehicle.fuel_type,
            purchase_date: vehicle.purchase_date ? vehicle.purchase_date.split('T')[0] : '',
            capacity_unit: vehicle.capacity_unit,
            capacity_value: vehicle.capacity_value?.toString() || '',
            benchmark_fuel_liters: vehicle.benchmark_fuel_liters?.toString() || '',
            expected_trips_per_benchmark: vehicle.expected_trips_per_benchmark?.toString() || '',
            availability_status: vehicle.availability_status,
            notes: vehicle.notes || '',
            is_active: vehicle.is_active ? 'true' : 'false',
          });
        } else {
          setError('Vehicle not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to load vehicle'));
        showAlert('error-alert');
      } finally {
        setFetching(false);
      }
    };

    fetchVehicle();
  }, [moduleId, subModuleId, id, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    if (!accessIds || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const params = {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      };

      const results = await Promise.allSettled([
        vehiclesService.updateVehicleDetails({
          unique_id: id,
          code: data.code,
          plate_number: data.plate_number,
          type: data.type,
          fuel_type: data.fuel_type,
          ...(data.purchase_date && { purchase_date: data.purchase_date }),
        }, params),
        vehiclesService.updateVehicleOtherDetails({
          unique_id: id,
          capacity_unit: data.capacity_unit,
          capacity_value: Number(data.capacity_value),
          benchmark_fuel_liters: Number(data.benchmark_fuel_liters),
          expected_trips_per_benchmark: Number(data.expected_trips_per_benchmark),
        }, params),
        vehiclesService.updateAvailabilityStatus({
          unique_id: id,
          availability_status: data.availability_status,
        }, params),
        vehiclesService.updateVehicleNotes({
          unique_id: id,
          notes: data.notes || undefined,
        }, params),
        vehiclesService.toggleVehicle({
          unique_id: id,
          is_active: data.is_active === 'true',
        }, params),
      ]);

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.length === results.length) {
        throw failures[0]?.reason || new Error('Failed to update vehicle');
      }

      setSuccessMessage('Vehicle updated successfully');
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/users/vehicles');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update vehicle'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar title="Edit Vehicle" subtitle="Update vehicle details" />
        <div className="xui-py-1">
          <p>Loading vehicle...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Vehicle" subtitle="Update vehicle details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the vehicle details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="code">Vehicle Code *</label>
                <input
                  type="text"
                  id="code"
                  placeholder="Enter vehicle code"
                  {...register('code', {
                    required: 'Vehicle code is required',
                  })}
                />
                {errors.code && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.code.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="plate_number">Plate Number *</label>
                <input
                  type="text"
                  id="plate_number"
                  placeholder="Enter plate number"
                  {...register('plate_number', {
                    required: 'Plate number is required',
                  })}
                />
                {errors.plate_number && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.plate_number.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="type">Vehicle Type *</label>
                <select id="type" {...register('type', { required: 'Vehicle type is required' })}>
                  <option value="">--Select vehicle type--</option>
                  <option value="Block Truck">Block Truck</option>
                  <option value="Tipper">Tipper</option>
                  <option value="Water Tanker">Water Tanker</option>
                </select>
                {errors.type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.type.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="fuel_type">Fuel Type *</label>
                <select id="fuel_type" {...register('fuel_type', { required: 'Fuel type is required' })}>
                  <option value="">--Select fuel type--</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                </select>
                {errors.fuel_type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.fuel_type.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="purchase_date">Purchase Date</label>
                <input
                  type="date"
                  id="purchase_date"
                  {...register('purchase_date')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="availability_status">Availability Status *</label>
                <select id="availability_status" {...register('availability_status', { required: 'Status is required' })}>
                  <option value="Available">Available</option>
                  <option value="On Delivery">On Delivery</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.availability_status && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.availability_status.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="capacity_unit">Capacity Unit *</label>
                <input
                  type="text"
                  id="capacity_unit"
                  placeholder="e.g. blocks, tons, liters"
                  {...register('capacity_unit', {
                    required: 'Capacity unit is required',
                  })}
                />
                {errors.capacity_unit && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.capacity_unit.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="capacity_value">Capacity Value *</label>
                <input
                  type="number"
                  id="capacity_value"
                  placeholder="Enter capacity value"
                  min="0"
                  {...register('capacity_value', {
                    required: 'Capacity value is required',
                    min: { value: 0, message: 'Must be a positive number' },
                  })}
                />
                {errors.capacity_value && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.capacity_value.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="benchmark_fuel_liters">Benchmark Fuel (Liters) *</label>
                <input
                  type="number"
                  id="benchmark_fuel_liters"
                  placeholder="Enter benchmark fuel in liters"
                  min="0"
                  {...register('benchmark_fuel_liters', {
                    required: 'Benchmark fuel is required',
                    min: { value: 0, message: 'Must be a positive number' },
                  })}
                />
                {errors.benchmark_fuel_liters && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.benchmark_fuel_liters.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="expected_trips_per_benchmark">Expected Trips Per Benchmark *</label>
                <input
                  type="number"
                  id="expected_trips_per_benchmark"
                  placeholder="Enter expected trips"
                  min="0"
                  {...register('expected_trips_per_benchmark', {
                    required: 'Expected trips is required',
                    min: { value: 0, message: 'Must be a positive number' },
                  })}
                />
                {errors.expected_trips_per_benchmark && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.expected_trips_per_benchmark.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="is_active">Active *</label>
                <select id="is_active" {...register('is_active', { required: 'Active status is required' })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="xui-form-box xui-mt-1">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              placeholder="Enter any additional notes (optional)"
              rows={3}
              {...register('notes')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Vehicle...' : 'Update Vehicle'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditVehicle;
