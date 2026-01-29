import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import productionQcLogsService from '../../services/productionQcLogs.service';
import type { ProductionQcLog } from '../../services/productionQcLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const QualityControl = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [qcLogs, setQcLogs] = useState<ProductionQcLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'production-qc-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setQcLogs(response.data);
        setTotalPages(1);
      } else {
        setQcLogs(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setQcLogs([]);
    }
  };

  const fetchQcLogs = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionQcLogsService.getQcLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch QC logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchQcLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchQcLogs();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionQcLogsService.searchQcLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search QC logs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchQcLogs]);

  const filterQcLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionQcLogsService.filterQcLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter QC logs'));
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
      searchQcLogs(value);
    } else {
      fetchQcLogs();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterQcLogs(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchQcLogs();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchQcLogs();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchQcLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchQcLogs]);

  return (
    <div>
      <Navbar title="Quality Control" subtitle="Track production quality and defects" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search QC logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="qc-logs"
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
              onClick={() => modalShow('export-qc-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || qcLogs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/qc/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Log QC Check
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading QC logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load QC logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : qcLogs.length === 0 ? (
              <EmptyState
                title="No QC logs found"
                message={searchQuery || dateFilter ? "No QC logs match your search or filter criteria." : "There are no QC logs to display. Click 'Log QC Check' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>QC Date</th>
                    <th>Production Batch</th>
                    <th>Machine</th>
                    <th>Team</th>
                    <th>Finished Good</th>
                    <th>Defective Qty</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {qcLogs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-font-w-500">
                        {formatDate(log.qc_date)}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.ProductionBatch ? (
                          <span>{formatDate(log.ProductionBatch.production_date)} - {log.ProductionBatch.shift} ({log.ProductionBatch.quantity_produced} produced)</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.Machine ? (
                          <span>{log.Machine.name} ({log.Machine.code})</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.ProductionTeam?.name || <span className="xui-opacity-5">N/A</span>}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.FinishedGood ? (
                          <span>{log.FinishedGood.name} ({log.FinishedGood.type})</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className="xui-badge xui-badge-danger">
                          {log.defective_quantity}
                        </span>
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
        id="export-qc-logs-modal"
        title="Export QC Logs"
        fileName="production-qc-logs"
        columns={[
          { key: 'qc_date', header: 'QC Date' },
          { key: 'defective_quantity', header: 'Defective Qty' },
          { key: 'ProductionBatch.production_date', header: 'Batch Date' },
          { key: 'ProductionBatch.shift', header: 'Shift' },
          { key: 'Machine.name', header: 'Machine' },
          { key: 'ProductionTeam.name', header: 'Team' },
          { key: 'FinishedGood.name', header: 'Finished Good' },
          { key: 'notes', header: 'Notes' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={qcLogs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default QualityControl;
