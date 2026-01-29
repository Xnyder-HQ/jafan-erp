import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Renew, Add, Edit, TrashCan, Download } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import vehiclesService from '../../services/vehicles.service';
import type { Vehicle } from '../../services/vehicles.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllVehicles = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const accessIds = getAccessIds('administration', 'vehicles');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setVehicles(response.data);
        setTotalPages(1);
      } else {
        setVehicles(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setVehicles([]);
    }
  };

  const fetchVehicles = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vehiclesService.getVehicles({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch vehicles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchVehicles = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchVehicles();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await vehiclesService.searchVehicles({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search vehicles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchVehicles]);

  const filterVehicles = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await vehiclesService.filterVehicles({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter vehicles'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    modalShow('delete-vehicle-modal');
  };

  const handleDeleteVehicle = async () => {
    if (!moduleId || !subModuleId || !selectedVehicle) {
      return { success: false, message: 'Unable to delete vehicle' };
    }
    return vehiclesService.deleteVehicle(selectedVehicle.unique_id, {
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
      searchVehicles(value);
    } else {
      fetchVehicles();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterVehicles(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchVehicles();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchVehicles();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchVehicles();
    }
  }, [moduleId, subModuleId, currentPage, fetchVehicles, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'xui-badge-success';
      case 'On Delivery': return 'xui-badge-info';
      case 'Maintenance': return 'xui-badge-warning';
      case 'Inactive': return 'xui-badge-danger';
      default: return 'xui-badge-default';
    }
  };

  return (
    <div>
      <Navbar title="All Vehicles" subtitle="Manage registered vehicles" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="vehicles"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-vehicles-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || vehicles.length === 0}
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
                onClick={() => navigate('/dashboard/users/vehicles/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Vehicle
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading vehicles...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load vehicles"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : vehicles.length === 0 ? (
              <EmptyState
                title="No vehicles found"
                message={searchQuery ? "No vehicles match your search query." : dateFilter ? "No vehicles match your filter criteria." : "There are no vehicles to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Plate Number</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Fuel</th>
                    <th>Status</th>
                    <th>Active</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.unique_id}>
                      <td>
                        <span className="xui-font-w-500">{vehicle.code}</span>
                        <span className="xui-d-block xui-font-sz-75 xui-opacity-5">{vehicle.reference}</span>
                      </td>
                      <td className="xui-font-sz-85">{vehicle.plate_number}</td>
                      <td className="xui-font-sz-85">{vehicle.type}</td>
                      <td className="xui-font-sz-85">
                        {vehicle.capacity_value} {vehicle.capacity_unit}
                      </td>
                      <td className="xui-font-sz-85" style={{ textTransform: 'capitalize' }}>{vehicle.fuel_type}</td>
                      <td>
                        <span className={`xui-badge ${getStatusBadge(vehicle.availability_status)} xui-font-sz-70`}>
                          {vehicle.availability_status}
                        </span>
                      </td>
                      <td>
                        <span className={`xui-badge ${vehicle.is_active ? 'xui-badge-success' : 'xui-badge-danger'} xui-font-sz-70`}>
                          {vehicle.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/users/vehicles/edit/${vehicle.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Edit Vehicle"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(vehicle)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                                title="Delete"
                              >
                                <TrashCan size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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

      <ConfirmModal
        id="delete-vehicle-modal"
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        itemName={selectedVehicle ? `${selectedVehicle.code} — ${selectedVehicle.plate_number}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteVehicle}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-vehicles-modal"
        title="Export Vehicles"
        fileName="vehicles"
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'reference', header: 'Reference' },
          { key: 'plate_number', header: 'Plate Number' },
          { key: 'type', header: 'Type' },
          { key: 'capacity_value', header: 'Capacity Value' },
          { key: 'capacity_unit', header: 'Capacity Unit' },
          { key: 'fuel_type', header: 'Fuel Type' },
          { key: 'benchmark_fuel_liters', header: 'Benchmark Fuel (L)' },
          { key: 'expected_trips_per_benchmark', header: 'Expected Trips' },
          { key: 'availability_status', header: 'Status' },
          { key: 'is_active', header: 'Active' },
        ]}
        data={vehicles}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllVehicles;
