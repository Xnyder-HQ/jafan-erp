import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, Download } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import logisticsFuelLogsService from '../../services/logisticsFuelLogs.service';
import type { LogisticsFuelLog } from '../../services/logisticsFuelLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const LogisticsFuelLogPage = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [fuelLogs, setFuelLogs] = useState<LogisticsFuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const accessIds = getAccessIds('logistics-supply-chain', 'logistics-fuel-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setFuelLogs(response.data);
        setTotalPages(1);
      } else {
        setFuelLogs(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setFuelLogs([]);
    }
  };

  const fetchFuelLogs = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await logisticsFuelLogsService.getLogisticsFuelLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch fuel logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchFuelLogs = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchFuelLogs();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await logisticsFuelLogsService.searchLogisticsFuelLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search fuel logs'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchFuelLogs]);

  const filterFuelLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await logisticsFuelLogsService.filterLogisticsFuelLogs({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter fuel logs'));
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
      searchFuelLogs(value);
    } else {
      fetchFuelLogs();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterFuelLogs(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchFuelLogs();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchFuelLogs();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchFuelLogs();
    }
  }, [moduleId, subModuleId, currentPage, fetchFuelLogs]);

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

  return (
    <div>
      <Navbar title="Fuel Dispense Log" subtitle="Track fuel dispensed to vehicles" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search fuel logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="logistics-fuel-logs"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-fuel-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || fuelLogs.length === 0}
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
                onClick={() => navigate('/dashboard/logistics/fuel/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Dispense Fuel
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading fuel logs...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load fuel logs"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : fuelLogs.length === 0 ? (
              <EmptyState
                title="No fuel logs found"
                message={searchQuery || dateFilter ? "No fuel logs match your search or filter criteria." : "There are no fuel dispense logs to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Fuel Type</th>
                    <th>Liters</th>
                    <th>Price/Liter</th>
                    <th>Total Cost</th>
                    <th>Benchmark</th>
                    <th>Expected Trips</th>
                    <th>Actual Trips</th>
                    <th>Notes</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-opacity-7 xui-font-sz-90">
                        {formatDate(log.dispense_date)}
                      </td>
                      <td>
                        <div>
                          <span className="xui-font-w-500">{log.Vehicle?.plate_number || 'N/A'}</span>
                          {log.Vehicle?.code && (
                            <span className="xui-d-block xui-font-sz-80 xui-opacity-6">{log.Vehicle.code}</span>
                          )}
                        </div>
                      </td>
                      <td>{getFuelTypeBadge(log.fuel_type)}</td>
                      <td className="xui-font-w-600">{log.liters_dispensed}L</td>
                      <td>{formatCurrency(log.price_per_liter)}</td>
                      <td className="xui-font-w-600" style={{ color: 'var(--error)' }}>
                        {formatCurrency(log.liters_dispensed * log.price_per_liter)}
                      </td>
                      <td className="xui-font-sz-90">{log.benchmark_liters}L</td>
                      <td className="xui-font-sz-90">{log.expected_trips.toFixed(1)}</td>
                      <td className="xui-font-sz-90">{log.actual_trips}</td>
                      <td className="xui-font-sz-90">
                        {log.notes || <span className="xui-opacity-4">—</span>}
                      </td>
                      <td className="xui-font-sz-90">
                        {log.User ? `${log.User.firstname} ${log.User.lastname}` : 'N/A'}
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

      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ExportModal
        id="export-fuel-logs-modal"
        title="Export Fuel Dispense Logs"
        fileName="logistics-fuel-logs"
        columns={[
          { key: 'dispense_date', header: 'Date' },
          { key: 'Vehicle.plate_number', header: 'Vehicle' },
          { key: 'fuel_type', header: 'Fuel Type' },
          { key: 'liters_dispensed', header: 'Liters' },
          { key: 'price_per_liter', header: 'Price/Liter' },
          { key: 'benchmark_liters', header: 'Benchmark (L)' },
          { key: 'expected_trips', header: 'Expected Trips' },
          { key: 'actual_trips', header: 'Actual Trips' },
          { key: 'notes', header: 'Notes' },
          { key: 'User.firstname', header: 'Recorded By' },
        ]}
        data={fuelLogs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default LogisticsFuelLogPage;
