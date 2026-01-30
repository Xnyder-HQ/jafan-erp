import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Renew, Checkmark, Subtract, CloseOutline, UserRole } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import usersService from '../../services/users.service';
import type { User, RoleOption } from '../../services/users.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface RoleFormData {
  role_unique_id: string;
}

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds, checkAccess } = useGeneral();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<'grant' | 'suspend' | 'revoke' | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [updatingRole, setUpdatingRole] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<RoleFormData>({
    defaultValues: {
      role_unique_id: '',
    },
  });

  const selectedRoleId = watch('role_unique_id');

  const accessIds = getAccessIds('administration', 'users');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  const fetchUser = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await usersService.getUser(id);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setFetchError(response.message || 'Failed to load user');
      }
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to load user'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await usersService.getRoles();
        if (response.success && response.data) {
          const rolesData = Array.isArray(response.data) ? response.data : response.data.rows;
          setRoles(rolesData || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (user?.Role?.unique_id) {
      setValue('role_unique_id', user.Role.unique_id);
    }
  }, [user, setValue]);

  const onRoleSubmit = async (data: RoleFormData) => {
    if (!moduleId || !subModuleId || !user || !data.role_unique_id) {
      setActionError('Please select a role');
      showAlert('error-alert');
      return;
    }

    if (data.role_unique_id === user.Role?.unique_id) {
      setActionError('User already has this role');
      showAlert('error-alert');
      return;
    }

    setUpdatingRole(true);
    try {
      const response = await usersService.updateUserRole(
        { unique_id: user.unique_id, role_unique_id: data.role_unique_id },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );

      if (response.success) {
        setSuccessMessage('User role updated successfully');
        showAlert('success-alert');
        fetchUser();
      } else {
        setActionError(response.message || 'Failed to update role');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setActionError(extractErrorMessage(err, 'Failed to update role'));
      showAlert('error-alert');
    } finally {
      setUpdatingRole(false);
    }
  };

  const getActionConfig = () => {
    switch (pendingAction) {
      case 'grant':
        return {
          title: 'Grant Access',
          message: 'Are you sure you want to grant access to this user? They will be able to log in and use the system.',
          confirmText: 'Grant Access',
          confirmingText: 'Granting...',
          confirmButtonStyle: 'primary' as const,
        };
      case 'suspend':
        return {
          title: 'Suspend Access',
          message: 'Are you sure you want to suspend this user\'s access? They will be temporarily unable to use the system.',
          confirmText: 'Suspend Access',
          confirmingText: 'Suspending...',
          confirmButtonStyle: 'warning' as const,
        };
      case 'revoke':
        return {
          title: 'Revoke Access',
          message: 'Are you sure you want to revoke this user\'s access? This will permanently remove their access to the system.',
          confirmText: 'Revoke Access',
          confirmingText: 'Revoking...',
          confirmButtonStyle: 'danger' as const,
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: '',
          confirmingText: '',
          confirmButtonStyle: 'primary' as const,
        };
    }
  };

  const openActionModal = (action: 'grant' | 'suspend' | 'revoke') => {
    setPendingAction(action);
    modalShow('user-access-modal');
  };

  const handleAccessAction = async () => {
    if (!moduleId || !subModuleId || !user || !pendingAction) {
      return { success: false, message: 'Unable to perform action' };
    }

    const params = {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    };

    switch (pendingAction) {
      case 'grant':
        return usersService.grantAccess({ unique_id: user.unique_id }, params);
      case 'suspend':
        return usersService.suspendAccess({ unique_id: user.unique_id }, params);
      case 'revoke':
        return usersService.revokeAccess({ unique_id: user.unique_id }, params);
      default:
        return { success: false, message: 'Invalid action' };
    }
  };

  const handleActionSuccess = () => {
    fetchUser();
  };

  const getUserInitials = (u: User) => {
    return `${u.firstname.charAt(0)}${u.lastname.charAt(0)}`.toUpperCase();
  };

  const actionConfig = getActionConfig();

  return (
    <div>
      <Navbar title="Manage User" subtitle="View user details and manage access" />

      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading user details...</p>
          </div>
        ) : fetchError ? (
          <div className="xui-py-3 xui-text-center">
            <p className="xui-opacity-6 xui-mb-1">{fetchError}</p>
            <button
              onClick={fetchUser}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Retry
            </button>
          </div>
        ) : user ? (
          <>
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden xui-mb-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-p-1-half">
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1-half">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={`${user.firstname} ${user.lastname}`}
                      className="xui-w-80 xui-h-80 xui-bdr-rad-circle"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="xui-w-80 xui-h-80 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-font-sz-120 xui-font-w-600"
                      style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
                    >
                      {getUserInitials(user)}
                    </div>
                  )}
                  <div>
                    <h2 className="xui-font-sz-120 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>
                      {user.firstname} {user.middlename ? `${user.middlename} ` : ''}{user.lastname}
                    </h2>
                    <p className="xui-font-sz-85 xui-opacity-5 xui-mt-half">{user.email}</p>
                    {user.Role && (
                      <span className="xui-badge xui-badge-info xui-font-sz-70 xui-mt-half">
                        {user.Role.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Personal Information</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div>
                      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Full Name</span>
                      <span className="xui-font-sz-85">
                        {user.firstname} {user.middlename ? `${user.middlename} ` : ''}{user.lastname}
                      </span>
                    </div>
                    <div>
                      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Email</span>
                      <span className="xui-font-sz-85">{user.email}</span>
                    </div>
                    <div>
                      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Phone Number</span>
                      <span className="xui-font-sz-85">{user.phone_number || '—'}</span>
                    </div>
                    <div>
                      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Username</span>
                      <span className="xui-font-sz-85">{user.username || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Role & Access</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div>
                      <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Current Role</span>
                      {user.Role ? (
                        <span className="xui-badge xui-badge-info xui-font-sz-70">{user.Role.name}</span>
                      ) : (
                        <span className="xui-font-sz-85 xui-opacity-5">No role assigned</span>
                      )}
                    </div>

                    {canEdit && (
                      <form className='xui-form' onSubmit={handleSubmit(onRoleSubmit)}>
                        <span className="xui-font-w-600 xui-font-sz-80 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Change Role</span>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <select
                            {...register('role_unique_id')}
                            className="xui-font-sz-85"
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--neutral-300)',
                              backgroundColor: 'var(--white)',
                              flex: 1,
                              maxWidth: '200px',
                            }}
                          >
                            <option value="">--Select role--</option>
                            {roles.map((role) => (
                              <option key={role.unique_id} value={role.unique_id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={updatingRole || !selectedRoleId || selectedRoleId === user.Role?.unique_id}
                            className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                            style={{
                              backgroundColor: 'var(--primary-600)',
                              color: 'var(--white)',
                              border: 'none',
                              opacity: (!selectedRoleId || selectedRoleId === user.Role?.unique_id) ? 0.5 : 1,
                            }}
                          >
                            <span className="icon-container"><UserRole size={16} /></span>
                            {updatingRole ? 'Updating...' : 'Update Role'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {canEdit && (
                    <div className="xui-mt-1-half">
                      <p className="xui-font-w-600 xui-font-sz-85 xui-mb-1" style={{ color: 'var(--neutral-700)' }}>Access Control</p>
                      <div className="xui-d-flex xui-flex-wrap xui-grid-gap-half">
                        <button
                          onClick={() => openActionModal('grant')}
                          className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                          style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', border: 'none' }}
                        >
                          <span className="icon-container"><Checkmark size={16} /></span>
                          Grant Access
                        </button>
                        <button
                          onClick={() => openActionModal('suspend')}
                          className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                          style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)', border: 'none' }}
                        >
                          <span className="icon-container"><Subtract size={16} /></span>
                          Suspend Access
                        </button>
                        <button
                          onClick={() => openActionModal('revoke')}
                          className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                          style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: 'none' }}
                        >
                          <span className="icon-container"><CloseOutline size={16} /></span>
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="user-access-modal"
        title={actionConfig.title}
        message={actionConfig.message}
        itemName={user ? `${user.firstname} ${user.lastname} — ${user.email}` : ''}
        confirmText={actionConfig.confirmText}
        confirmingText={actionConfig.confirmingText}
        confirmButtonStyle={actionConfig.confirmButtonStyle}
        onConfirm={handleAccessAction}
        onSuccess={handleActionSuccess}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default EditUser;
