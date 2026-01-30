import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import productionBatchesService from '../../services/productionBatches.service';
import type { MachineOption, ProductionTeamOption, FinishedGoodOption } from '../../services/productionBatches.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface BatchFormData {
  machine_unique_id: string;
  production_team_unique_id: string;
  finished_good_unique_id: string;
  quantity_produced: string;
  production_date: string;
  shift: string;
  notes: string;
}

const AddProductionBatch = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [teams, setTeams] = useState<ProductionTeamOption[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('production-quality-control', 'production-batches');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchFormData>({
    defaultValues: {
      machine_unique_id: '',
      production_team_unique_id: '',
      finished_good_unique_id: '',
      quantity_produced: '',
      production_date: new Date().toISOString().split('T')[0],
      shift: '',
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
        const [machinesRes, teamsRes, goodsRes] = await Promise.all([
          productionBatchesService.getMachines(),
          productionBatchesService.getProductionTeams(),
          productionBatchesService.getFinishedGoods(),
        ]);

        if (machinesRes.success && machinesRes.data) {
          setMachines(machinesRes.data.rows || []);
        }
        if (teamsRes.success && teamsRes.data) {
          setTeams(teamsRes.data.rows || []);
        }
        if (goodsRes.success && goodsRes.data) {
          setFinishedGoods(goodsRes.data.rows || []);
        }
      } catch (err: any) {
        console.log('Failed to load form options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [moduleId, subModuleId]);

  const onSubmit = async (data: BatchFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        machine_unique_id: data.machine_unique_id,
        production_team_unique_id: data.production_team_unique_id,
        finished_good_unique_id: data.finished_good_unique_id,
        quantity_produced: Number(data.quantity_produced),
        production_date: data.production_date,
        shift: data.shift || undefined,
        notes: data.notes || undefined,
      };

      const response = await productionBatchesService.addProductionBatch(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Production batch logged successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/daily');
        }, 1500);
      } else {
        setError(response.message || 'Failed to log production batch');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to log production batch'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const shiftOptions = [
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Night', label: 'Night' },
  ];

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Log Production Batch" subtitle="Record a new production batch" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Log Production Batch" subtitle="Record a new production batch" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the production batch details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="finished_good_unique_id">Finished Good *</label>
                <select
                  id="finished_good_unique_id"
                  {...register('finished_good_unique_id', {
                    required: 'Finished good is required',
                  })}
                >
                  <option value="">--Select finished good--</option>
                  {finishedGoods.map((good) => (
                    <option key={good.unique_id} value={good.unique_id}>
                      {good.name} {good.type ? `(${good.type})` : ''}
                    </option>
                  ))}
                </select>
                {errors.finished_good_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.finished_good_unique_id.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="machine_unique_id">Machine *</label>
                <select
                  id="machine_unique_id"
                  {...register('machine_unique_id', {
                    required: 'Machine is required',
                  })}
                >
                  <option value="">--Select machine ({machines.filter(m => m.is_active).length} active)--</option>
                  {machines.map((machine) => (
                    <option
                      key={machine.unique_id}
                      value={machine.unique_id}
                      disabled={!machine.is_active}
                    >
                      {machine.name} ({machine.code}) {!machine.is_active ? '[Inactive]' : ''}
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
                <label htmlFor="production_team_unique_id">Production Team *</label>
                <select
                  id="production_team_unique_id"
                  {...register('production_team_unique_id', {
                    required: 'Production team is required',
                  })}
                >
                  <option value="">--Select production team ({teams.filter(t => t.is_active).length} active)--</option>
                  {teams.map((team) => (
                    <option key={team.unique_id} value={team.unique_id} disabled={!team.is_active}>
                      {team.name} {!team.is_active ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
                {errors.production_team_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.production_team_unique_id.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="quantity_produced">Quantity Produced *</label>
                <input
                  type="number"
                  id="quantity_produced"
                  placeholder="Enter quantity produced"
                  min="0"
                  step="0.01"
                  {...register('quantity_produced', {
                    required: 'Quantity produced is required',
                    min: { value: 0, message: 'Quantity must be at least 0' },
                  })}
                />
                {errors.quantity_produced && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.quantity_produced.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="production_date">Production Date *</label>
                <input
                  type="date"
                  id="production_date"
                  {...register('production_date', {
                    required: 'Production date is required',
                  })}
                />
                {errors.production_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.production_date.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="shift">Shift</label>
                <select id="shift" {...register('shift')}>
                  <option value="">--Select shift--</option>
                  {shiftOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Enter any additional notes"
                  rows={5}
                  {...register('notes', {
                    maxLength: { value: 2000, message: 'Notes must be less than 2000 characters' },
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
            {loading ? 'Logging Batch...' : 'Log Production Batch'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddProductionBatch;
