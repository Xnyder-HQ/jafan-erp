import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import stackingLogsService from '../../services/stackingLogs.service';
import type { StackingLog as StackingLogEntry } from '../../services/stackingLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const StackingLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [logs, setLogs] = useState<StackingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'stacking-logs');
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
      const response = await stackingLogsService.getStackingLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch stacking logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage]);

  const searchLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchLogs();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await stackingLogsService.searchStackingLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search stacking logs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs]);

  const filterLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await stackingLogsService.filterStackingLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter stacking logs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage]);

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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs]);

  return (
    <div>
      <Navbar title="Stacking Log" subtitle="Track block stacking and handling expenses" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search stacking logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="stacking-logs"
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
              onClick={() => modalShow('export-stacking-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/stacking/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Log Stacking
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading stacking logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load stacking logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No stacking logs found"
                message={searchQuery || dateFilter ? "No stacking logs match your search or filter criteria." : "There are no stacking logs to display. Click 'Log Stacking' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Stack Date</th>
                    <th>Finished Good</th>
                    <th>Blocks Stacked</th>
                    <th>Rate (₦/block)</th>
                    <th>Breakage</th>
                    <th>Total Cost</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-font-w-500">
                        {formatDate(log.stack_date)}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.FinishedGood ? (
                          <span>
                            {log.FinishedGood.name}
                            {log.FinishedGood.type && (
                              <span className="xui-badge xui-badge-blue xui-ml-half">{log.FinishedGood.type}</span>
                            )}
                          </span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {log.blocks_stacked.toLocaleString()}
                      </td>
                      <td className="xui-font-sz-80">
                        {formatCurrency(log.stacking_rate)}
                      </td>
                      <td>
                        <span style={{ color: log.breakage_quantity > 0 ? 'var(--error)' : 'var(--neutral-500)' }}>
                          {log.breakage_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="xui-font-w-500">
                        {formatCurrency(log.total_cost)}
                      </td>
                      <td className="xui-font-sz-80" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.notes || <span className="xui-opacity-5">--</span>}
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
        id="export-stacking-logs-modal"
        title="Export Stacking Logs"
        fileName="stacking-logs"
        columns={[
          { key: 'stack_date', header: 'Stack Date' },
          { key: 'FinishedGood.name', header: 'Finished Good' },
          { key: 'FinishedGood.type', header: 'Type' },
          { key: 'blocks_stacked', header: 'Blocks Stacked' },
          { key: 'stacking_rate', header: 'Rate (₦/block)' },
          { key: 'breakage_quantity', header: 'Breakage' },
          { key: 'total_cost', header: 'Total Cost' },
          { key: 'notes', header: 'Notes' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={logs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default StackingLog;
