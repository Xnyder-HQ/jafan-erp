import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import supplyLogsService from '../../services/supplyLogs.service';
import type { SupplyLogEntry } from '../../services/supplyLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const SupplyLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [logs, setLogs] = useState<SupplyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('logistics-supply-chain', 'supply-logs');
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
      const response = await supplyLogsService.getSupplyLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch supply logs.'));
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
      const response = await supplyLogsService.searchSupplyLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search supply logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, fetchLogs]);

  const filterLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await supplyLogsService.filterSupplyLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter supply logs'));
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
      <Navbar title="Supply Log" subtitle="Track all deliveries and breakages" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search supply logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="supply-log"
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
              onClick={() => modalShow('export-supply-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || logs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/logistics/supply-log/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Log Supply
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading supply logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load supply logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No supply logs found"
                message={searchQuery || dateFilter ? "No logs match your search or filter criteria." : "There are no supply logs to display. Click 'Log Supply' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order Ref</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Site Address</th>
                    <th>Loaded</th>
                    <th>Dropped</th>
                    <th>Returned</th>
                    <th>Breakages</th>
                    <th>Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(log.delivery_date)}
                      </td>
                      <td>
                        {log.SalesOrder?.unique_id ? (
                          <a
                            onClick={() => navigate(`/dashboard/sales/orders/edit/${log.SalesOrder?.unique_id}`)}
                            className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                            style={{ color: 'var(--primary-600)' }}
                            title="View sales order"
                          >
                            {log.SalesOrder?.reference || 'N/A'}
                          </a>
                        ) : (
                          <span className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div>
                          {log.Customer?.unique_id ? (
                            <a
                              onClick={() => navigate(`/dashboard/sales/customers/edit/${log.Customer?.unique_id}`)}
                              className="xui-font-w-500 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View customer details"
                            >
                              {log.Customer?.name || 'N/A'}
                            </a>
                          ) : (
                            <span className="xui-font-w-500">{log.Customer?.name || 'N/A'}</span>
                          )}
                          {log.Customer?.phone_number && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{log.Customer.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="xui-font-w-500">
                        {log.Product?.name || 'N/A'}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-90" style={{ maxWidth: '180px' }}>
                        {log.site_address || <span className="xui-opacity-4">—</span>}
                      </td>
                      <td>{log.blocks_loaded}</td>
                      <td style={{ color: 'var(--success)' }}>{log.blocks_dropped}</td>
                      <td>{log.blocks_returned}</td>
                      <td style={{ color: log.breakage_quantity > 0 ? 'var(--error)' : undefined }}>
                        {log.breakage_quantity}
                      </td>
                      <td>
                        {log.Vehicle?.unique_id ? (
                          <div>
                            <a
                              onClick={() => navigate(`/dashboard/users/vehicles/edit/${log.Vehicle?.unique_id}`)}
                              className="xui-font-w-500 xui-font-sz-90 xui-cursor-pointer xui-text-decoration-none"
                              style={{ color: 'var(--primary-600)' }}
                              title="View vehicle details"
                            >
                              {log.Vehicle.plate_number}
                            </a>
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{log.Vehicle.type}</span>
                          </div>
                        ) : (
                          <span className="xui-opacity-4">—</span>
                        )}
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
        id="export-supply-logs-modal"
        title="Export Supply Logs"
        fileName="supply-logs"
        columns={[
          { key: 'delivery_date', header: 'Date' },
          { key: 'SalesOrder.reference', header: 'Order Ref' },
          { key: 'Customer.name', header: 'Customer' },
          { key: 'Customer.phone_number', header: 'Phone' },
          { key: 'Product.name', header: 'Product' },
          { key: 'site_address', header: 'Site Address' },
          { key: 'blocks_loaded', header: 'Loaded' },
          { key: 'blocks_dropped', header: 'Dropped' },
          { key: 'blocks_returned', header: 'Returned' },
          { key: 'breakage_quantity', header: 'Breakages' },
          { key: 'Vehicle.plate_number', header: 'Vehicle' },
          { key: 'notes', header: 'Notes' },
        ]}
        data={logs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default SupplyLog;
