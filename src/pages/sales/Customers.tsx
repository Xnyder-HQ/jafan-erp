import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, Phone, Email } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import customersService from '../../services/customers.service';
import type { Customer } from '../../services/customers.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Customers = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'customers');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
        setTotalPages(1);
      } else {
        setCustomers(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setCustomers([]);
    }
  };

  const fetchCustomers = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await customersService.getCustomers({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch customers. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchCustomers = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchCustomers();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await customersService.searchCustomers({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search customers'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchCustomers]);

  const filterCustomers = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await customersService.filterCustomers({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter customers'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    modalShow('delete-customer-modal');
  };

  const handleDeleteCustomer = async () => {
    if (!moduleId || !subModuleId || !selectedCustomer) {
      return { success: false, message: 'Unable to delete customer' };
    }

    return customersService.deleteCustomer(selectedCustomer.unique_id, {
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
      searchCustomers(value);
    } else {
      fetchCustomers();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterCustomers(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchCustomers();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchCustomers();
    }
  }, [moduleId, subModuleId, currentPage, fetchCustomers]);

  return (
    <div>
      <Navbar title="Customers" subtitle="Manage your customer database" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search customers..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="customers"
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
              onClick={() => modalShow('export-customers-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || customers.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/sales/customers/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Customer
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading customers...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load customers"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No customers found"
                message={searchQuery || dateFilter ? "No customers match your search or filter criteria." : "There are no customers to display. Click 'Add Customer' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {customer.reference}
                      </td>
                      <td className="xui-font-w-500">{customer.name}</td>
                      <td>
                        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                          {customer.phone_number && (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-opacity-8">
                              <span className="icon-container">
                                <Phone size={14} />
                              </span>
                              <span className="xui-font-sz-80">{customer.phone_number}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-opacity-6">
                              <span className="icon-container">
                                <Email size={14} />
                              </span>
                              <span className="xui-font-sz-80">{customer.email}</span>
                            </div>
                          )}
                          {!customer.phone_number && !customer.email && (
                            <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="xui-badge xui-badge-blue">{customer.type}</span>
                      </td>
                      <td>
                        <span
                          className="xui-font-w-500"
                          style={{ color: customer.balance > 0 ? 'var(--success)' : 'var(--neutral-500)' }}
                        >
                          {formatCurrency(customer.balance)}
                        </span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td>
                        <span className={`xui-badge ${customer.status === 1 ? 'xui-badge-success' : 'xui-badge-danger'}`}>
                          {customer.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => navigate(`/dashboard/sales/customers/edit/${customer.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(customer)}
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
        id="delete-customer-modal"
        title="Delete Customer"
        message="Are you sure you want to delete this customer"
        itemName={selectedCustomer?.name}
        onDelete={handleDeleteCustomer}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-customers-modal"
        title="Export Customers"
        fileName="customers"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'name', header: 'Name' },
          { key: 'type', header: 'Type' },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'balance', header: 'Balance' },
          { key: 'billing_address', header: 'Billing Address' },
          { key: 'status', header: 'Status' },
        ]}
        data={customers.map((c) => ({
          ...c,
          status: c.status === 1 ? 'Active' : 'Inactive',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Customers;
