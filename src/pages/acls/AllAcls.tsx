import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Edit, Download } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import aclsService from '../../services/acls.service';
import type { Acl } from '../../services/acls.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllAcls = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [acls, setAcls] = useState<Acl[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAcl, setSelectedAcl] = useState<Acl | null>(null);

  const accessIds = getAccessIds('acls', 'all-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setAcls(response.data);
        setTotalPages(1);
      } else {
        setAcls(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setAcls([]);
    }
  };

  const fetchAcls = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await aclsService.getAcls({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterAcls = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await aclsService.filterAcls({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter ACLs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (acl: Acl) => {
    setSelectedAcl(acl);
    modalShow('delete-acl-modal');
  };

  const handleDeleteAcl = async () => {
    if (!moduleId || !subModuleId || !selectedAcl) {
      return { success: false, message: 'Unable to delete ACL' };
    }
    return aclsService.deleteAcl(selectedAcl.unique_id, {
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
    setCurrentPage(1);
    filterAcls(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchAcls();
  };

  const handleRefresh = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchAcls();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!dateFilter) {
      fetchAcls();
    }
  }, [moduleId, subModuleId, currentPage, fetchAcls]);

  const getPermissionBadges = (acl: Acl) => {
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
      <Navbar title="All ACLs" subtitle="Manage user access control lists" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <DateRangeFilter
              id="acls"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-acls-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || acls.length === 0}
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
                  onClick={() => navigate('/dashboard/acls/add-multiple')}
                  className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add Multiple
                </button>
                <button
                  onClick={() => navigate('/dashboard/acls/add')}
                  className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                  style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                >
                  <span className="icon-container"><Add size={16} /></span>
                  Add ACL
                </button>
              </>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading ACLs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load ACLs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : acls.length === 0 ? (
              <EmptyState
                title="No ACLs found"
                message={dateFilter ? "No ACLs match your filter criteria." : "There are no ACLs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Module</th>
                    <th>Sub Module</th>
                    <th>Permissions</th>
                    <th>Expiring</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {acls.map((acl) => (
                    <tr key={acl.unique_id}>
                      <td>
                        <div>
                          <span className="xui-font-w-500">
                            {acl.User ? `${acl.User.firstname} ${acl.User.lastname}` : 'N/A'}
                          </span>
                          {acl.User?.email && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{acl.User.email}</span>
                          )}
                          {acl.User?.Role && (
                            <span className="xui-d-block xui-font-sz-70 xui-opacity-5">{acl.User.Role.name}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="xui-badge xui-badge-blue">{acl.Module?.name || 'N/A'}</span>
                      </td>
                      <td className="xui-font-sz-90">
                        {acl.SubModule?.name || <span className="xui-opacity-4">—</span>}
                      </td>
                      <td>{getPermissionBadges(acl)}</td>
                      <td className="xui-font-sz-90">
                        {acl.acl_expiring ? (
                          <span style={{ color: new Date(acl.acl_expiring) < new Date() ? 'var(--error)' : 'var(--neutral-700)' }}>
                            {formatDate(acl.acl_expiring)}
                          </span>
                        ) : (
                          <span className="xui-opacity-4">Never</span>
                        )}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(acl.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/acls/edit/${acl.unique_id}`)}
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
        id="delete-acl-modal"
        title="Delete ACL"
        message="Are you sure you want to delete this access control entry? The user will lose access to this module."
        itemName={`${selectedAcl?.User ? `${selectedAcl.User.firstname} ${selectedAcl.User.lastname}` : ''} — ${selectedAcl?.Module?.name || ''}`}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteAcl}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-acls-modal"
        title="Export ACLs"
        fileName="acls"
        columns={[
          { key: 'User.firstname', header: 'First Name' },
          { key: 'User.lastname', header: 'Last Name' },
          { key: 'User.email', header: 'Email' },
          { key: 'Module.name', header: 'Module' },
          { key: 'SubModule.name', header: 'Sub Module' },
          { key: 'view', header: 'View' },
          { key: 'add', header: 'Add' },
          { key: 'edit', header: 'Edit' },
          { key: 'delete', header: 'Delete' },
          { key: 'elevated_role', header: 'Elevated' },
          { key: 'acl_expiring', header: 'Expiring' },
        ]}
        data={acls}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllAcls;
