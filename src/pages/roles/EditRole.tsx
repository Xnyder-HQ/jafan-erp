import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import rolesService from '../../services/roles.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface RoleFormData {
  name: string;
  description: string;
}

const EditRole = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('roles', 'all-roles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchRole = async () => {
      if (!id || !moduleId || !subModuleId) {
        setLoadingRole(false);
        return;
      }

      try {
        const response = await rolesService.getRole(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          reset({
            name: response.data.name,
            description: response.data.description || '',
          });
        } else {
          setError('Role not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch role'));
        showAlert('error-alert');
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRole();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: RoleFormData) => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await rolesService.updateRole(
        {
          unique_id: id,
          name: data.name,
          ...(data.description ? { description: data.description } : {}),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Role updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/roles');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update role');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update role'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRole) {
    return (
      <div>
        <Navbar title="Edit Role" subtitle="Update role information" />
        <div className="xui-py-1">
          <p>Loading role...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Role" subtitle="Update role information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the role details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div style={{ maxWidth: '600px' }}>
            <div className="xui-form-box">
              <label htmlFor="name">Role Name *</label>
              <input
                type="text"
                id="name"
                placeholder="Enter role name"
                {...register('name', { required: 'Role name is required' })}
              />
              {errors.name && (
                <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="xui-form-box">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Enter role description"
                rows={4}
                {...register('description')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Role...' : 'Update Role'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditRole;
