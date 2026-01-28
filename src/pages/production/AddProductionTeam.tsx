import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import productionTeamsService from '../../services/productionTeams.service';
import type { MachineOption } from '../../services/productionTeams.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface TeamFormData {
  name: string;
  is_active: string;
  machine_unique_id: string;
}

const AddProductionTeam = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('production-quality-control', 'production-teams');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: '',
      is_active: 'true',
      machine_unique_id: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        const response = await productionTeamsService.getMachines({
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });
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

  const onSubmit = async (data: TeamFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: data.name,
        is_active: data.is_active === 'true',
        machine_unique_id: data.machine_unique_id || undefined,
      };

      const response = await productionTeamsService.addProductionTeam(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Production team added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/teams');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add production team');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add production team'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Add Production Team" subtitle="Create a new production team" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add Production Team" subtitle="Create a new production team" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the production team details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Team Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter team name"
                  {...register('name', {
                    required: 'Team name is required',
                    maxLength: { value: 300, message: 'Name must be less than 300 characters' },
                  })}
                />
                {errors.name && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="is_active">Status *</label>
                <select id="is_active" {...register('is_active', { required: 'Status is required' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                {errors.is_active && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.is_active.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="machine_unique_id">Assigned Machine</label>
                <select id="machine_unique_id" {...register('machine_unique_id')}>
                  <option value="">--No machine assigned--</option>
                  {machines.filter(m => m.is_active).map((machine) => (
                    <option key={machine.unique_id} value={machine.unique_id}>
                      {machine.name} ({machine.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Adding Team...' : 'Add Production Team'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddProductionTeam;
