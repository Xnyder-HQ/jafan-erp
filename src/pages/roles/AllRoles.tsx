import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download, Search } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import rolesService from '../../services/roles.service';
import type { Role } from '../../services/roles.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllRoles = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const accessIds = getAccessIds('roles', 'all-roles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setRoles(response.data);
        setTotalPages(1);
      } else {
        setRoles(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setRoles([]);
    }
  };

  const fetchRoles = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await rolesService.getRoles({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchRolesHandler = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await rolesService.searchRoles({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterRoles = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await rolesService.filterRoles({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter roles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    modalShow('delete-role-modal');
  };

  const handleDeleteRole = async () => {
    if (!moduleId || !subModuleId || !selectedRole) {
      return { success: false, message: 'Unable to delete role' };
    }
    return rolesService.deleteRole(selectedRole.unique_id, {
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
    setSearchQuery('');
    setCurrentPage(1);
    filterRoles(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchRoles();
  };

  const handleRefresh = () => {
    setDateFilter(null);
    setSearchQuery('');
    setCurrentPage(1);
    fetchRoles();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchRoles();
      return;
    }
    setDateFilter(null);
    setCurrentPage(1);
    searchRolesHandler(searchQuery.trim());
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!dateFilter && !searchQuery.trim()) {
      fetchRoles();
    }
  }, [moduleId, subModuleId, currentPage, fetchRoles]);

  return (
    <div>
      <Navbar title="All Roles" subtitle="Manage user roles" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <form onSubmit={handleSearch} className="xui-d-flex xui-flex-ai-center">
              <div className="xui-bg-white xui-d-flex xui-flex-wrap-nowrap xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)' }}>
                <div className="xui-w-40 xui-h-40 xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-opacity-6">
                  <span className="icon-container"><Search size={16} /></span>
                </div>
                <input
                  type="search"
                  className="xui-form-input xui-h-fluid-100 xui-bg-white"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ minWidth: '200px' }}
                />
              </div>
            </form>
            <DateRangeFilter
              id="roles"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-roles-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || roles.length === 0}
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
              <button
                onClick={() => navigate('/dashboard/roles/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Role
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading roles...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load roles"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : roles.length === 0 ? (
              <EmptyState
                title="No roles found"
                message={searchQuery ? "No roles match your search." : dateFilter ? "No roles match your filter criteria." : "There are no roles to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stripped</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.unique_id}>
                      <td>
                        <span className="xui-font-w-500">{role.name}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-6">{role.stripped}</span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(role.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/roles/edit/${role.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(role)}
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
        id="delete-role-modal"
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        itemName={selectedRole?.name || ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteRole}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-roles-modal"
        title="Export Roles"
        fileName="roles"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'stripped', header: 'Stripped' },
          { key: 'description', header: 'Description' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={roles}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllRoles;
