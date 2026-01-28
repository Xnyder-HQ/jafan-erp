import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Download, Renew } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import rawMaterialStockLogsService from '../../services/rawMaterialStockLogs.service';
import type { RawMaterialStockLog } from '../../services/rawMaterialStockLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const RawMaterialStockLogs = () => {
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [logs, setLogs] = useState<RawMaterialStockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('inventory-stock-management', 'raw-material-stock-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setLogs(response.data);
        setTotalPages(1);
      } else {
        setLogs(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setLogs([]);
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialStockLogsService.getStockLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch stock logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchLogs();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialStockLogsService.searchStockLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search stock logs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchLogs]);

  const filterLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialStockLogsService.filterStockLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter stock logs'));
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
      searchLogs(value);
    } else {
      fetchLogs();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterLogs(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchLogs();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchLogs();
  };

  const getMovementBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('in') || lower.includes('add') || lower.includes('restock')) {
      return <span className="xui-badge xui-badge-success">{type}</span>;
    }
    if (lower.includes('out') || lower.includes('used') || lower.includes('consumed')) {
      return <span className="xui-badge xui-badge-danger">{type}</span>;
    }
    if (lower.includes('adjust') || lower.includes('correction')) {
      return <span className="xui-badge xui-badge-warning">{type}</span>;
    }
    return <span className="xui-badge xui-badge-blue">{type}</span>;
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs]);

  return (
    <div>
      <Navbar title="Raw Material Stock Logs" subtitle="Track raw material stock movements and changes" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search stock logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="raw-material-stock-logs"
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
              onClick={() => modalShow('export-stock-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading stock logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load stock logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No stock logs found"
                message={searchQuery || dateFilter ? "No stock logs match your search or filter criteria." : "There are no stock logs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Stock After</th>
                    <th>Source</th>
                    <th>Reference</th>
                    <th>Logged By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td>
                        <div>
                          <span className="xui-font-w-500">{log.RawMaterial?.name || 'N/A'}</span>
                          {log.RawMaterial?.reference && (
                            <p className="xui-font-sz-80 xui-opacity-5 xui-mt-half">{log.RawMaterial.reference}</p>
                          )}
                        </div>
                      </td>
                      <td>{getMovementBadge(log.movement_type)}</td>
                      <td className="xui-font-w-500">
                        {log.quantity.toLocaleString()} {log.RawMaterial?.unit_of_measure || ''}
                      </td>
                      <td>
                        {log.unit_cost != null ? (
                          <span className="xui-font-sz-90">{log.unit_cost.toLocaleString()}</span>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {log.quantity_after.toLocaleString()} {log.RawMaterial?.unit_of_measure || ''}
                      </td>
                      <td>
                        <span className="xui-badge xui-badge-blue">{log.source_module}</span>
                      </td>
                      <td className="xui-font-sz-90" style={{ color: 'var(--primary-600)' }}>
                        {log.reference || <span className="xui-opacity-5">—</span>}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.User ? `${log.User.firstname} ${log.User.lastname}` : 'N/A'}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(log.createdAt)}
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
        id="export-stock-logs-modal"
        title="Export Stock Logs"
        fileName="raw-material-stock-logs"
        columns={[
          { key: 'RawMaterial.name', header: 'Material' },
          { key: 'RawMaterial.reference', header: 'Material Ref' },
          { key: 'movement_type', header: 'Movement Type' },
          { key: 'quantity', header: 'Quantity' },
          { key: 'unit_cost', header: 'Unit Cost' },
          { key: 'quantity_after', header: 'Stock After' },
          { key: 'source_module', header: 'Source' },
          { key: 'reference', header: 'Reference' },
          { key: 'createdAt', header: 'Date' },
        ]}
        data={logs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default RawMaterialStockLogs;
