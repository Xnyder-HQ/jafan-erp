import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, Checkmark } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import discountsService from '../../services/discounts.service';
import type { Discount } from '../../services/discounts.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Discounts = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setDiscounts(response.data);
        setTotalPages(1);
      } else {
        setDiscounts(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setDiscounts([]);
    }
  };

  const fetchDiscounts = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await discountsService.getDiscounts({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      console.log(response);

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch discounts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchDiscounts = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchDiscounts();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await discountsService.searchDiscounts({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search discounts'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchDiscounts]);

  const filterDiscounts = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await discountsService.filterDiscounts({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter discounts'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    modalShow('delete-discount-modal');
  };

  const handleDeleteDiscount = async () => {
    if (!moduleId || !subModuleId || !selectedDiscount) {
      return { success: false, message: 'Unable to delete discount' };
    }

    return discountsService.deleteDiscount(selectedDiscount.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const openApproveModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    modalShow('approve-discount-modal');
  };

  const handleApproveDiscount = async () => {
    if (!moduleId || !subModuleId || !selectedDiscount) {
      return { success: false, message: 'Unable to approve discount' };
    }
    return discountsService.approveDiscount(selectedDiscount.unique_id, {
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
      searchDiscounts(value);
    } else {
      fetchDiscounts();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterDiscounts(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchDiscounts();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchDiscounts();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchDiscounts();
    }
  }, [moduleId, subModuleId, currentPage, fetchDiscounts]);

  const getStatusBadge = (discount: Discount) => {
    if (discount.approved_by) {
      return <span className="xui-badge xui-badge-success">Approved</span>;
    }
    return <span className="xui-badge xui-badge-warning">Pending</span>;
  };

  return (
    <div>
      <Navbar title="Discounts" subtitle="Manage sales order discounts" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search discounts..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="discounts"
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
              onClick={() => modalShow('export-discounts-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || discounts.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/sales/discounts/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Discount
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading discounts...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load discounts"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : discounts.length === 0 ? (
              <EmptyState
                title="No discounts found"
                message={searchQuery || dateFilter ? "No discounts match your search or filter criteria." : "There are no discounts to display. Click 'Add Discount' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Sales Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => (
                    <tr key={discount.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {discount.SalesOrder?.reference || 'N/A'}
                      </td>
                      <td>{discount.SalesOrder?.Customer?.name || 'N/A'}</td>
                      <td className="xui-font-w-500" style={{ color: 'var(--error)' }}>
                        -{formatCurrency(discount.discount_amount)}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {discount.reason ? (
                          discount.reason.length > 50 ? `${discount.reason.substring(0, 50)}...` : discount.reason
                        ) : (
                          <span className="xui-opacity-5">No reason provided</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80">
                        {discount.Creator ? `${discount.Creator.firstname} ${discount.Creator.lastname}` : 'N/A'}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(discount.createdAt)}
                      </td>
                      <td>{getStatusBadge(discount)}</td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          {!discount.approved_by && (
                            <button
                              onClick={() => openApproveModal(discount)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--success-light)', border: 'none', color: 'var(--success)' }}
                              title="Approve Discount"
                            >
                              <Checkmark size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/dashboard/sales/discounts/edit/${discount.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(discount)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
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
        id="delete-discount-modal"
        title="Delete Discount"
        message="Are you sure you want to delete this discount"
        itemName={selectedDiscount?.SalesOrder?.reference ? `Discount for ${selectedDiscount.SalesOrder.reference}` : undefined}
        onDelete={handleDeleteDiscount}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="approve-discount-modal"
        title="Approve Discount"
        message="Are you sure you want to approve this discount"
        itemName={selectedDiscount?.SalesOrder?.reference ? `${formatCurrency(selectedDiscount.discount_amount)} off ${selectedDiscount.SalesOrder.reference}` : undefined}
        confirmText="Approve"
        confirmingText="Approving..."
        confirmButtonStyle="success"
        onConfirm={handleApproveDiscount}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-discounts-modal"
        title="Export Discounts"
        fileName="discounts"
        columns={[
          { key: 'SalesOrder.reference', header: 'Sales Order' },
          { key: 'SalesOrder.Customer.name', header: 'Customer' },
          { key: 'discount_amount', header: 'Amount' },
          { key: 'reason', header: 'Reason' },
          { key: 'createdAt', header: 'Date' },
          { key: 'status', header: 'Status' },
        ]}
        data={discounts.map((d) => ({
          ...d,
          status: d.approved_by ? 'Approved' : 'Pending',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Discounts;
