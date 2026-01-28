import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, Edit, TrashCan, Checkmark, CheckmarkFilled, Download } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import purchaseOrdersService from '../../services/purchaseOrders.service';
import type { PurchaseOrder } from '../../services/purchaseOrders.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const accessIds = getAccessIds('procurement-vendor-management', 'purchase-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');
  const canApprove = accessResult.accessTypes.includes('elevated_role');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setOrders(response.data);
        setTotalPages(1);
      } else {
        setOrders(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setOrders([]);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await purchaseOrdersService.getPurchaseOrders({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      console.log(response);
      
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch purchase orders.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchOrders = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchOrders();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await purchaseOrdersService.searchPurchaseOrders({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search purchase orders'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchOrders]);

  const filterOrders = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await purchaseOrdersService.filterPurchaseOrders({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter purchase orders'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    modalShow('delete-po-modal');
  };

  const openApproveModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    modalShow('approve-po-modal');
  };

  const openCompleteModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    modalShow('complete-po-modal');
  };

  const handleDeleteOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to delete order' };
    }
    return purchaseOrdersService.deletePurchaseOrder(selectedOrder.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleApproveOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to approve order' };
    }
    return purchaseOrdersService.approvePurchaseOrder(selectedOrder.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCompleteOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to complete order' };
    }
    return purchaseOrdersService.completePurchaseOrder(selectedOrder.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value) setDateFilter(null);
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      searchOrders(value);
    } else {
      fetchOrders();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterOrders(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchOrders();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchOrders();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchOrders();
    }
  }, [moduleId, subModuleId, currentPage, fetchOrders]);

  const getOrderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="xui-badge xui-badge-warning">Pending</span>;
      case 'approved':
        return <span className="xui-badge xui-badge-info">Approved</span>;
      case 'processing':
        return <span className="xui-badge xui-badge-info">Processing</span>;
      case 'completed':
        return <span className="xui-badge xui-badge-success">Completed</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'unpaid':
        return <span className="xui-badge xui-badge-danger">Unpaid</span>;
      case 'partially_paid':
        return <span className="xui-badge xui-badge-warning">Partial</span>;
      case 'paid':
        return <span className="xui-badge xui-badge-success">Paid</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="xui-badge xui-badge-warning">Pending</span>;
      case 'partially_delivered':
        return <span className="xui-badge xui-badge-info">Partial</span>;
      case 'delivered':
        return <span className="xui-badge xui-badge-success">Delivered</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  return (
    <div>
      <Navbar title="Purchase Orders" subtitle="Manage purchase orders and procurement" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search orders..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="purchase-orders"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-po-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || orders.length === 0}
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
                onClick={() => navigate('/dashboard/procurement/orders/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                New Purchase Order
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading purchase orders...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load purchase orders"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                title="No purchase orders found"
                message={searchQuery || dateFilter ? "No orders match your search or filter criteria." : "There are no purchase orders to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Vendor</th>
                    <th>PO Type</th>
                    <th>Raw Material</th>
                    <th>Amount</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Delivery</th>
                    <th>Date</th>
                    {(canEdit || canDelete || canApprove) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {order.reference}
                      </td>
                      <td>
                        <div>
                          {order.Vendor?.unique_id ? (
                            <a
                              onClick={() => navigate(`/dashboard/procurement/vendors/edit/${order.Vendor?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View vendor details"
                            >
                              {order.Vendor?.name || 'N/A'}
                            </a>
                          ) : (
                            <span className="xui-font-w-500">{order.Vendor?.name || 'N/A'}</span>
                          )}
                          {order.Vendor?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{order.Vendor.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="xui-text-capitalize xui-font-sz-90">{order.po_type}</td>
                      <td>
                        {order.RawMaterial?.unique_id ? (
                          <div>
                            <a
                              onClick={() => navigate(`/dashboard/inventory/raw-materials/edit/${order.RawMaterial?.unique_id}`)}
                              className="xui-font-w-500 xui-font-sz-90 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View raw material details"
                            >
                              {order.RawMaterial.name}
                            </a>
                            {order.quantity && (
                              <span className="xui-d-block xui-font-sz-80 xui-opacity-6">
                                Qty: {order.quantity} {order.RawMaterial.unit_of_measure || ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="xui-opacity-4">—</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <span className="xui-font-w-600">{formatCurrency(order.total_amount)}</span>
                          {order.balance_due > 0 && (
                            <span className="xui-d-block xui-font-sz-80" style={{ color: 'var(--error)' }}>
                              Bal: {formatCurrency(order.balance_due)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{getOrderStatusBadge(order.order_status)}</td>
                      <td>{getPaymentStatusBadge(order.payment_status)}</td>
                      <td>{getDeliveryStatusBadge(order.delivery_status)}</td>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(order.order_date)}
                      </td>
                      {(canEdit || canDelete || canApprove) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && order.order_status?.toLowerCase() === 'pending' && (
                              <button
                                onClick={() => navigate(`/dashboard/procurement/orders/edit/${order.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canApprove && order.order_status?.toLowerCase() === 'pending' && (
                              <button
                                onClick={() => openApproveModal(order)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                                title="Approve"
                              >
                                <Checkmark size={16} />
                              </button>
                            )}
                            {canApprove && order.order_status?.toLowerCase() === 'processing' && (
                              <button
                                onClick={() => openCompleteModal(order)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                                title="Complete"
                              >
                                <CheckmarkFilled size={16} />
                              </button>
                            )}
                            {canDelete && order.order_status?.toLowerCase() === 'pending' && (
                              <button
                                onClick={() => openDeleteModal(order)}
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
        id="delete-po-modal"
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order"
        itemName={selectedOrder?.reference}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteOrder}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="approve-po-modal"
        title="Approve Purchase Order"
        message="Are you sure you want to approve this purchase order"
        itemName={selectedOrder?.reference}
        confirmText="Approve"
        confirmingText="Approving..."
        confirmButtonStyle="success"
        onConfirm={handleApproveOrder}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="complete-po-modal"
        title="Complete Purchase Order"
        message="Are you sure you want to mark this purchase order as completed"
        itemName={selectedOrder?.reference}
        confirmText="Complete"
        confirmingText="Completing..."
        confirmButtonStyle="success"
        onConfirm={handleCompleteOrder}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-po-modal"
        title="Export Purchase Orders"
        fileName="purchase-orders"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'Vendor.name', header: 'Vendor' },
          { key: 'po_type', header: 'PO Type' },
          { key: 'total_amount', header: 'Total Amount' },
          { key: 'amount_paid', header: 'Amount Paid' },
          { key: 'balance_due', header: 'Balance Due' },
          { key: 'order_status', header: 'Order Status' },
          { key: 'payment_status', header: 'Payment Status' },
          { key: 'delivery_status', header: 'Delivery Status' },
          { key: 'order_date', header: 'Order Date' },
        ]}
        data={orders}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default PurchaseOrders;
