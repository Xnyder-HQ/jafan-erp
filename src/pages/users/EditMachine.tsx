import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Add, Close } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import machinesService from '../../services/machines.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface MachineFormData {
  name: string;
  code: string;
  type: string;
  fuel_type: string;
  description: string;
  expected_blocks_per_day: string;
  installed_date: string;
  is_active: string;
}

const EditMachine = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [blockTypes, setBlockTypes] = useState<string[]>([]);
  const [blockTypeInput, setBlockTypeInput] = useState('');
  const [blockTypeError, setBlockTypeError] = useState('');

  const accessIds = getAccessIds('administration', 'machines');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MachineFormData>({
    defaultValues: {
      name: '',
      code: '',
      type: '',
      fuel_type: '',
      description: '',
      expected_blocks_per_day: '',
      installed_date: '',
      is_active: 'true',
    },
  });

  useEffect(() => {
    if (!moduleId || !id) {
      setFetching(false);
      return;
    }

    const fetchMachine = async () => {
      try {
        const response = await machinesService.getMachine(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const machine = response.data;
          reset({
            name: machine.name,
            code: machine.code,
            type: machine.type,
            fuel_type: machine.fuel_type,
            description: machine.description || '',
            expected_blocks_per_day: machine.expected_blocks_per_day?.toString() || '',
            installed_date: machine.installed_date ? machine.installed_date.split('T')[0] : '',
            is_active: machine.is_active ? 'true' : 'false',
          });
          setBlockTypes(machine.supported_block_types || []);
        } else {
          setError('Machine not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to load machine'));
        showAlert('error-alert');
      } finally {
        setFetching(false);
      }
    };

    fetchMachine();
  }, [moduleId, subModuleId, id, reset]);

  const addBlockType = () => {
    const value = blockTypeInput.trim();
    if (!value) return;
    if (blockTypes.includes(value)) {
      setBlockTypeError('This block type already exists');
      return;
    }
    setBlockTypes([...blockTypes, value]);
    setBlockTypeInput('');
    setBlockTypeError('');
  };

  const removeBlockType = (index: number) => {
    setBlockTypes(blockTypes.filter((_, i) => i !== index));
  };

  const handleBlockTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBlockType();
    }
  };

  const onSubmit = async (data: MachineFormData) => {
    if (!accessIds || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    if (blockTypes.length === 0) {
      setBlockTypeError('At least one supported block type is required');
      return;
    }

    setLoading(true);
    try {
      const params = {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      };

      const results = await Promise.allSettled([
        machinesService.updateMachineDetails({
          unique_id: id,
          name: data.name,
          code: data.code,
          type: data.type,
          fuel_type: data.fuel_type,
        }, params),
        machinesService.updateMachineDescription({
          unique_id: id,
          description: data.description || undefined,
        }, params),
        machinesService.updateMachineOtherDetails({
          unique_id: id,
          expected_blocks_per_day: data.expected_blocks_per_day ? Number(data.expected_blocks_per_day) : undefined,
          installed_date: data.installed_date || undefined,
        }, params),
        machinesService.updateMachineSupportedBlockTypes({
          unique_id: id,
          supported_block_types: blockTypes,
        }, params),
        machinesService.updateMachineToggles({
          unique_id: id,
          is_active: data.is_active === 'true',
        }, params),
      ]);

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.length === results.length) {
        throw failures[0]?.reason || new Error('Failed to update machine');
      }

      setSuccessMessage('Machine updated successfully');
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/users/machines');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update machine'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar title="Edit Machine" subtitle="Update machine details" />
        <div className="xui-py-1">
          <p>Loading machine...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Machine" subtitle="Update machine details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the machine details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Machine Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter machine name"
                  {...register('name', {
                    required: 'Machine name is required',
                    maxLength: { value: 200, message: 'Name must be less than 200 characters' },
                  })}
                />
                {errors.name && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="code">Machine Code *</label>
                <input
                  type="text"
                  id="code"
                  placeholder="Enter machine code"
                  {...register('code', {
                    required: 'Machine code is required',
                    maxLength: { value: 50, message: 'Code must be less than 50 characters' },
                  })}
                />
                {errors.code && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.code.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="type">Type *</label>
                <input
                  type="text"
                  id="type"
                  placeholder="Enter machine type"
                  {...register('type', {
                    required: 'Machine type is required',
                    maxLength: { value: 50, message: 'Type must be less than 50 characters' },
                  })}
                />
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
                  <option value="Electric">Electric</option>
                  <option value="Petrol">Petrol</option>
                </select>
                {errors.fuel_type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.fuel_type.message}
                  </span>
                )}
              </div>
            </div>

            <div>
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

              <div className="xui-form-box">
                <label htmlFor="expected_blocks_per_day">Expected Blocks Per Day</label>
                <input
                  type="number"
                  id="expected_blocks_per_day"
                  placeholder="Enter expected blocks per day"
                  min="0"
                  {...register('expected_blocks_per_day')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="installed_date">Installed Date</label>
                <input
                  type="date"
                  id="installed_date"
                  {...register('installed_date')}
                />
              </div>

              <div className="xui-form-box">
                <label>Supported Block Types *</label>
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <input
                    type="text"
                    placeholder="Enter block type and press Enter"
                    value={blockTypeInput}
                    onChange={(e) => {
                      setBlockTypeInput(e.target.value);
                      setBlockTypeError('');
                    }}
                    onKeyDown={handleBlockTypeKeyDown}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={addBlockType}
                    className="xui-btn xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                    style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)', minWidth: '40px', height: '40px' }}
                  >
                    <Add size={16} />
                  </button>
                </div>
                {blockTypeError && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {blockTypeError}
                  </span>
                )}
                {blockTypes.length > 0 && (
                  <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-mt-half" style={{ flexWrap: 'wrap' }}>
                    {blockTypes.map((type, index) => (
                      <span
                        key={index}
                        className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-px-half xui-py-half xui-bdr-rad-half xui-font-sz-80"
                        style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)' }}
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeBlockType(index)}
                          className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                          style={{ background: 'none', border: 'none', color: 'var(--primary-700)', padding: 0 }}
                        >
                          <Close size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="xui-form-box xui-mt-1">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Enter machine description (optional)"
              rows={3}
              {...register('description')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Machine...' : 'Update Machine'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditMachine;
