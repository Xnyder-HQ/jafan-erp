import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import approvalsService from '../../services/approvals.service';
import type { ModuleOption } from '../../services/approvals.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface ApprovalFormData {
  module_unique_id: string;
  sub_module_unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string;
}

const AddApproval = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [subModules, setSubModules] = useState<{ unique_id: string; name: string; stripped: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('approvals', 'all-approvals');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApprovalFormData>({
    defaultValues: {
      module_unique_id: '',
      sub_module_unique_id: '',
      add: false,
      edit: false,
      delete: false,
      elevated_role: false,
      acl_expiring: '',
    },
  });

  const selectedModuleId = watch('module_unique_id');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const modulesRes = await approvalsService.getModules();
        if (modulesRes.success && modulesRes.data) {
          const rows = Array.isArray(modulesRes.data) ? modulesRes.data : modulesRes.data.rows;
          setModules(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (!selectedModuleId) {
      setSubModules([]);
      setValue('sub_module_unique_id', '');
      return;
    }

    const selectedModule = modules.find(m => m.unique_id === selectedModuleId);
    if (selectedModule?.SubModules) {
      setSubModules(selectedModule.SubModules);
    } else {
      setSubModules([]);
    }
    setValue('sub_module_unique_id', '');
  }, [selectedModuleId, modules, setValue]);

  const onSubmit = async (data: ApprovalFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await approvalsService.addApproval(
        {
          module_unique_id: data.module_unique_id,
          ...(data.sub_module_unique_id && { sub_module_unique_id: data.sub_module_unique_id }),
          view: true,
          add: data.add,
          edit: data.edit,
          delete: data.delete,
          elevated_role: data.elevated_role,
          ...(data.acl_expiring && { acl_expiring: data.acl_expiring.replace('T', ' ') }),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Approval request submitted successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/approvals');
        }, 1500);
      } else {
        setError(response.message || 'Failed to submit approval request');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to submit approval request'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Request Approval" subtitle="Request access to a module" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Request Approval" subtitle="Request access to a module" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Select a module and configure the permissions you are requesting.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="module_unique_id">Module *</label>
                <select
                  id="module_unique_id"
                  {...register('module_unique_id', { required: 'Module is required' })}
                >
                  <option value="">--Select module--</option>
                  {modules.map((mod) => (
                    <option key={mod.unique_id} value={mod.unique_id}>
                      {mod.name}
                    </option>
                  ))}
                </select>
                {errors.module_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.module_unique_id.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="sub_module_unique_id">Sub Module</label>
                <select
                  id="sub_module_unique_id"
                  disabled={!selectedModuleId || subModules.length === 0}
                  {...register('sub_module_unique_id')}
                >
                  <option value="">
                    {!selectedModuleId ? '--Select a module first--' : subModules.length === 0 ? '--No sub modules--' : '--Select sub module (optional)--'}
                  </option>
                  {subModules.map((sub) => (
                    <option key={sub.unique_id} value={sub.unique_id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="acl_expiring">Expiration Date</label>
                <input
                  type="datetime-local"
                  id="acl_expiring"
                  {...register('acl_expiring')}
                />
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  Leave empty for non-expiring access
                </small>
              </div>
            </div>

            <div>
              <p className="xui-font-w-600 xui-mb-1">Permissions</p>

              <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('add')} />
                    <div>
                      <span className="xui-font-w-500">Add</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Allow creating new records</span>
                    </div>
                  </label>

                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('edit')} />
                    <div>
                      <span className="xui-font-w-500">Edit</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Allow modifying existing records</span>
                    </div>
                  </label>

                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('delete')} />
                    <div>
                      <span className="xui-font-w-500">Delete</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Allow removing records</span>
                    </div>
                  </label>

                  <hr className="xui-my-half" />

                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('elevated_role')} />
                    <div>
                      <span className="xui-font-w-500">Elevated Role</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Request elevated administrative access</span>
                    </div>
                  </label>
                </div>
              </div>

              <small className="xui-opacity-5 xui-d-block xui-mb-1">
                View permission is automatically granted with every approval.
              </small>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Submitting Request...' : 'Submit Approval Request'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddApproval;
