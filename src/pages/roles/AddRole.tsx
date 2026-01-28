import { useState } from 'react';
import { useNavigate } from 'react-router';
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

const AddRole = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('roles', 'all-roles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await rolesService.addRole(
        {
          name: data.name,
          ...(data.description && { description: data.description }),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Role created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/roles');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create role');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create role'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Add Role" subtitle="Create a new user role" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the role details below. Fields marked with * are required.</p>
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
            {loading ? 'Creating Role...' : 'Create Role'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddRole;
