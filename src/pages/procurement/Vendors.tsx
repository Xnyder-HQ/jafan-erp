import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, Phone, Email, User } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import vendorsService from '../../services/vendors.service';
import type { Vendor } from '../../services/vendors.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Vendors = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const accessIds = getAccessIds('procurement-vendor-management', 'vendors');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setVendors(response.data);
        setTotalPages(1);
      } else {
        setVendors(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setVendors([]);
    }
  };

  const fetchVendors = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorsService.getVendors({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch vendors. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchVendors = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchVendors();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorsService.searchVendors({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search vendors'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchVendors]);

  const filterVendors = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await vendorsService.filterVendors({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter vendors'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    modalShow('delete-vendor-modal');
  };

  const handleDeleteVendor = async () => {
    if (!moduleId || !subModuleId || !selectedVendor) {
      return { success: false, message: 'Unable to delete vendor' };
    }

    return vendorsService.deleteVendor(selectedVendor.unique_id, {
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
      searchVendors(value);
    } else {
      fetchVendors();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterVendors(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchVendors();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchVendors();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchVendors();
    }
  }, [moduleId, subModuleId, currentPage, fetchVendors]);

  return (
    <div>
      <Navbar title="Vendors" subtitle="Manage suppliers and vendor relationships" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="vendors"
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
              onClick={() => modalShow('export-vendors-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || vendors.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/procurement/vendors/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Vendor
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading vendors...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load vendors"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : vendors.length === 0 ? (
              <EmptyState
                title="No vendors found"
                message={searchQuery || dateFilter ? "No vendors match your search or filter criteria." : "There are no vendors to display. Click 'Add Vendor' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Total Spend</th>
                    <th>Added</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {vendor.reference}
                      </td>
                      <td className="xui-font-w-500">{vendor.name}</td>
                      <td>
                        {vendor.contact_person ? (
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            <span className="icon-container xui-opacity-6">
                              <User size={14} />
                            </span>
                            <span className="xui-font-sz-80">{vendor.contact_person}</span>
                          </div>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                          {vendor.phone_number && (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-opacity-8">
                              <span className="icon-container">
                                <Phone size={14} />
                              </span>
                              <span className="xui-font-sz-80">{vendor.phone_number}</span>
                            </div>
                          )}
                          {vendor.email && (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-opacity-6">
                              <span className="icon-container">
                                <Email size={14} />
                              </span>
                              <span className="xui-font-sz-80">{vendor.email}</span>
                            </div>
                          )}
                          {!vendor.phone_number && !vendor.email && (
                            <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="xui-badge xui-badge-blue">{vendor.type}</span>
                      </td>
                      <td>
                        <span
                          className="xui-font-w-500"
                          style={{ color: vendor.total_spend > 0 ? 'var(--primary-600)' : 'var(--neutral-500)' }}
                        >
                          {formatCurrency(vendor.total_spend)}
                        </span>
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td>
                        <span className={`xui-badge ${vendor.status === 1 ? 'xui-badge-success' : 'xui-badge-danger'}`}>
                          {vendor.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/vendors/edit/${vendor.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(vendor)}
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
        id="delete-vendor-modal"
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor"
        itemName={selectedVendor?.name}
        onDelete={handleDeleteVendor}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-vendors-modal"
        title="Export Vendors"
        fileName="vendors"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'name', header: 'Name' },
          { key: 'type', header: 'Type' },
          { key: 'contact_person', header: 'Contact Person' },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'address', header: 'Address' },
          { key: 'total_spend', header: 'Total Spend' },
          { key: 'status', header: 'Status' },
        ]}
        data={vendors.map((v) => ({
          ...v,
          status: v.status === 1 ? 'Active' : 'Inactive',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Vendors;
