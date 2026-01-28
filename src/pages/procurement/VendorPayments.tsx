import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Download } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import vendorPaymentsService from '../../services/vendorPayments.service';
import type { VendorPayment } from '../../services/vendorPayments.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const VendorPayments = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<VendorPayment | null>(null);

  const accessIds = getAccessIds('procurement-vendor-management', 'vendor-payments');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setPayments(response.data);
        setTotalPages(1);
      } else {
        setPayments(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setPayments([]);
    }
  };

  const fetchPayments = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorPaymentsService.getVendorPayments({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch vendor payments'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchPayments = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchPayments();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorPaymentsService.searchVendorPayments({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search vendor payments'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchPayments]);

  const filterPayments = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorPaymentsService.filterVendorPayments({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter vendor payments'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (payment: VendorPayment) => {
    setSelectedPayment(payment);
    modalShow('delete-payment-modal');
  };

  const handleDeletePayment = async () => {
    if (!moduleId || !subModuleId || !selectedPayment) {
      return { success: false, message: 'Unable to delete payment' };
    }
    return vendorPaymentsService.deleteVendorPayment(selectedPayment.unique_id, {
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
      searchPayments(value);
    } else {
      fetchPayments();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterPayments(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchPayments();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchPayments();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchPayments();
    }
  }, [moduleId, subModuleId, currentPage, fetchPayments]);

  const getMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'transfer':
        return <span className="xui-badge xui-badge-info">Transfer</span>;
      case 'cash':
        return <span className="xui-badge xui-badge-success">Cash</span>;
      case 'cheque':
        return <span className="xui-badge xui-badge-warning">Cheque</span>;
      case 'pos':
        return <span className="xui-badge xui-badge-info">POS</span>;
      default:
        return <span className="xui-badge">{method}</span>;
    }
  };

  return (
    <div>
      <Navbar title="Vendor Payments" subtitle="Track payments made to vendors" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search payments..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="vendor-payments"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-payments-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || payments.length === 0}
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
                onClick={() => navigate('/dashboard/procurement/payments/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Record Payment
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading vendor payments...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load vendor payments"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : payments.length === 0 ? (
              <EmptyState
                title="No vendor payments found"
                message={searchQuery || dateFilter ? "No payments match your search or filter criteria." : "There are no vendor payments to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Receipt Ref</th>
                    <th>Purchase Order</th>
                    <th>Recorded By</th>
                    {canDelete && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.unique_id}>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td>
                        <div>
                          {payment.Vendor?.unique_id ? (
                            <a
                              onClick={() => navigate(`/dashboard/procurement/vendors/edit/${payment.Vendor?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View vendor details"
                            >
                              {payment.Vendor?.name || 'N/A'}
                            </a>
                          ) : (
                            <span className="xui-font-w-500">{payment.Vendor?.name || 'N/A'}</span>
                          )}
                          {payment.Vendor?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{payment.Vendor.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="xui-font-w-600">{formatCurrency(payment.amount_paid)}</td>
                      <td>{getMethodBadge(payment.payment_method)}</td>
                      <td className="xui-font-sz-90">
                        {payment.receipt_reference || <span className="xui-opacity-4">—</span>}
                      </td>
                      <td>
                        {payment.PurchaseOrder?.unique_id ? (
                          <div>
                            <a
                              onClick={() => navigate(`/dashboard/procurement/orders/edit/${payment.PurchaseOrder?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View purchase order"
                            >
                              {payment.PurchaseOrder.reference}
                            </a>
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{payment.PurchaseOrder.po_type}</span>
                          </div>
                        ) : (
                          <span className="xui-opacity-4">—</span>
                        )}
                      </td>
                      <td className="xui-font-sz-90">
                        {payment.Creator ? `${payment.Creator.firstname} ${payment.Creator.lastname}` : 'N/A'}
                      </td>
                      {canDelete && (
                        <td>
                          <button
                            onClick={() => openDeleteModal(payment)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                            title="Delete"
                          >
                            <TrashCan size={16} />
                          </button>
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
        id="delete-payment-modal"
        title="Delete Vendor Payment"
        message="Are you sure you want to delete this payment? This will revert the vendor's total spend and update the linked purchase order."
        itemName={`${formatCurrency(selectedPayment?.amount_paid || 0)} to ${selectedPayment?.Vendor?.name || 'vendor'}`}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeletePayment}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-payments-modal"
        title="Export Vendor Payments"
        fileName="vendor-payments"
        columns={[
          { key: 'payment_date', header: 'Date' },
          { key: 'Vendor.name', header: 'Vendor' },
          { key: 'amount_paid', header: 'Amount' },
          { key: 'payment_method', header: 'Method' },
          { key: 'receipt_reference', header: 'Receipt Ref' },
          { key: 'PurchaseOrder.reference', header: 'Purchase Order' },
          { key: 'PurchaseOrder.po_type', header: 'PO Type' },
          { key: 'Creator.firstname', header: 'Recorded By' },
        ]}
        data={payments}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default VendorPayments;
