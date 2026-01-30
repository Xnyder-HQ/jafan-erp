import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import machineMaintenanceLogsService from '../../services/machineMaintenanceLogs.service';
import machinesService, { type Machine } from '../../services/machines.service';
import vendorsService, { type Vendor } from '../../services/vendors.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface MaintenanceLogFormData {
  machine_unique_id: string;
  vendor_unique_id: string;
  service_date: string;
  cost: string;
  next_service_date: string;
  notes: string;
}

const AddMaintenanceLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('production-quality-control', 'machine-maintenance-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceLogFormData>({
    defaultValues: {
      machine_unique_id: '',
      vendor_unique_id: '',
      service_date: new Date().toISOString().split('T')[0],
      cost: '',
      next_service_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      const promises: Promise<void>[] = [];

      promises.push(
        machinesService.getMachinesForDropdown().then((response) => {
          if (response.success && response.data && 'rows' in response.data) {
            setMachines(response.data.rows.filter((m) => m.is_active));
          }
        }).catch((err) => {
          console.error('Failed to fetch machines:', err);
        })
      );

      promises.push(
        vendorsService.getVendorsForDropdown().then((response) => {
          if (response.success && response.data && 'rows' in response.data) {
            setVendors(response.data.rows);
          }
        }).catch((err) => {
          console.error('Failed to fetch vendors:', err);
        })
      );

      await Promise.all(promises);
      setLoadingOptions(false);
    };

    fetchOptions();
  }, []);

  const onSubmit = async (data: MaintenanceLogFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await machineMaintenanceLogsService.addMaintenanceLog(
        {
          machine_unique_id: data.machine_unique_id,
          vendor_unique_id: data.vendor_unique_id || undefined,
          service_date: data.service_date,
          cost: Number(data.cost),
          next_service_date: data.next_service_date || undefined,
          notes: data.notes,
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Maintenance log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/maintenance');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add maintenance log');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add maintenance log'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Log Maintenance" subtitle="Record a machine maintenance entry" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the details below to log a maintenance entry.</p>
        <hr className="xui-my-2" />

        {loadingOptions ? (
          <p>Loading options...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
              <div>
                <div className="xui-form-box">
                  <label htmlFor="machine_unique_id">Machine *</label>
                  <select
                    id="machine_unique_id"
                    {...register('machine_unique_id', { required: 'Machine is required' })}
                  >
                    <option value="">--Select machine--</option>
                    {machines.map((machine) => (
                      <option key={machine.unique_id} value={machine.unique_id}>
                        {machine.name} ({machine.code}) - {machine.type}
                      </option>
                    ))}
                  </select>
                  {errors.machine_unique_id && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.machine_unique_id.message}
                    </span>
                  )}
                </div>

                <div className="xui-form-box">
                  <label htmlFor="vendor_unique_id">Vendor (Service Provider)</label>
                  <select
                    id="vendor_unique_id"
                    {...register('vendor_unique_id')}
                  >
                    <option value="">--None--</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.unique_id} value={vendor.unique_id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    If a vendor is selected, their total spend will be updated
                  </small>
                </div>

                <div className="xui-form-box">
                  <label htmlFor="service_date">Service Date *</label>
                  <input
                    type="date"
                    id="service_date"
                    {...register('service_date', { required: 'Service date is required' })}
                  />
                  {errors.service_date && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.service_date.message}
                    </span>
                  )}
                </div>

                <div className="xui-form-box">
                  <label htmlFor="cost">Cost (₦) *</label>
                  <input
                    type="number"
                    id="cost"
                    placeholder="Enter maintenance cost"
                    min="0"
                    step="0.01"
                    {...register('cost', {
                      required: 'Cost is required',
                      min: { value: 0, message: 'Cost cannot be negative' },
                    })}
                  />
                  {errors.cost && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.cost.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="xui-form-box">
                  <label htmlFor="next_service_date">Next Service Date</label>
                  <input
                    type="date"
                    id="next_service_date"
                    {...register('next_service_date')}
                  />
                </div>

                <div className="xui-form-box">
                  <label htmlFor="notes">Notes *</label>
                  <textarea
                    id="notes"
                    placeholder="Describe the maintenance performed (min 2 characters)"
                    rows={8}
                    {...register('notes', {
                      required: 'Notes are required',
                      minLength: { value: 2, message: 'Notes must be at least 2 characters' },
                      maxLength: { value: 65535, message: 'Notes must be less than 65535 characters' },
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
              {loading ? 'Adding Maintenance Log...' : 'Add Maintenance Log'}
            </button>
          </form>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddMaintenanceLog;
