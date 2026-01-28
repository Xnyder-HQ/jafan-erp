import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Renew, Checkmark, Close, Play, Edit, TrashCan } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import deliveryAssignmentsService from '../../services/deliveryAssignments.service';
import type { DeliveryAssignment } from '../../services/deliveryAssignments.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const DeliveryQueue = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);

  const accessIds = getAccessIds('logistics-supply-chain', 'delivery-assignments');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canEdit = accessResult.accessTypes.includes('edit');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setAssignments(response.data);
        setTotalPages(1);
      } else {
        setAssignments(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setAssignments([]);
    }
  };

  const fetchAssignments = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await deliveryAssignmentsService.getDeliveryAssignments({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch delivery assignments.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage]);

  const searchAssignments = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchAssignments();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await deliveryAssignmentsService.searchDeliveryAssignments({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search delivery assignments'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, fetchAssignments]);

  const filterAssignments = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await deliveryAssignmentsService.filterDeliveryAssignments({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter delivery assignments'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage]);

  const openStartModal = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    modalShow('start-delivery-modal');
  };

  const openCompleteModal = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    modalShow('complete-delivery-modal');
  };

  const openCancelModal = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    modalShow('cancel-delivery-modal');
  };

  const openDeleteModal = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    modalShow('delete-delivery-modal');
  };

  const handleStartDelivery = async () => {
    if (!moduleId || !subModuleId || !selectedAssignment) {
      return { success: false, message: 'Unable to start delivery' };
    }
    return deliveryAssignmentsService.startDeliveryAssignment(selectedAssignment.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCompleteDelivery = async () => {
    if (!moduleId || !subModuleId || !selectedAssignment) {
      return { success: false, message: 'Unable to complete delivery' };
    }
    return deliveryAssignmentsService.completeDeliveryAssignment(selectedAssignment.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCancelDelivery = async () => {
    if (!moduleId || !subModuleId || !selectedAssignment) {
      return { success: false, message: 'Unable to cancel delivery' };
    }
    return deliveryAssignmentsService.cancelDeliveryAssignment(selectedAssignment.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleDeleteDelivery = async () => {
    if (!moduleId || !subModuleId || !selectedAssignment) {
      return { success: false, message: 'Unable to delete delivery assignment' };
    }
    return deliveryAssignmentsService.deleteDeliveryAssignment(selectedAssignment.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value) setDateFilter(null);
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      searchAssignments(value);
    } else {
      fetchAssignments();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterAssignments(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchAssignments();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchAssignments();
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchAssignments();
    }
  }, [moduleId, subModuleId, currentPage, fetchAssignments]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="xui-badge xui-badge-warning">Pending</span>;
      case 'in transit':
        return <span className="xui-badge xui-badge-info">In Transit</span>;
      case 'completed':
        return <span className="xui-badge xui-badge-success">Completed</span>;
      case 'cancelled':
        return <span className="xui-badge xui-badge-danger">Cancelled</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  return (
    <div>
      <Navbar title="Delivery Queue" subtitle="Manage and track delivery assignments" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search deliveries..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="delivery-queue"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={handleRefresh}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Refresh
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading delivery assignments...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load delivery assignments"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : assignments.length === 0 ? (
              <EmptyState
                title="No delivery assignments found"
                message={searchQuery || dateFilter ? "No assignments match your search or filter criteria." : "There are no delivery assignments to display. Assignments are created automatically when a sales order is approved."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Amount Payable</th>
                    <th>Items</th>
                    <th>Vehicle</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Created</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.unique_id}>
                      <td>
                        {assignment.SalesOrder?.unique_id ? (
                          <a
                            onClick={() => navigate(`/dashboard/sales/orders/edit/${assignment.SalesOrder?.unique_id}`)}
                            className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                            style={{ color: 'var(--primary-600)' }}
                            title="View sales order"
                          >
                            {assignment.SalesOrder?.reference || 'N/A'}
                          </a>
                        ) : (
                          <span className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>N/A</span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {assignment.SalesOrder ? formatCurrency(assignment.SalesOrder.amount_payable) : 'N/A'}
                      </td>
                      <td className="xui-font-sz-80">
                        {assignment.SalesOrder ? (
                          <span>{assignment.SalesOrder.total_items_dropped}/{assignment.SalesOrder.total_items_ordered} dropped</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td>
                        {assignment.Vehicle?.unique_id ? (
                          <div>
                            <a
                              onClick={() => navigate(`/dashboard/users/vehicles/edit/${assignment.Vehicle?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View vehicle details"
                            >
                              {assignment.Vehicle.plate_number}
                            </a>
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{assignment.Vehicle.type}</span>
                          </div>
                        ) : (
                          <span className="xui-opacity-4">Unassigned</span>
                        )}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(assignment.scheduled_date)}
                      </td>
                      <td>{getStatusBadge(assignment.assignment_status)}</td>
                      <td className="xui-opacity-6 xui-font-sz-80" style={{ maxWidth: '200px' }}>
                        {assignment.notes ? assignment.notes : <span className="xui-opacity-4">—</span>}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(assignment.createdAt)}
                      </td>
                      {canEdit && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            <button
                              onClick={() => navigate(`/dashboard/logistics/queue/edit/${assignment.unique_id}`)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {assignment.assignment_status?.toLowerCase() === 'pending' && (
                              <>
                                <button
                                  onClick={() => openStartModal(assignment)}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                  title="Start Delivery"
                                >
                                  <Play size={16} />
                                </button>
                                <button
                                  onClick={() => openCancelModal(assignment)}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                                  title="Cancel Delivery"
                                >
                                  <Close size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(assignment)}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                                  title="Delete Assignment"
                                >
                                  <TrashCan size={16} />
                                </button>
                              </>
                            )}
                            {assignment.assignment_status?.toLowerCase() === 'in transit' && (
                              <button
                                onClick={() => openCompleteModal(assignment)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                                title="Mark as Completed"
                              >
                                <Checkmark size={16} />
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
        id="start-delivery-modal"
        title="Start Delivery"
        message="Are you sure you want to mark this delivery as in transit"
        itemName={selectedAssignment?.SalesOrder?.reference}
        confirmText="Start"
        confirmingText="Starting..."
        confirmButtonStyle="primary"
        onConfirm={handleStartDelivery}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="complete-delivery-modal"
        title="Complete Delivery"
        message="Are you sure you want to mark this delivery as completed"
        itemName={selectedAssignment?.SalesOrder?.reference}
        confirmText="Complete"
        confirmingText="Completing..."
        confirmButtonStyle="success"
        onConfirm={handleCompleteDelivery}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="cancel-delivery-modal"
        title="Cancel Delivery"
        message="Are you sure you want to cancel this delivery assignment"
        itemName={selectedAssignment?.SalesOrder?.reference}
        confirmText="Cancel Delivery"
        confirmingText="Cancelling..."
        confirmButtonStyle="danger"
        onConfirm={handleCancelDelivery}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="delete-delivery-modal"
        title="Delete Delivery Assignment"
        message="Are you sure you want to permanently delete this delivery assignment? This action cannot be undone"
        itemName={selectedAssignment?.SalesOrder?.reference}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteDelivery}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default DeliveryQueue;
