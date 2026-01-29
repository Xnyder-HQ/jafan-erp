import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew, WarningAlt } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import rawMaterialsService from '../../services/rawMaterials.service';
import type { RawMaterial } from '../../services/rawMaterials.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const RawMaterials = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);

  const accessIds = getAccessIds('inventory-stock-management', 'raw-materials');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setMaterials(response.data);
        setTotalPages(1);
      } else {
        setMaterials(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setMaterials([]);
    }
  };

  const fetchMaterials = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialsService.getRawMaterials({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch raw materials. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchMaterials = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchMaterials();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialsService.searchRawMaterials({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search raw materials'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchMaterials]);

  const filterMaterials = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await rawMaterialsService.filterRawMaterials({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter raw materials'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    modalShow('delete-material-modal');
  };

  const handleDeleteMaterial = async () => {
    if (!moduleId || !subModuleId || !selectedMaterial) {
      return { success: false, message: 'Unable to delete raw material' };
    }

    return rawMaterialsService.deleteRawMaterial(selectedMaterial.unique_id, {
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
      searchMaterials(value);
    } else {
      fetchMaterials();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterMaterials(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchMaterials();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchMaterials();
  };

  const getStockStatus = (current: number, reorderLevel: number | null) => {
    if (!reorderLevel) return { label: 'N/A', class: 'xui-badge-blue' };
    if (current <= reorderLevel * 0.5) return { label: 'Critical', class: 'xui-badge-danger' };
    if (current <= reorderLevel) return { label: 'Low', class: 'xui-badge-warning' };
    return { label: 'Good', class: 'xui-badge-success' };
  };

  const lowStockCount = materials.filter(m => m.reorder_level && m.current_quantity <= m.reorder_level).length;

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchMaterials();
    }
  }, [moduleId, subModuleId, currentPage, fetchMaterials]);

  return (
    <div>
      <Navbar title="Raw Materials" subtitle="Monitor and manage raw material inventory" />

      <div className="xui-py-1-half">
        {lowStockCount > 0 && (
          <div
            className="xui-d-flex xui-flex-ai-start xui-grid-gap-1 xui-p-half xui-bdr-rad-half xui-mb-1-half"
            style={{ backgroundColor: 'var(--warning-light)' }}
          >
            <div
              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-bdr-rad-half"
              style={{ width: '32px', height: '32px', backgroundColor: 'var(--warning)', color: 'white', flexShrink: 0 }}
            >
              <span className="icon-container">
                <WarningAlt size={18} />
              </span>
            </div>
            <div>
              <p className="xui-font-sz-90 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                Low Stock Alert
              </p>
              <p className="xui-font-sz-85" style={{ color: 'var(--neutral-600)' }}>
                {lowStockCount} items are below minimum stock levels
              </p>
            </div>
          </div>
        )}

        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search materials..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="raw-materials"
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
              <span className="icon-container">
                <Renew size={16} />
              </span>
              Refresh
            </button>
            <button
              onClick={() => modalShow('export-materials-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || materials.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/inventory/raw-materials/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Material
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading raw materials...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load raw materials"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : materials.length === 0 ? (
              <EmptyState
                title="No raw materials found"
                message={searchQuery || dateFilter ? "No raw materials match your search or filter criteria." : "There are no raw materials to display. Click 'Add Material' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => {
                    const status = getStockStatus(material.current_quantity, material.reorder_level);
                    return (
                      <tr key={material.unique_id}>
                        <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                          {material.reference}
                        </td>
                        <td className="xui-font-w-500">{material.name}</td>
                        <td>
                          {material.type ? (
                            <span className="xui-badge xui-badge-blue">{material.type}</span>
                          ) : (
                            <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                          )}
                        </td>
                        <td className="xui-font-w-500">
                          {material.current_quantity.toLocaleString()} {material.unit_of_measure || ''}
                        </td>
                        <td style={{ color: 'var(--neutral-500)' }}>
                          {material.reorder_level ? `${material.reorder_level.toLocaleString()} ${material.unit_of_measure || ''}` : 'N/A'}
                        </td>
                        <td>
                          <span className={`xui-badge ${status.class}`}>{status.label}</span>
                        </td>
                        <td className="xui-opacity-7 xui-font-sz-80">
                          {formatDate(material.createdAt)}
                        </td>
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            <button
                              onClick={() => navigate(`/dashboard/inventory/raw-materials/edit/${material.unique_id}`)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(material)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                            >
                              <TrashCan size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      <DeleteModal
        id="delete-material-modal"
        title="Delete Raw Material"
        message="Are you sure you want to delete this raw material"
        itemName={selectedMaterial?.name}
        onDelete={handleDeleteMaterial}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-materials-modal"
        title="Export Raw Materials"
        fileName="raw-materials"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'name', header: 'Name' },
          { key: 'type', header: 'Type' },
          { key: 'unit_of_measure', header: 'Unit of Measure' },
          { key: 'current_quantity', header: 'Current Quantity' },
          { key: 'reorder_level', header: 'Reorder Level' },
          { key: 'description', header: 'Description' },
          { key: 'status', header: 'Status' },
        ]}
        data={materials.map((m) => ({
          ...m,
          status: m.status === 1 ? 'Active' : 'Inactive',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default RawMaterials;
