import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, Checkmark, CheckmarkFilled } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import salesOrdersService from '../../services/salesOrders.service';
import type { SalesOrder } from '../../services/salesOrders.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const SalesOrders = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

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
      const response = await salesOrdersService.getSalesOrders({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch sales orders. Please try again.'));
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
      const response = await salesOrdersService.searchSalesOrders({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search sales orders'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchOrders]);

  const filterOrders = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await salesOrdersService.filterSalesOrders({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter sales orders'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (order: SalesOrder) => {
    setSelectedOrder(order);
    modalShow('delete-order-modal');
  };

  const openApproveModal = (order: SalesOrder) => {
    setSelectedOrder(order);
    modalShow('approve-order-modal');
  };

  const openCompleteModal = (order: SalesOrder) => {
    setSelectedOrder(order);
    modalShow('complete-order-modal');
  };

  const handleDeleteOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to delete order' };
    }

    return salesOrdersService.deleteSalesOrder(selectedOrder.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleApproveOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to approve order' };
    }

    return salesOrdersService.approveSalesOrder(selectedOrder.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCompleteOrder = async () => {
    if (!moduleId || !subModuleId || !selectedOrder) {
      return { success: false, message: 'Unable to complete order' };
    }

    return salesOrdersService.completeSalesOrder(selectedOrder.unique_id, {
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
    if (value) {
      setDateFilter(null);
    }
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
        return <span className="xui-badge xui-badge-primary">Processing</span>;
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
      <Navbar title="Sales Orders" subtitle="Manage customer sales orders" />

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
              id="sales-orders"
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
              <span className="icon-container">
                <Renew size={16} />
              </span>
              Refresh
            </button>
            <button
              onClick={() => modalShow('export-orders-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || orders.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/sales/orders/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              New Order
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading sales orders...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load sales orders"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                title="No sales orders found"
                message={searchQuery || dateFilter ? "No orders match your search or filter criteria." : "There are no sales orders to display. Click 'New Order' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payable</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
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
                          {order.Customer?.unique_id ? (
                            <a
                              onClick={() => navigate(`/dashboard/sales/customers/edit/${order.Customer?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View customer details"
                            >
                              {order.Customer?.name || 'N/A'}
                            </a>
                          ) : (
                            <span className="xui-font-w-500">{order.Customer?.name || 'N/A'}</span>
                          )}
                          {order.Customer?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{order.Customer.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="xui-font-w-500">{order.total_items_ordered}</span>
                        <span className="xui-opacity-6 xui-font-sz-80"> ordered</span>
                        {order.total_items_dropped > 0 && (
                          <span className="xui-d-block xui-font-sz-80" style={{ color: 'var(--success)' }}>
                            {order.total_items_dropped} dropped
                          </span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {formatCurrency(order.total_amount)}
                        {order.discount_amount > 0 && (
                          <span className="xui-d-block xui-font-sz-80" style={{ color: 'var(--error)' }}>
                            -{formatCurrency(order.discount_amount)}
                          </span>
                        )}
                      </td>
                      <td className="xui-font-w-600" style={{ color: 'var(--primary-600)' }}>
                        {formatCurrency(order.amount_payable)}
                      </td>
                      <td>{getOrderStatusBadge(order.order_status)}</td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          {!order.approved_by && order.order_status?.toLowerCase() === 'pending' && (
                            <button
                              onClick={() => openApproveModal(order)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                              title="Approve Order"
                            >
                              <Checkmark size={16} />
                            </button>
                          )}
                          {order.approved_by && order.order_status?.toLowerCase() !== 'completed' && (
                            <button
                              onClick={() => openCompleteModal(order)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--primary-light)', border: 'none', color: 'var(--primary-600)' }}
                              title="Mark as Completed"
                            >
                              <CheckmarkFilled size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/dashboard/sales/orders/edit/${order.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                            title="View/Edit Order"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(order)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                            title="Delete Order"
                          >
                            <TrashCan size={16} />
                          </button>
                        </div>
                      </td>
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

      <DeleteModal
        id="delete-order-modal"
        title="Delete Sales Order"
        message="Are you sure you want to delete this sales order"
        itemName={selectedOrder?.reference}
        onDelete={handleDeleteOrder}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-orders-modal"
        title="Export Sales Orders"
        fileName="sales-orders"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'Customer.name', header: 'Customer' },
          { key: 'total_items_ordered', header: 'Items Ordered' },
          { key: 'total_amount', header: 'Total Amount' },
          { key: 'discount_amount', header: 'Discount' },
          { key: 'amount_payable', header: 'Amount Payable' },
          { key: 'order_status', header: 'Status' },
          { key: 'createdAt', header: 'Date' },
        ]}
        data={orders}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="approve-order-modal"
        title="Approve Sales Order"
        message="Are you sure you want to approve this sales order"
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
        id="complete-order-modal"
        title="Complete Sales Order"
        message="Are you sure you want to mark this sales order as completed"
        itemName={selectedOrder?.reference}
        confirmText="Complete"
        confirmingText="Completing..."
        confirmButtonStyle="primary"
        onConfirm={handleCompleteOrder}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default SalesOrders;
