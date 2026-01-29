import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Download } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import expensesService from '../../services/expenses.service';
import type { Expense } from '../../services/expenses.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Expenses = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const accessIds = getAccessIds('procurement-vendor-management', 'expenses');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setExpenses(response.data);
        setTotalPages(1);
      } else {
        setExpenses(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setExpenses([]);
    }
  };

  const fetchExpenses = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await expensesService.getExpenses({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch expenses'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchExpenses = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchExpenses();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await expensesService.searchExpenses({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search expenses'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchExpenses]);

  const filterExpenses = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await expensesService.filterExpenses({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter expenses'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    modalShow('delete-expense-modal');
  };

  const handleDeleteExpense = async () => {
    if (!moduleId || !subModuleId || !selectedExpense) {
      return { success: false, message: 'Unable to delete expense' };
    }
    return expensesService.deleteExpense(selectedExpense.unique_id, {
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
      searchExpenses(value);
    } else {
      fetchExpenses();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterExpenses(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchExpenses();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchExpenses();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchExpenses();
    }
  }, [moduleId, subModuleId, currentPage, fetchExpenses]);

  const getSourceLabel = (expense: Expense) => {
    if (expense.purchase_order_unique_id) return <span className="xui-badge xui-badge-info">Purchase Order</span>;
    if (expense.fuel_purchase_unique_id) return <span className="xui-badge xui-badge-warning">Fuel Purchase</span>;
    if (expense.vendor_payment_unique_id) return <span className="xui-badge xui-badge-success">Vendor Payment</span>;
    if (expense.machine_maintenance_log_unique_id) return <span className="xui-badge xui-badge-danger">Maintenance</span>;
    if (expense.stacking_log_unique_id) return <span className="xui-badge xui-badge-default">Stacking</span>;
    return <span className="xui-badge xui-badge-blue">Manual</span>;
  };

  return (
    <div>
      <Navbar title="Expenses" subtitle="Track all business expenses and payments" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="procurement-expenses"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-expenses-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || expenses.length === 0}
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
                onClick={() => navigate('/dashboard/procurement/expenses/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Record Expense
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading expenses...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load expenses"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : expenses.length === 0 ? (
              <EmptyState
                title="No expenses found"
                message={searchQuery || dateFilter ? "No expenses match your search or filter criteria." : "There are no expenses to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Source</th>
                    <th>Notes</th>
                    {canDelete && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.unique_id}>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="xui-font-w-500">{expense.category}</td>
                      <td className="xui-font-w-600" style={{ color: 'var(--error)' }}>
                        {formatCurrency(expense.amount)}
                      </td>
                      <td>{getSourceLabel(expense)}</td>
                      <td className="xui-font-sz-90">
                        {expense.notes || <span className="xui-opacity-4">—</span>}
                      </td>
                      {canDelete && (
                        <td>
                          <button
                            onClick={() => openDeleteModal(expense)}
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
        id="delete-expense-modal"
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        itemName={`${selectedExpense?.category || ''} — ${formatCurrency(selectedExpense?.amount || 0)}`}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteExpense}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-expenses-modal"
        title="Export Expenses"
        fileName="expenses"
        columns={[
          { key: 'expense_date', header: 'Date' },
          { key: 'category', header: 'Category' },
          { key: 'amount', header: 'Amount' },
          { key: 'notes', header: 'Notes' },
        ]}
        data={expenses}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Expenses;
