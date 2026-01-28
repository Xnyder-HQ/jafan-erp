import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew } from '@carbon/icons-react';
import { formatDate, formatCurrency, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import finishedGoodsService from '../../services/finishedGoods.service';
import type { FinishedGood } from '../../services/finishedGoods.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const FinishedGoods = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [goods, setGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedGood, setSelectedGood] = useState<FinishedGood | null>(null);

  const accessIds = getAccessIds('inventory-stock-management', 'finished-goods');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setGoods(response.data);
        setTotalPages(1);
      } else {
        setGoods(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setGoods([]);
    }
  };

  const fetchGoods = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await finishedGoodsService.getFinishedGoods({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch finished goods. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchGoods = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchGoods();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await finishedGoodsService.searchFinishedGoods({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search finished goods'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchGoods]);

  const filterGoods = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await finishedGoodsService.filterFinishedGoods({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter finished goods'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (good: FinishedGood) => {
    setSelectedGood(good);
    modalShow('delete-good-modal');
  };

  const handleDeleteGood = async () => {
    if (!moduleId || !subModuleId || !selectedGood) {
      return { success: false, message: 'Unable to delete finished good' };
    }

    return finishedGoodsService.deleteFinishedGood(selectedGood.unique_id, {
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
      searchGoods(value);
    } else {
      fetchGoods();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterGoods(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchGoods();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchGoods();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchGoods();
    }
  }, [moduleId, subModuleId, currentPage, fetchGoods]);

  return (
    <div>
      <Navbar title="Finished Goods" subtitle="Monitor and manage finished goods inventory" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search finished goods..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="finished-goods"
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
              onClick={() => modalShow('export-goods-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || goods.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/inventory/finished-goods/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Finished Good
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading finished goods...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load finished goods"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : goods.length === 0 ? (
              <EmptyState
                title="No finished goods found"
                message={searchQuery || dateFilter ? "No finished goods match your search or filter criteria." : "There are no finished goods to display. Click 'Add Finished Good' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Current Stock</th>
                    <th>Unit Cost</th>
                    <th>Selling Price</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goods.map((good) => (
                    <tr key={good.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {good.reference}
                      </td>
                      <td className="xui-font-w-500">{good.name}</td>
                      <td>
                        {good.type ? (
                          <span className="xui-badge xui-badge-blue">{good.type}</span>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {good.current_quantity.toLocaleString()} {good.unit_of_measure || ''}
                      </td>
                      <td>{formatCurrency(good.unit_cost)}</td>
                      <td className="xui-font-w-600">{formatCurrency(good.selling_price)}</td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(good.createdAt)}
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => navigate(`/dashboard/inventory/finished-goods/edit/${good.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(good)}
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
        id="delete-good-modal"
        title="Delete Finished Good"
        message="Are you sure you want to delete this finished good"
        itemName={selectedGood?.name}
        onDelete={handleDeleteGood}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-goods-modal"
        title="Export Finished Goods"
        fileName="finished-goods"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'name', header: 'Name' },
          { key: 'type', header: 'Type' },
          { key: 'unit_of_measure', header: 'Unit of Measure' },
          { key: 'current_quantity', header: 'Current Quantity' },
          { key: 'unit_cost', header: 'Unit Cost' },
          { key: 'selling_price', header: 'Selling Price' },
          { key: 'description', header: 'Description' },
          { key: 'status', header: 'Status' },
        ]}
        data={goods.map((g) => ({
          ...g,
          status: g.status === 1 ? 'Active' : 'Inactive',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default FinishedGoods;
