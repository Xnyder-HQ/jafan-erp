import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, Close, Money } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import invoicesService from '../../services/invoices.service';
import type { Invoice } from '../../services/invoices.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal, ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Invoices = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'invoices');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setInvoices(response.data);
        setTotalPages(1);
      } else {
        setInvoices(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setInvoices([]);
    }
  };

  const fetchInvoices = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await invoicesService.getInvoices({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch invoices. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchInvoices = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchInvoices();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await invoicesService.searchInvoices({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search invoices'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchInvoices]);

  const filterInvoices = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await invoicesService.filterInvoices({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter invoices'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    modalShow('delete-invoice-modal');
  };

  const openCancelModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    modalShow('cancel-invoice-modal');
  };

  const handleDeleteInvoice = async () => {
    if (!moduleId || !subModuleId || !selectedInvoice) {
      return { success: false, message: 'Unable to delete invoice' };
    }

    return invoicesService.deleteInvoice(selectedInvoice.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCancelInvoice = async () => {
    if (!moduleId || !subModuleId || !selectedInvoice) {
      return { success: false, message: 'Unable to cancel invoice' };
    }

    return invoicesService.cancelInvoice(selectedInvoice.unique_id, {
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
      searchInvoices(value);
    } else {
      fetchInvoices();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterInvoices(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchInvoices();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchInvoices();
    }
  }, [moduleId, subModuleId, currentPage, fetchInvoices]);

  const getInvoiceStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="xui-badge xui-badge-success">Paid</span>;
      case 'partially_paid':
        return <span className="xui-badge xui-badge-info">Partially Paid</span>;
      case 'unpaid':
        return <span className="xui-badge xui-badge-warning">Unpaid</span>;
      case 'cancelled':
        return <span className="xui-badge xui-badge-danger">Cancelled</span>;
      case 'overdue':
        return <span className="xui-badge xui-badge-danger">Overdue</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  const getInvoiceTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'credit':
        return <span className="xui-font-sz-80 xui-opacity-7">Credit</span>;
      case 'immediate':
        return <span className="xui-font-sz-80 xui-opacity-7">Immediate</span>;
      default:
        return <span className="xui-font-sz-80 xui-opacity-7">{type}</span>;
    }
  };

  return (
    <div>
      <Navbar title="Invoices" subtitle="Manage customer invoices and payments" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="invoices"
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
              onClick={() => modalShow('export-invoices-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || invoices.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/sales/invoices/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              New Invoice
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading invoices...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load invoices"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : invoices.length === 0 ? (
              <EmptyState
                title="No invoices found"
                message={searchQuery || dateFilter ? "No invoices match your search or filter criteria." : "There are no invoices to display. Click 'New Invoice' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Sales Order</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th className='xui-min-w-200'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {invoice.SalesOrder?.reference || 'N/A'}
                      </td>
                      <td>
                        <div>
                          <span className="xui-font-w-500">{invoice.Customer?.name || 'N/A'}</span>
                          {invoice.Customer?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{invoice.Customer.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td>{getInvoiceTypeBadge(invoice.invoice_type)}</td>
                      <td className="xui-font-w-500">
                        {formatCurrency(invoice.total_amount)}
                        {invoice.discount_amount > 0 && (
                          <span className="xui-d-block xui-font-sz-80" style={{ color: 'var(--error)' }}>
                            -{formatCurrency(invoice.discount_amount)} disc.
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--success)' }}>
                        {formatCurrency(invoice.amount_paid)}
                      </td>
                      <td style={{ color: invoice.balance_due > 0 ? 'var(--error)' : 'var(--neutral-500)' }}>
                        {formatCurrency(invoice.balance_due)}
                      </td>
                      <td>{getInvoiceStatusBadge(invoice.invoice_status)}</td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td>
                        {invoice.invoice_status?.toLowerCase() === 'paid' ? (
                          <span className="xui-font-sz-80 xui-opacity-5">—</span>
                        ) : (
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {invoice.invoice_status?.toLowerCase() !== 'cancelled' && (
                              <>
                                <button
                                  onClick={() => navigate(`/dashboard/sales/invoices/${invoice.unique_id}/payment/add`)}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                                  title="Add Payment"
                                >
                                  <Money size={16} />
                                </button>
                                <button
                                  onClick={() => openCancelModal(invoice)}
                                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                  style={{ backgroundColor: 'var(--warning-light)', border: 'none', color: 'var(--warning)' }}
                                  title="Cancel Invoice"
                                >
                                  <Close size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => navigate(`/dashboard/sales/invoices/edit/${invoice.unique_id}`)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                              title="View/Edit Invoice"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(invoice)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                              title="Delete Invoice"
                            >
                              <TrashCan size={16} />
                            </button>
                          </div>
                        )}
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
        id="delete-invoice-modal"
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice"
        itemName={selectedInvoice?.SalesOrder?.reference}
        onDelete={handleDeleteInvoice}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="cancel-invoice-modal"
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice"
        itemName={selectedInvoice?.SalesOrder?.reference}
        confirmText="Cancel Invoice"
        confirmingText="Cancelling..."
        confirmButtonStyle="warning"
        onConfirm={handleCancelInvoice}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-invoices-modal"
        title="Export Invoices"
        fileName="invoices"
        columns={[
          { key: 'SalesOrder.reference', header: 'Sales Order' },
          { key: 'Customer.name', header: 'Customer' },
          { key: 'invoice_type', header: 'Type' },
          { key: 'total_amount', header: 'Total Amount' },
          { key: 'amount_paid', header: 'Amount Paid' },
          { key: 'balance_due', header: 'Balance Due' },
          { key: 'invoice_status', header: 'Status' },
          { key: 'due_date', header: 'Due Date' },
        ]}
        data={invoices}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Invoices;
