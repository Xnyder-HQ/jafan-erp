import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import productionQcLogsService from '../../services/productionQcLogs.service';
import type { ProductionBatchOption } from '../../services/productionQcLogs.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface QcLogFormData {
  production_batch_unique_id: string;
  defective_quantity: string;
  qc_date: string;
  notes: string;
}

const AddQcLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [batches, setBatches] = useState<ProductionBatchOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatchOption | null>(null);

  const accessIds = getAccessIds('production-quality-control', 'production-qc-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QcLogFormData>({
    defaultValues: {
      production_batch_unique_id: '',
      defective_quantity: '',
      qc_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const watchedBatchId = watch('production_batch_unique_id');

  useEffect(() => {
    const batch = batches.find(b => b.unique_id === watchedBatchId);
    setSelectedBatch(batch || null);
  }, [watchedBatchId, batches]);

  useEffect(() => {
    if (!moduleId) {
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        const response = await productionQcLogsService.getProductionBatches();
        if (response.success && response.data) {
          setBatches(response.data.rows || []);
        }
      } catch (err: any) {
        console.log('Failed to load production batches:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [moduleId, subModuleId]);

  const onSubmit = async (data: QcLogFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        production_batch_unique_id: data.production_batch_unique_id,
        defective_quantity: Number(data.defective_quantity),
        qc_date: data.qc_date,
        ...(data.notes && { notes: data.notes }),
      };

      const response = await productionQcLogsService.addQcLog(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('QC log added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/production/qc');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add QC log');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add QC log'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Log QC Check" subtitle="Record a quality control check" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Log QC Check" subtitle="Record a quality control check" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the QC check details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="production_batch_unique_id">Production Batch *</label>
                <select
                  id="production_batch_unique_id"
                  {...register('production_batch_unique_id', { required: 'Production batch is required' })}
                >
                  <option value="">--Select a production batch--</option>
                  {batches.map((batch) => (
                    <option key={batch.unique_id} value={batch.unique_id}>
                      {batch.production_date} - {batch.shift} | {batch.quantity_produced} produced
                      {batch.FinishedGood ? ` | ${batch.FinishedGood.name}` : ''}
                      {batch.Machine ? ` | ${batch.Machine.name}` : ''}
                    </option>
                  ))}
                </select>
                {errors.production_batch_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.production_batch_unique_id.message}
                  </span>
                )}
              </div>

              {selectedBatch && (
                <div className="xui-p-1 xui-bdr-rad-half xui-mb-1" style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                  <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Batch Details</p>
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-half xui-font-sz-80">
                    <div>
                      <span className="xui-opacity-5">Quantity Produced:</span>
                      <span className="xui-font-w-500 xui-ml-half">{selectedBatch.quantity_produced}</span>
                    </div>
                    <div>
                      <span className="xui-opacity-5">Shift:</span>
                      <span className="xui-font-w-500 xui-ml-half">{selectedBatch.shift}</span>
                    </div>
                    {selectedBatch.Machine && (
                      <div>
                        <span className="xui-opacity-5">Machine:</span>
                        <span className="xui-font-w-500 xui-ml-half">{selectedBatch.Machine.name} ({selectedBatch.Machine.code})</span>
                      </div>
                    )}
                    {selectedBatch.ProductionTeam && (
                      <div>
                        <span className="xui-opacity-5">Team:</span>
                        <span className="xui-font-w-500 xui-ml-half">{selectedBatch.ProductionTeam.name}</span>
                      </div>
                    )}
                    {selectedBatch.FinishedGood && (
                      <div>
                        <span className="xui-opacity-5">Finished Good:</span>
                        <span className="xui-font-w-500 xui-ml-half">{selectedBatch.FinishedGood.name} ({selectedBatch.FinishedGood.type})</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="xui-form-box">
                <label htmlFor="defective_quantity">Defective Quantity *</label>
                <input
                  type="number"
                  id="defective_quantity"
                  placeholder="Enter number of defective items"
                  min="0"
                  step="any"
                  {...register('defective_quantity', {
                    required: 'Defective quantity is required',
                    min: { value: 0, message: 'Defective quantity cannot be negative' },
                    validate: (value) => {
                      if (selectedBatch && Number(value) > selectedBatch.quantity_produced) {
                        return `Cannot exceed quantity produced (${selectedBatch.quantity_produced})`;
                      }
                      return true;
                    },
                  })}
                />
                {errors.defective_quantity && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.defective_quantity.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="qc_date">QC Date *</label>
                <input
                  type="date"
                  id="qc_date"
                  {...register('qc_date', { required: 'QC date is required' })}
                />
                {errors.qc_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.qc_date.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Enter any observations or notes (optional)"
                  rows={4}
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
            {loading ? 'Logging QC Check...' : 'Log QC Check'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddQcLog;
