import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download, Search } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import roleAclsService from '../../services/roleAcls.service';
import type { RoleAcl, RoleOption } from '../../services/roleAcls.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const RoleAcls = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [roleAcls, setRoleAcls] = useState<RoleAcl[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRoleAcl, setSelectedRoleAcl] = useState<RoleAcl | null>(null);

  const accessIds = getAccessIds('roles', 'role-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setRoleAcls(response.data);
        setTotalPages(1);
      } else {
        setRoleAcls(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setRoleAcls([]);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleAclsService.getRoles();
        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setRoles(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const fetchRoleAcls = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.getRoleAcls({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const fetchByRole = useCallback(async (roleUniqueId: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.getRoleAclsSpecifically({
        role_unique_id: roleUniqueId,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterRoleAcls = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await roleAclsService.filterRoleAcls({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter role ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (roleAcl: RoleAcl) => {
    setSelectedRoleAcl(roleAcl);
    modalShow('delete-role-acl-modal');
  };

  const handleDeleteRoleAcl = async () => {
    if (!moduleId || !subModuleId || !selectedRoleAcl) {
      return { success: false, message: 'Unable to delete role ACL' };
    }
    return roleAclsService.deleteRoleAcl(selectedRoleAcl.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setRoleFilter('');
    setCurrentPage(1);
    filterRoleAcls(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchRoleAcls();
  };

  const handleRefresh = () => {
    setDateFilter(null);
    setRoleFilter('');
    setCurrentPage(1);
    fetchRoleAcls();
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRoleFilter(value);
    setDateFilter(null);
    setCurrentPage(1);
    if (value) {
      fetchByRole(value);
    } else {
      fetchRoleAcls();
    }
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!dateFilter && !roleFilter) {
      fetchRoleAcls();
    }
  }, [moduleId, subModuleId, currentPage, fetchRoleAcls]);

  const getPermissionBadges = (acl: RoleAcl) => {
    const permissions = [];
    if (acl.view) permissions.push(<span key="view" className="xui-badge xui-badge-info xui-font-sz-70">View</span>);
    if (acl.add) permissions.push(<span key="add" className="xui-badge xui-badge-success xui-font-sz-70">Add</span>);
    if (acl.edit) permissions.push(<span key="edit" className="xui-badge xui-badge-warning xui-font-sz-70">Edit</span>);
    if (acl.delete) permissions.push(<span key="delete" className="xui-badge xui-badge-danger xui-font-sz-70">Delete</span>);
    if (acl.elevated_role) permissions.push(<span key="elevated" className="xui-badge xui-badge-default xui-font-sz-70">Elevated</span>);
    return <div className="xui-d-flex xui-flex-wrap xui-grid-gap-half">{permissions}</div>;
  };

  return (
    <div>
      <Navbar title="Role ACLs" subtitle="Manage role access control lists" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <div className="xui-bg-white xui-d-flex xui-flex-wrap-nowrap xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)' }}>
              <div className="xui-w-40 xui-h-40 xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-opacity-6">
                <span className="icon-container"><Search size={16} /></span>
              </div>
              <select
                className="xui-form-input xui-h-fluid-100 xui-bg-white"
                value={roleFilter}
                onChange={handleRoleFilter}
                style={{ minWidth: '200px' }}
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.unique_id} value={role.unique_id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <DateRangeFilter
              id="role-acls"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-role-acls-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || roleAcls.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={handleRefresh}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Refresh
            </button>
            {canAdd && (
              <>
                <button
                  onClick={() => navigate('/dashboard/roles/acls/add-multiple')}
                  className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add Multiple
                </button>
                <button
                  onClick={() => navigate('/dashboard/roles/acls/add')}
                  className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add Role ACL
                </button>
              </>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading role ACLs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load role ACLs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : roleAcls.length === 0 ? (
              <EmptyState
                title="No role ACLs found"
                message={roleFilter ? "No role ACLs match the selected role." : dateFilter ? "No role ACLs match your filter criteria." : "There are no role ACLs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Module</th>
                    <th>Sub Module</th>
                    <th>Permissions</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roleAcls.map((acl) => (
                    <tr key={acl.unique_id}>
                      <td>
                        <span className="xui-font-w-500">{acl.Role?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85">{acl.Module?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-6">{acl.SubModule?.name || '—'}</span>
                      </td>
                      <td>
                        {getPermissionBadges(acl)}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(acl.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/roles/acls/edit/${acl.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(acl)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                                title="Delete"
                              >
                                <TrashCan size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="delete-role-acl-modal"
        title="Delete Role ACL"
        message="Are you sure you want to delete this role ACL? This action cannot be undone."
        itemName={selectedRoleAcl ? `${selectedRoleAcl.Role?.name || ''} — ${selectedRoleAcl.Module?.name || ''}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteRoleAcl}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-role-acls-modal"
        title="Export Role ACLs"
        fileName="role-acls"
        columns={[
          { key: 'Role.name', header: 'Role' },
          { key: 'Module.name', header: 'Module' },
          { key: 'SubModule.name', header: 'Sub Module' },
          { key: 'view', header: 'View' },
          { key: 'add', header: 'Add' },
          { key: 'edit', header: 'Edit' },
          { key: 'delete', header: 'Delete' },
          { key: 'elevated_role', header: 'Elevated Role' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={roleAcls}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default RoleAcls;
