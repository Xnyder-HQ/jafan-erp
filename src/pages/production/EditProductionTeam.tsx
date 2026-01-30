import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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

const EditProductionTeam = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [machines, setMachines] = useState<MachineOption[]>([]);

  const accessIds = getAccessIds('production-quality-control', 'production-teams');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: '',
      is_active: 'true',
      machine_unique_id: '',
    },
  });

  useEffect(() => {
    if (!moduleId || !id) {
      setFetching(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [teamRes, machinesRes] = await Promise.all([
          productionTeamsService.getProductionTeam(id, {
            module_unique_id: moduleId,
            sub_module_unique_id: subModuleId,
          }),
          productionTeamsService.getMachines(),
        ]);

        if (teamRes.success && teamRes.data) {
          reset({
            name: teamRes.data.name,
            is_active: teamRes.data.is_active ? 'true' : 'false',
            machine_unique_id: teamRes.data.machine_unique_id || '',
          });
        } else {
          setError('Production team not found');
          showAlert('error-alert');
        }

        if (machinesRes.success && machinesRes.data) {
          setMachines(machinesRes.data.rows || []);
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to load production team'));
        showAlert('error-alert');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [moduleId, subModuleId, id, reset]);

  const onSubmit = async (data: TeamFormData) => {
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
        productionTeamsService.updateProductionTeamDetails({
          unique_id: id,
          name: data.name,
          is_active: data.is_active === 'true',
        }, params),
        productionTeamsService.updateProductionTeamMachine({
          unique_id: id,
          machine_unique_id: data.machine_unique_id || undefined,
        }, params),
      ]);

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.length === results.length) {
        throw failures[0]?.reason || new Error('Failed to update production team');
      }

      setSuccessMessage('Production team updated successfully');
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/production/teams');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update production team'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar title="Edit Production Team" subtitle="Update production team details" />
        <div className="xui-py-1">
          <p>Loading production team...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Production Team" subtitle="Update production team details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the production team details below. Fields marked with * are required.</p>
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
            {loading ? 'Updating Team...' : 'Update Production Team'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditProductionTeam;
