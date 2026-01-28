import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, TrashCan, Download, Edit } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import fuelPurchasesService from '../../services/fuelPurchases.service';
import type { FuelPurchase } from '../../services/fuelPurchases.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const FuelPurchases = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [purchases, setPurchases] = useState<FuelPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPurchase, setSelectedPurchase] = useState<FuelPurchase | null>(null);

  const accessIds = getAccessIds('procurement-vendor-management', 'fuel-purchases');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setPurchases(response.data);
        setTotalPages(1);
      } else {
        setPurchases(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setPurchases([]);
    }
  };

  const fetchPurchases = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await fuelPurchasesService.getFuelPurchases({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch fuel purchases'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchPurchases = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchPurchases();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await fuelPurchasesService.searchFuelPurchases({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search fuel purchases'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchPurchases]);

  const filterPurchases = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await fuelPurchasesService.filterFuelPurchases({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter fuel purchases'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (purchase: FuelPurchase) => {
    setSelectedPurchase(purchase);
    modalShow('delete-fuel-purchase-modal');
  };

  const handleDeletePurchase = async () => {
    if (!moduleId || !subModuleId || !selectedPurchase) {
      return { success: false, message: 'Unable to delete fuel purchase' };
    }
    return fuelPurchasesService.deleteFuelPurchase(selectedPurchase.unique_id, {
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
      searchPurchases(value);
    } else {
      fetchPurchases();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterPurchases(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchPurchases();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchPurchases();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchPurchases();
    }
  }, [moduleId, subModuleId, currentPage, fetchPurchases]);

  const getFuelTypeBadge = (fuelType: string) => {
    switch (fuelType?.toLowerCase()) {
      case 'diesel':
        return <span className="xui-badge xui-badge-info">Diesel</span>;
      case 'petrol':
        return <span className="xui-badge xui-badge-warning">Petrol</span>;
      default:
        return <span className="xui-badge">{fuelType}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="xui-badge xui-badge-success">Paid</span>;
      case 'unpaid':
        return <span className="xui-badge xui-badge-danger">Unpaid</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="xui-badge xui-badge-success">Delivered</span>;
      case 'partially_delivered':
        return <span className="xui-badge xui-badge-warning">Partially Delivered</span>;
      case 'pending':
        return <span className="xui-badge xui-badge-default">Pending</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  return (
    <div>
      <Navbar title="Fuel Purchases" subtitle="Track fuel procurement and costs" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search fuel purchases..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="fuel-purchases"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-fuel-purchases-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || purchases.length === 0}
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
                onClick={() => navigate('/dashboard/procurement/fuel/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Record Purchase
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading fuel purchases...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load fuel purchases"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : purchases.length === 0 ? (
              <EmptyState
                title="No fuel purchases found"
                message={searchQuery || dateFilter ? "No purchases match your search or filter criteria." : "There are no fuel purchases to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Fuel Type</th>
                    <th>Liters</th>
                    <th>Price/Liter</th>
                    <th>Total Cost</th>
                    <th>Payment</th>
                    <th>Delivery</th>
                    <th>Recorded By</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.unique_id}>
                      <td className="xui-font-w-600" style={{ color: 'var(--primary-600)' }}>
                        {purchase.reference}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td>
                        <div>
                          <span className="xui-font-w-500">{purchase.Vendor?.name || 'N/A'}</span>
                          {purchase.Vendor?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{purchase.Vendor.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td>{getFuelTypeBadge(purchase.fuel_type)}</td>
                      <td className="xui-font-w-500">{purchase.liters_purchased}L</td>
                      <td>{formatCurrency(purchase.price_per_liter)}</td>
                      <td className="xui-font-w-600">{formatCurrency(purchase.total_cost)}</td>
                      <td>{getPaymentStatusBadge(purchase.payment_status)}</td>
                      <td>{getDeliveryStatusBadge(purchase.delivery_status)}</td>
                      <td className="xui-font-sz-90">
                        {purchase.User ? `${purchase.User.firstname} ${purchase.User.lastname}` : 'N/A'}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/procurement/fuel/edit/${purchase.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(purchase)}
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
        id="delete-fuel-purchase-modal"
        title="Delete Fuel Purchase"
        message="Are you sure you want to delete this fuel purchase? This can only be done if the purchase is unpaid and delivery is pending."
        itemName={`${selectedPurchase?.reference || ''} — ${selectedPurchase?.liters_purchased || 0}L ${selectedPurchase?.fuel_type || ''}`}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeletePurchase}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-fuel-purchases-modal"
        title="Export Fuel Purchases"
        fileName="fuel-purchases"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'purchase_date', header: 'Date' },
          { key: 'Vendor.name', header: 'Vendor' },
          { key: 'fuel_type', header: 'Fuel Type' },
          { key: 'liters_purchased', header: 'Liters' },
          { key: 'price_per_liter', header: 'Price/Liter' },
          { key: 'total_cost', header: 'Total Cost' },
          { key: 'payment_status', header: 'Payment Status' },
          { key: 'delivery_status', header: 'Delivery Status' },
          { key: 'User.firstname', header: 'Recorded By' },
        ]}
        data={purchases}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default FuelPurchases;
