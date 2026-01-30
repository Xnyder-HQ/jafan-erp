import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import aclsService from '../../services/acls.service';
import type { ModuleOption, UserOption } from '../../services/acls.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface AclFormData {
  user_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string;
}

const AddAcl = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [subModules, setSubModules] = useState<{ unique_id: string; name: string; stripped: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const accessIds = getAccessIds('acls', 'all-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AclFormData>({
    defaultValues: {
      user_unique_id: '',
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
        const [usersRes, modulesRes] = await Promise.all([
          aclsService.getUsers(),
          aclsService.getModules(),
        ]);

        if (usersRes.success && usersRes.data) {
          const rows = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.rows;
          setUsers(rows || []);
        }

        if (modulesRes.success && modulesRes.data) {
          const rows = Array.isArray(modulesRes.data) ? modulesRes.data : modulesRes.data.rows;
          setModules(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch options:', err);
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

  const onSubmit = async (data: AclFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await aclsService.addAcl(
        {
          user_unique_id: data.user_unique_id,
          module_unique_id: data.module_unique_id,
          ...(data.sub_module_unique_id && { sub_module_unique_id: data.sub_module_unique_id }),
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
        setSuccessMessage('ACL added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/acls');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add ACL'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Add ACL" subtitle="Grant module access to a user" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add ACL" subtitle="Grant module access to a user" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Select a user and module, then configure the permissions to grant.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="user_unique_id">User *</label>
                <select
                  id="user_unique_id"
                  {...register('user_unique_id', { required: 'User is required' })}
                >
                  <option value="">--Select user--</option>
                  {users.map((user) => (
                    <option key={user.unique_id} value={user.unique_id}>
                      {user.firstname} {user.lastname} — {user.email}
                    </option>
                  ))}
                </select>
                {errors.user_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.user_unique_id.message}
                  </span>
                )}
              </div>

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
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                <p className="xui-font-w-600">Permissions</p>
                <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80">
                  <input
                    type="checkbox"
                    checked={watch('add') && watch('edit') && watch('delete') && watch('elevated_role')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setValue('add', checked);
                      setValue('edit', checked);
                      setValue('delete', checked);
                      setValue('elevated_role', checked);
                    }}
                  />
                  <span className="xui-font-w-500">Check All</span>
                </label>
              </div>

              <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                  {/* Row 1: View + Add */}
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ opacity: 0.6 }}>
                      <input type="checkbox" checked={true} disabled />
                      <div>
                        <span className="xui-font-w-500">View</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">View records (default)</span>
                      </div>
                    </label>

                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                      <input type="checkbox" {...register('add')} />
                      <div>
                        <span className="xui-font-w-500">Add</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Create new records</span>
                      </div>
                    </label>
                  </div>

                  {/* Row 2: Edit + Delete */}
                  <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                      <input type="checkbox" {...register('edit')} />
                      <div>
                        <span className="xui-font-w-500">Edit</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Modify records</span>
                      </div>
                    </label>

                    <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                      <input type="checkbox" {...register('delete')} />
                      <div>
                        <span className="xui-font-w-500">Delete</span>
                        <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Remove records</span>
                      </div>
                    </label>
                  </div>

                  <hr className="xui-my-half" />

                  {/* Row 3: Elevated Role */}
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('elevated_role')} />
                    <div>
                      <span className="xui-font-w-500">Elevated Role</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Grant elevated administrative access</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Adding ACL...' : 'Add ACL'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddAcl;
