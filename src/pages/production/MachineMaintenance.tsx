import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import machineMaintenanceLogsService from '../../services/machineMaintenanceLogs.service';
import type { MachineMaintenanceLog } from '../../services/machineMaintenanceLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const MachineMaintenance = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [logs, setLogs] = useState<MachineMaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'machine-maintenance-logs');
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
      const response = await machineMaintenanceLogsService.getMaintenanceLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch maintenance logs'));
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
      const response = await machineMaintenanceLogsService.searchMaintenanceLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search maintenance logs'));
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
      const response = await machineMaintenanceLogsService.filterMaintenanceLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter maintenance logs'));
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
      <Navbar title="Machine Maintenance" subtitle="Track maintenance and repairs on production machinery" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search maintenance logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="maintenance-logs"
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
              onClick={() => modalShow('export-maintenance-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/maintenance/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Log Maintenance
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading maintenance logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load maintenance logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No maintenance logs found"
                message={searchQuery || dateFilter ? "No maintenance logs match your search or filter criteria." : "There are no maintenance logs to display. Click 'Log Maintenance' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Service Date</th>
                    <th>Machine</th>
                    <th>Vendor</th>
                    <th>Cost</th>
                    <th>Next Service</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-font-w-500">
                        {formatDate(log.service_date)}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.Machine ? (
                          <span>{log.Machine.name} ({log.Machine.code})</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.Vendor ? (
                          <span>{log.Vendor.name}</span>
                        ) : (
                          <span className="xui-opacity-5">--</span>
                        )}
                      </td>
                      <td className="xui-font-w-500">
                        {formatCurrency(log.cost)}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.next_service_date ? (
                          formatDate(log.next_service_date)
                        ) : (
                          <span className="xui-opacity-5">--</span>
                        )}
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
        id="export-maintenance-logs-modal"
        title="Export Maintenance Logs"
        fileName="machine-maintenance-logs"
        columns={[
          { key: 'service_date', header: 'Service Date' },
          { key: 'Machine.name', header: 'Machine' },
          { key: 'Machine.code', header: 'Machine Code' },
          { key: 'Vendor.name', header: 'Vendor' },
          { key: 'cost', header: 'Cost' },
          { key: 'next_service_date', header: 'Next Service Date' },
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

export default MachineMaintenance;
