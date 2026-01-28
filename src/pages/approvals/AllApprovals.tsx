import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Checkmark, Close, Download, Search } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import approvalsService from '../../services/approvals.service';
import type { Approval } from '../../services/approvals.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllApprovals = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const accessIds = getAccessIds('approvals', 'all-approvals');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setApprovals(response.data);
        setTotalPages(1);
      } else {
        setApprovals(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setApprovals([]);
    }
  };

  const fetchApprovals = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await approvalsService.getApprovals({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch approvals'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const fetchByStatus = useCallback(async (status: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await approvalsService.getApprovalsSpecifically({
        approval_status: status,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch approvals'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterApprovals = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await approvalsService.filterApprovals({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter approvals'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const handleAccept = async (approval: Approval) => {
    if (!moduleId || !subModuleId) return;

    setActionLoading(approval.unique_id);
    try {
      const response = await approvalsService.acceptApproval(
        { unique_id: approval.unique_id },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );
      if (response.success) {
        setSuccessMessage('Approval accepted successfully');
        showAlert('success-alert');
        fetchApprovals();
      } else {
        setActionError(response.message || 'Failed to accept approval');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setActionError(extractErrorMessage(err, 'Failed to accept approval'));
      showAlert('error-alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (approval: Approval) => {
    if (!moduleId || !subModuleId) return;

    setActionLoading(approval.unique_id);
    try {
      const response = await approvalsService.denyApproval(
        { unique_id: approval.unique_id },
        { module_unique_id: moduleId, sub_module_unique_id: subModuleId }
      );
      if (response.success) {
        setSuccessMessage('Approval denied successfully');
        showAlert('success-alert');
        fetchApprovals();
      } else {
        setActionError(response.message || 'Failed to deny approval');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setActionError(extractErrorMessage(err, 'Failed to deny approval'));
      showAlert('error-alert');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (approval: Approval) => {
    setSelectedApproval(approval);
    modalShow('delete-approval-modal');
  };

  const handleDeleteApproval = async () => {
    if (!moduleId || !subModuleId || !selectedApproval) {
      return { success: false, message: 'Unable to delete approval' };
    }
    return approvalsService.deleteApproval(selectedApproval.unique_id, {
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
    setStatusFilter('');
    setCurrentPage(1);
    filterApprovals(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchApprovals();
  };

  const handleRefresh = () => {
    setDateFilter(null);
    setStatusFilter('');
    setCurrentPage(1);
    fetchApprovals();
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setDateFilter(null);
    setCurrentPage(1);
    if (value) {
      fetchByStatus(value);
    } else {
      fetchApprovals();
    }
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!dateFilter && !statusFilter) {
      fetchApprovals();
    }
  }, [moduleId, subModuleId, currentPage, fetchApprovals]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'xui-badge-warning';
      case 'approved': return 'xui-badge-success';
      case 'denied': return 'xui-badge-danger';
      default: return 'xui-badge-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      default: return status;
    }
  };

  const getPermissionBadges = (approval: Approval) => {
    const permissions = [];
    if (approval.view) permissions.push(<span key="view" className="xui-badge xui-badge-info xui-font-sz-70">View</span>);
    if (approval.add) permissions.push(<span key="add" className="xui-badge xui-badge-success xui-font-sz-70">Add</span>);
    if (approval.edit) permissions.push(<span key="edit" className="xui-badge xui-badge-warning xui-font-sz-70">Edit</span>);
    if (approval.delete) permissions.push(<span key="delete" className="xui-badge xui-badge-danger xui-font-sz-70">Delete</span>);
    if (approval.elevated_role) permissions.push(<span key="elevated" className="xui-badge xui-badge-default xui-font-sz-70">Elevated</span>);
    return <div className="xui-d-flex xui-flex-wrap xui-grid-gap-half">{permissions}</div>;
  };

  return (
    <div>
      <Navbar title="All Approvals" subtitle="Manage pending approvals and requests" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <div className="xui-bg-white xui-d-flex xui-flex-wrap-nowrap xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)' }}>
              <div className="xui-w-40 xui-h-40 xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-opacity-6">
                <span className="icon-container"><Search size={16} /></span>
              </div>
              <select
                className="xui-form-input xui-h-fluid-100 xui-bg-white"
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{ minWidth: '200px' }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <DateRangeFilter
              id="approvals"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-approvals-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || approvals.length === 0}
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
                onClick={() => navigate('/dashboard/approvals/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Request Approval
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading approvals...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load approvals"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : approvals.length === 0 ? (
              <EmptyState
                title="No approvals found"
                message={statusFilter ? "No approvals match the selected status." : dateFilter ? "No approvals match your filter criteria." : "There are no approvals to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Module</th>
                    <th>Sub Module</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval) => (
                    <tr key={approval.unique_id}>
                      <td>
                        <span className="xui-font-w-500">
                          {approval.User ? `${approval.User.firstname} ${approval.User.lastname}` : '—'}
                        </span>
                        {approval.User?.email && (
                          <span className="xui-d-block xui-font-sz-75 xui-opacity-5">{approval.User.email}</span>
                        )}
                      </td>
                      <td>
                        <span className="xui-font-sz-85">{approval.Module?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-6">{approval.SubModule?.name || '—'}</span>
                      </td>
                      <td>
                        {getPermissionBadges(approval)}
                      </td>
                      <td>
                        <span className={`xui-badge ${getStatusBadge(approval.approval_status)} xui-font-sz-70`}>
                          {getStatusText(approval.approval_status)}
                        </span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(approval.createdAt)}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && approval.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAccept(approval)}
                                  disabled={actionLoading === approval.unique_id}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                                  title="Accept"
                                >
                                  <Checkmark size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeny(approval)}
                                  disabled={actionLoading === approval.unique_id}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--warning-light)', border: 'none', color: 'var(--warning)' }}
                                  title="Deny"
                                >
                                  <Close size={16} />
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(approval)}
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
        id="delete-approval-modal"
        title="Delete Approval"
        message="Are you sure you want to delete this approval? This action cannot be undone."
        itemName={selectedApproval ? `${selectedApproval.User?.firstname || ''} ${selectedApproval.User?.lastname || ''} — ${selectedApproval.Module?.name || ''}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteApproval}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-approvals-modal"
        title="Export Approvals"
        fileName="approvals"
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
          { key: 'elevated_role', header: 'Elevated Role' },
          { key: 'approval_status', header: 'Status' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={approvals}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllApprovals;
