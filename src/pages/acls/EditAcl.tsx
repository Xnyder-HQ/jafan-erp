import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import aclsService from '../../services/acls.service';
import type { Acl } from '../../services/acls.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface EditAclFormData {
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string;
}

const EditAcl = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingAcl, setLoadingAcl] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [acl, setAcl] = useState<Acl | null>(null);

  const accessIds = getAccessIds('acls', 'all-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<EditAclFormData>({
    defaultValues: {
      add: false,
      edit: false,
      delete: false,
      elevated_role: false,
      acl_expiring: '',
    },
  });

  useEffect(() => {
    const fetchAcl = async () => {
      if (!id || !moduleId || !subModuleId) {
        setLoadingAcl(false);
        return;
      }

      try {
        const response = await aclsService.getAcl(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          setAcl(response.data);
          const expiringValue = response.data.acl_expiring
            ? new Date(response.data.acl_expiring).toISOString().slice(0, 16)
            : '';
          reset({
            add: response.data.add,
            edit: response.data.edit,
            delete: response.data.delete,
            elevated_role: response.data.elevated_role,
            acl_expiring: expiringValue,
          });
        }
      } catch (err) {
        console.error('Failed to fetch ACL:', err);
        setError('Failed to load ACL details');
        showAlert('error-alert');
      } finally {
        setLoadingAcl(false);
      }
    };

    fetchAcl();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: EditAclFormData) => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await aclsService.updateAcl(
        {
          unique_id: id,
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
        setSuccessMessage('ACL updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/acls');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update ACL'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAcl) {
    return (
      <div>
        <Navbar title="Edit ACL" subtitle="Modify user access permissions" />
        <div className="xui-py-1">
          <p>Loading ACL details...</p>
        </div>
      </div>
    );
  }

  if (!acl) {
    return (
      <div>
        <Navbar title="Edit ACL" subtitle="Modify user access permissions" />
        <div className="xui-py-1">
          <a
            onClick={() => navigate(-1)}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          <p className="xui-opacity-5">ACL not found or you do not have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit ACL" subtitle="Modify user access permissions" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-2" style={{ border: '1px solid var(--neutral-200)' }}>
          <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">ACL Details</p>
          <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-font-sz-80">
            <div>
              <span className="xui-opacity-6 xui-d-block">User</span>
              <span className="xui-font-w-500">{acl.User ? `${acl.User.firstname} ${acl.User.lastname}` : 'N/A'}</span>
            </div>
            <div>
              <span className="xui-opacity-6 xui-d-block">Email</span>
              <span className="xui-font-w-500">{acl.User?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="xui-opacity-6 xui-d-block">Module</span>
              <span className="xui-badge xui-badge-blue">{acl.Module?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="xui-opacity-6 xui-d-block">Sub Module</span>
              <span className="xui-font-w-500">{acl.SubModule?.name || '—'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
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

            <div>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating ACL...' : 'Update ACL'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditAcl;
