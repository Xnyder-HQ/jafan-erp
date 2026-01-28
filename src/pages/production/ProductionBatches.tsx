import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import productionBatchesService from '../../services/productionBatches.service';
import type { ProductionBatch } from '../../services/productionBatches.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const ProductionBatches = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'production-batches');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setBatches(response.data);
        setTotalPages(1);
      } else {
        setBatches(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setBatches([]);
    }
  };

  const fetchBatches = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionBatchesService.getProductionBatches({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch production batches'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchBatches = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchBatches();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionBatchesService.searchProductionBatches({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search production batches'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchBatches]);

  const filterBatches = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionBatchesService.filterProductionBatches({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter production batches'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

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
      searchBatches(value);
    } else {
      fetchBatches();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterBatches(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchBatches();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchBatches();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchBatches();
    }
  }, [moduleId, subModuleId, currentPage, fetchBatches]);

  return (
    <div>
      <Navbar title="Production Batches" subtitle="Track and manage production batch records" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search batches..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="production-batches"
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
              <span className="icon-container"><Renew size={16} /></span>
              Refresh
            </button>
            <button
              onClick={() => modalShow('export-batches-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || batches.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/daily/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Log Production
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading production batches...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load production batches"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : batches.length === 0 ? (
              <EmptyState
                title="No production batches found"
                message={searchQuery || dateFilter ? "No batches match your search or filter criteria." : "There are no production batches to display. Click 'Log Production' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Production Date</th>
                    <th>Finished Good</th>
                    <th>Machine</th>
                    <th>Qty Produced</th>
                    <th>Shift</th>
                    <th>Team</th>
                    <th>Logged By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.unique_id}>
                      <td className="xui-font-w-500">
                        {formatDate(batch.production_date)}
                      </td>
                      <td>
                        <div>
                          {batch.FinishedGood?.unique_id ? (
                            <a
                              onClick={() => navigate(`/dashboard/inventory/finished-goods/edit/${batch.FinishedGood?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View finished good details"
                            >
                              {batch.FinishedGood?.name || 'N/A'}
                            </a>
                          ) : (
                            <span className="xui-font-w-500">{batch.FinishedGood?.name || 'N/A'}</span>
                          )}
                          {batch.FinishedGood?.type && (
                            <p className="xui-font-sz-80 xui-opacity-5 xui-mt-half">{batch.FinishedGood.type}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        {batch.Machine?.unique_id ? (
                          <a
                            onClick={() => navigate(`/dashboard/users/machines/edit/${batch.Machine?.unique_id}`)}
                            className="xui-cursor-pointer xui-text-decoration-none"
                            style={{ color: 'var(--primary-600)' }}
                            title="View machine details"
                          >
                            {batch.Machine?.name || 'N/A'}
                          </a>
                        ) : (
                          <span>{batch.Machine?.name || 'N/A'}</span>
                        )}
                      </td>
                      <td className="xui-font-w-600" style={{ color: 'var(--success)' }}>
                        {batch.quantity_produced.toLocaleString()}
                      </td>
                      <td>
                        {batch.shift ? (
                          <span className="xui-badge xui-badge-blue">{batch.shift}</span>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td>
                        {batch.ProductionTeam?.unique_id ? (
                          <a
                            onClick={() => navigate(`/dashboard/production/teams/edit/${batch.ProductionTeam?.unique_id}`)}
                            className="xui-badge xui-badge-default xui-cursor-pointer xui-text-decoration-none"
                            title="View production team"
                          >
                            {batch.ProductionTeam.name}
                          </a>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80">
                        {batch.User ? `${batch.User.firstname} ${batch.User.lastname}` : 'N/A'}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(batch.createdAt)}
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

      <Alert id="error-alert" type="error" title="Error" message={fetchError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ExportModal
        id="export-batches-modal"
        title="Export Production Batches"
        fileName="production-batches"
        columns={[
          { key: 'production_date', header: 'Production Date' },
          { key: 'FinishedGood.name', header: 'Finished Good' },
          { key: 'Machine.name', header: 'Machine' },
          { key: 'quantity_produced', header: 'Qty Produced' },
          { key: 'shift', header: 'Shift' },
          { key: 'ProductionTeam.name', header: 'Team' },
          { key: 'notes', header: 'Notes' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={batches}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default ProductionBatches;
