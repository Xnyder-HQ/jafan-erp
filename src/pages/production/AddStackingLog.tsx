import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import stackingLogsService from '../../services/stackingLogs.service';
import finishedGoodsService, { type FinishedGood } from '../../services/finishedGoods.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface StackingLogFormData {
  finished_good_unique_id: string;
  blocks_stacked: string;
  // stacking_rate: string; //
  breakage_quantity: string;
  stack_date: string;
  notes: string;
}

const AddStackingLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('production-quality-control', 'stacking-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fgAccessIds = getAccessIds('inventory-stock-management', 'finished-goods');
  const fgModuleId = fgAccessIds?.module_unique_id;
  const fgSubModuleId = fgAccessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StackingLogFormData>({
    defaultValues: {
      finished_good_unique_id: '',
      blocks_stacked: '',
      // stacking_rate: '', // Calculated automatically from business rules
      breakage_quantity: '0',
      stack_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    const fetchFinishedGoods = async () => {
      if (!fgModuleId || !fgSubModuleId) {
        setLoadingOptions(false);
        return;
      }

      try {
        const response = await finishedGoodsService.getFinishedGoods({
          page: 1,
          size: 100,
          module_unique_id: fgModuleId,
          sub_module_unique_id: fgSubModuleId,
        });

        if (response.success && response.data && 'rows' in response.data) {
          setFinishedGoods(response.data.rows);
        }
      } catch (err) {
        console.error('Failed to fetch finished goods:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFinishedGoods();
  }, [fgModuleId, fgSubModuleId]);

  const onSubmit = async (data: StackingLogFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await stackingLogsService.addStackingLog(
        {
          finished_good_unique_id: data.finished_good_unique_id,
          blocks_stacked: Number(data.blocks_stacked),
          // stacking_rate: Number(data.stacking_rate), // Calculated automatically from business rules
          breakage_quantity: Number(data.breakage_quantity),
          stack_date: data.stack_date,
          notes: data.notes || undefined,
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Stacking log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/stacking');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add stacking log');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add stacking log'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Log Stacking" subtitle="Record a block stacking entry" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the details below to log a stacking entry. Breakage will be deducted from the finished good stock.</p>
        <hr className="xui-my-2" />

        {loadingOptions ? (
          <p>Loading options...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
              <div>
                <div className="xui-form-box">
                  <label htmlFor="finished_good_unique_id">Finished Good *</label>
                  <select
                    id="finished_good_unique_id"
                    {...register('finished_good_unique_id', { required: 'Finished good is required' })}
                  >
                    <option value="">--Select finished good--</option>
                    {finishedGoods.map((fg) => (
                      <option key={fg.unique_id} value={fg.unique_id}>
                        {fg.name} {fg.type ? `(${fg.type})` : ''} - Stock: {fg.current_quantity.toLocaleString()}
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
                  <label htmlFor="blocks_stacked">Blocks Stacked *</label>
                  <input
                    type="number"
                    id="blocks_stacked"
                    placeholder="Enter number of blocks stacked"
                    min="0"
                    step="1"
                    {...register('blocks_stacked', {
                      required: 'Blocks stacked is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.blocks_stacked && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.blocks_stacked.message}
                    </span>
                  )}
                </div>

                {/*
                <div className="xui-form-box">
                  <label htmlFor="stacking_rate">Stacking Rate (₦/block) *</label>
                  <input
                    type="number"
                    id="stacking_rate"
                    placeholder="Enter rate per block"
                    min="0"
                    step="0.01"
                    {...register('stacking_rate', {
                      required: 'Stacking rate is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.stacking_rate && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.stacking_rate.message}
                    </span>
                  )}
                </div>
                */}
              </div>

              <div>
                <div className="xui-form-box">
                  <label htmlFor="breakage_quantity">Breakage Quantity *</label>
                  <input
                    type="number"
                    id="breakage_quantity"
                    placeholder="Enter number of broken blocks"
                    min="0"
                    step="1"
                    {...register('breakage_quantity', {
                      required: 'Breakage quantity is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.breakage_quantity && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.breakage_quantity.message}
                    </span>
                  )}
                  <small className="xui-opacity-5 xui-d-block xui-mt-half">
                    This will be deducted from the finished good's current stock
                  </small>
                </div>

                <div className="xui-form-box">
                  <label htmlFor="stack_date">Stack Date *</label>
                  <input
                    type="date"
                    id="stack_date"
                    {...register('stack_date', { required: 'Stack date is required' })}
                  />
                  {errors.stack_date && (
                    <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                      {errors.stack_date.message}
                    </span>
                  )}
                </div>

                <div className="xui-form-box">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    placeholder="Additional notes (optional)"
                    rows={5}
                    {...register('notes', {
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
              {loading ? 'Adding Stacking Log...' : 'Add Stacking Log'}
            </button>
          </form>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddStackingLog;
