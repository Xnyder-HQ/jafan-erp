import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, /* TrashCan, */ Download, View } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import logsService from '../../services/logs.service';
import type { Log } from '../../services/logs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, DateRangeFilter, SearchInput } from '../../components/common';
import { /* ConfirmModal, */ ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllLogs = () => {
  const { getAccessIds /* , checkAccess */ } = useGeneral();
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  // const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  // const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [viewingLog, setViewingLog] = useState<Log | null>(null);

  const accessIds = getAccessIds('logs', 'all-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  // const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  // const canDelete = accessResult.accessTypes.includes('delete');

  // Collect unique types from fetched logs for the filter dropdown
  const uniqueTypes = Array.from(new Set(logs.map(l => l.type).filter(Boolean))).sort();

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
      const response = await logsService.getLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.searchLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const fetchByType = useCallback(async (type: string) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.getLogsSpecifically({
        type,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const filterLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logsService.filterLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  //
  // const openDeleteModal = (log: Log) => {
  //   setSelectedLog(log);
  //   modalShow('delete-log-modal');
  // };

  // const handleDeleteLog = async () => {
  //   if (!moduleId || !subModuleId || !selectedLog) {
  //     return { success: false, message: 'Unable to delete log' };
  //   }
  //   return logsService.deleteLog(selectedLog.unique_id, {
  //     module_unique_id: moduleId,
  //     sub_module_unique_id: subModuleId,
  //   });
  // };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setTypeFilter('');
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
    setDateFilter(null);
    setTypeFilter('');
    setSearchQuery('');
    setCurrentPage(1);
    fetchLogs();
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTypeFilter(value);
    setDateFilter(null);
    setSearchQuery('');
    setCurrentPage(1);
    if (value) {
      fetchByType(value);
    } else {
      fetchLogs();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value) {
      setTypeFilter('');
      setDateFilter(null);
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setTypeFilter('');
      setDateFilter(null);
      searchLogs(value);
    } else {
      fetchLogs();
    }
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!dateFilter && !typeFilter && !searchQuery) {
      fetchLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs, searchQuery]);

  const openViewModal = (log: Log) => {
    setViewingLog(log);
    modalShow('view-log-modal');
  };

  const getTypeBadgeClass = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('error') || lower.includes('delete')) return 'xui-badge-danger';
    if (lower.includes('create') || lower.includes('add') || lower.includes('success')) return 'xui-badge-success';
    if (lower.includes('update') || lower.includes('edit')) return 'xui-badge-info';
    if (lower.includes('login') || lower.includes('auth')) return 'xui-badge-primary';
    if (lower.includes('warning') || lower.includes('logout')) return 'xui-badge-warning';
    return 'xui-badge-default';
  };

  return (
    <div>
      <Navbar title="All Logs" subtitle="System activity logs" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            {uniqueTypes.length > 0 && (
              <div className="xui-bg-white xui-d-flex xui-flex-wrap-nowrap xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-300)' }}>
                <select
                  className="xui-form-input xui-h-fluid-100 xui-bg-white"
                  value={typeFilter}
                  onChange={handleTypeFilter}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}
            <DateRangeFilter
              id="logs"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
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
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No logs found"
                message={searchQuery ? "No logs match your search query." : typeFilter ? "No logs match the selected type." : dateFilter ? "No logs match your filter criteria." : "There are no logs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Created By</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td>
                        <span className={`xui-badge ${getTypeBadgeClass(log.type)} xui-font-sz-70`}>
                          {log.type}
                        </span>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-7" style={{ maxWidth: '400px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.description || '—'}
                        </span>
                      </td>
                      <td className="xui-font-sz-85">
                        {log.User ? (
                          <div>
                            <span className="xui-font-w-500">{log.User.firstname} {log.User.lastname}</span>
                            {log.User.Role && (
                              <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{log.User.Role.name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="xui-opacity-5">System</span>
                        )}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => openViewModal(log)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                            title="View Details"
                          >
                            <View size={16} />
                          </button>
                          {/*
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(log)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                              title="Delete"
                            >
                              <TrashCan size={16} />
                            </button>
                          )}
                          */}
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

      {/* <Alert id="error-alert" type="error" title="Error" message={actionError} /> */}
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      {/*
      <ConfirmModal
        id="delete-log-modal"
        title="Delete Log"
        message="Are you sure you want to delete this log entry? This action cannot be undone."
        itemName={selectedLog ? `${selectedLog.type} — ${selectedLog.description || 'No description'}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteLog}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
      */}

      <ExportModal
        id="export-logs-modal"
        title="Export Logs"
        fileName="logs"
        columns={[
          { key: 'type', header: 'Type' },
          { key: 'description', header: 'Description' },
          { key: 'User.firstname', header: 'Created By' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={logs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      {/* View Log Details Modal */}
      <div className="xui-modal" xui-modal="view-log-modal">
        <div className="xui-modal-content xui-lg-w-fluid-40 xui-w-fluid-90" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <div className="xui-modal-close" xui-modal-close="view-log-modal">&times;</div>
          <h3 className="xui-font-sz-110 xui-font-w-600 xui-mb-1">Log Details</h3>
          {viewingLog && (
            <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Type</span>
                <span className={`xui-badge ${getTypeBadgeClass(viewingLog.type)} xui-font-sz-75`}>
                  {viewingLog.type}
                </span>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Description</span>
                <p className="xui-font-sz-85">{viewingLog.description || '—'}</p>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created By</span>
                <p className="xui-font-sz-85">
                  {viewingLog.User ? (
                    <>
                      {viewingLog.User.firstname} {viewingLog.User.lastname}
                      {viewingLog.User.Role && <span className="xui-opacity-6"> ({viewingLog.User.Role.name})</span>}
                    </>
                  ) : (
                    <span className="xui-opacity-5">System</span>
                  )}
                </p>
              </div>
              <div>
                <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Created</span>
                <p className="xui-font-sz-85">{formatDate(viewingLog.createdAt)}</p>
              </div>
              {viewingLog.content && (
                <div>
                  <span className="xui-font-w-600 xui-font-sz-85 xui-d-block xui-mb-half" style={{ color: 'var(--neutral-500)' }}>Content</span>
                  <pre
                    className="xui-bg-light xui-p-1 xui-bdr-rad-half xui-font-sz-80"
                    style={{ border: '1px solid var(--neutral-200)', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {JSON.stringify(viewingLog.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllLogs;
