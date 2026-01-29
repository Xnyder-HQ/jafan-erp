import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import productionFuelLogsService from '../../services/productionFuelLogs.service';
import type { ProductionFuelLog as FuelLogEntry } from '../../services/productionFuelLogs.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const ProductionFuelLog = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'production-fuel-logs');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

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
      const response = await productionFuelLogsService.getFuelLogs({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
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
      const response = await productionFuelLogsService.searchFuelLogs({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search fuel logs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchFuelLogs]);

  const filterFuelLogs = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionFuelLogsService.filterFuelLogs({
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

  const getFuelTypeBadgeClass = (fuelType: string) => {
    switch (fuelType) {
      case 'Diesel': return 'xui-badge-blue';
      case 'Electric': return 'xui-badge-success';
      case 'Petrol': return 'xui-badge-warning';
      default: return 'xui-badge-default';
    }
  };

  return (
    <div>
      <Navbar title="Production Fuel Log" subtitle="Track fuel dispensed to generators and machines" />

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
              id="fuel-logs"
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
              onClick={() => modalShow('export-fuel-logs-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || fuelLogs.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/fuel/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Dispense Fuel
            </button>
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
                message={searchQuery || dateFilter ? "No fuel logs match your search or filter criteria." : "There are no fuel logs to display. Click 'Dispense Fuel' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Dispensed Date</th>
                    <th>Fuel Type</th>
                    <th>Liters Dispensed</th>
                    <th>Destination</th>
                    <th>Machine</th>
                    <th>Notes</th>
                    <th>Dispensed By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((log) => (
                    <tr key={log.unique_id}>
                      <td className="xui-font-w-500">
                        {formatDate(log.dispensed_date)}
                      </td>
                      <td>
                        <span className={`xui-badge ${getFuelTypeBadgeClass(log.fuel_type)}`}>
                          {log.fuel_type}
                        </span>
                      </td>
                      <td className="xui-font-w-500">
                        {log.liters_dispensed}L
                      </td>
                      <td className="xui-font-sz-80">
                        {log.destination}
                      </td>
                      <td className="xui-font-sz-80">
                        {log.Machine ? (
                          <span>{log.Machine.name} ({log.Machine.code})</span>
                        ) : (
                          <span className="xui-opacity-5">N/A</span>
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
        id="export-fuel-logs-modal"
        title="Export Fuel Logs"
        fileName="production-fuel-logs"
        columns={[
          { key: 'dispensed_date', header: 'Dispensed Date' },
          { key: 'fuel_type', header: 'Fuel Type' },
          { key: 'liters_dispensed', header: 'Liters Dispensed' },
          { key: 'destination', header: 'Destination' },
          { key: 'Machine.name', header: 'Machine' },
          { key: 'notes', header: 'Notes' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={fuelLogs}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default ProductionFuelLog;
