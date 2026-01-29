import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Renew, Edit, TrashCan } from '@carbon/icons-react';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import productionTeamsService from '../../services/productionTeams.service';
import type { ProductionTeam } from '../../services/productionTeams.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const ProductionTeams = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [teams, setTeams] = useState<ProductionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<ProductionTeam | null>(null);

  const accessIds = getAccessIds('production-quality-control', 'production-teams');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setTeams(response.data);
        setTotalPages(1);
      } else {
        setTeams(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setTeams([]);
    }
  };

  const fetchTeams = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionTeamsService.getProductionTeams({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch production teams'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchTeams = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchTeams();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionTeamsService.searchProductionTeams({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search production teams'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchTeams]);

  const filterTeams = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await productionTeamsService.filterProductionTeams({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter production teams'));
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
      searchTeams(value);
    } else {
      fetchTeams();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterTeams(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchTeams();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchTeams();
  };

  const openDeleteModal = (team: ProductionTeam) => {
    setSelectedTeam(team);
    modalShow('delete-team-modal');
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam || !accessIds) return { success: false, message: 'No team selected' };
    return await productionTeamsService.deleteProductionTeam(selectedTeam.unique_id, {
      module_unique_id: accessIds.module_unique_id,
      sub_module_unique_id: accessIds.sub_module_unique_id,
    });
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchTeams();
    }
  }, [moduleId, subModuleId, currentPage, fetchTeams]);

  return (
    <div>
      <Navbar title="Production Teams" subtitle="Manage production teams and operators" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search teams..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="production-teams"
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
              onClick={() => modalShow('export-teams-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || teams.length === 0}
            >
              <span className="icon-container"><Download size={16} /></span>
              Export
            </button>
            <button
              onClick={() => navigate('/dashboard/production/teams/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Add Team
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading production teams...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load production teams"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : teams.length === 0 ? (
              <EmptyState
                title="No production teams found"
                message={searchQuery || dateFilter ? "No teams match your search or filter criteria." : "There are no production teams to display. Click 'Add Team' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.unique_id}>
                      <td className="xui-font-w-500">
                        {team.name}
                      </td>
                      <td>
                        {team.Machine ? (
                          <span>{team.Machine.name} ({team.Machine.code})</span>
                        ) : (
                          <span className="xui-opacity-5 xui-font-sz-80">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className={`xui-badge ${team.is_active ? 'xui-badge-success' : 'xui-badge-danger'}`}>
                          {team.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="xui-font-sz-80">
                        {team.User ? `${team.User.firstname} ${team.User.lastname}` : 'N/A'}
                      </td>
                      <td className="xui-opacity-7 xui-font-sz-80">
                        {formatDate(team.createdAt)}
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => navigate(`/dashboard/production/teams/edit/${team.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(team)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                          >
                            <TrashCan size={14} />
                          </button>
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

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <DeleteModal
        id="delete-team-modal"
        title="Delete Production Team"
        message="Are you sure you want to delete this production team"
        itemName={selectedTeam?.name}
        onDelete={handleDeleteTeam}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-teams-modal"
        title="Export Production Teams"
        fileName="production-teams"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'Machine.name', header: 'Machine' },
          { key: 'is_active', header: 'Status' },
          { key: 'createdAt', header: 'Created' },
        ]}
        data={teams}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default ProductionTeams;
