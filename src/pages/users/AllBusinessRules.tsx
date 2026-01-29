import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Renew, Edit, Download } from '@carbon/icons-react';
// import { Add, TrashCan } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import businessRulesService from '../../services/businessRules.service';
import type { BusinessRule } from '../../services/businessRules.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
// import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const AllBusinessRules = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  // const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  // const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null);

  const accessIds = getAccessIds('administration', 'business-rules');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  // const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  // const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setRules(response.data);
        setTotalPages(1);
      } else {
        setRules(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setRules([]);
    }
  };

  const fetchRules = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await businessRulesService.getBusinessRules({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch business rules'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchRules = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchRules();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await businessRulesService.searchBusinessRules({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search business rules'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchRules]);

  const filterRules = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await businessRulesService.filterBusinessRules({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter business rules'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  // const openDeleteModal = (rule: BusinessRule) => {
  //   setSelectedRule(rule);
  //   modalShow('delete-rule-modal');
  // };

  // const handleDeleteRule = async () => {
  //   if (!moduleId || !subModuleId || !selectedRule) {
  //     return { success: false, message: 'Unable to delete business rule' };
  //   }
  //   return businessRulesService.deleteBusinessRule(selectedRule.unique_id, {
  //     module_unique_id: moduleId,
  //     sub_module_unique_id: subModuleId,
  //   });
  // };

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
      searchRules(value);
    } else {
      fetchRules();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterRules(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchRules();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchRules();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;
    if (!searchQuery && !dateFilter) {
      fetchRules();
    }
  }, [moduleId, subModuleId, currentPage, fetchRules, searchQuery]);

  const formatRuleValue = (rule: BusinessRule) => {
    if (rule.value_type === 'percentage') {
      return `${rule.rule_value}%`;
    }
    return rule.rule_value.toLocaleString();
  };

  return (
    <div>
      <Navbar title="Business Rules" subtitle="Manage business rules and configurations" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search rules..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="business-rules"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-rules-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || rules.length === 0}
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
            {/*
            {canAdd && (
              <button
                onClick={() => navigate('/dashboard/users/rules/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add Rule
              </button>
            )}
            */}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading business rules...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load business rules"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : rules.length === 0 ? (
              <EmptyState
                title="No business rules found"
                message={searchQuery ? "No rules match your search query." : dateFilter ? "No rules match your filter criteria." : "There are no business rules to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Rule Key</th>
                    <th>Value</th>
                    <th>Type</th>
                    <th>Applies To</th>
                    <th>Active</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.unique_id}>
                      <td>
                        <span className="xui-font-w-500" style={{ fontFamily: 'monospace' }}>{rule.rule_key}</span>
                      </td>
                      <td className="xui-font-sz-85 xui-font-w-600">{formatRuleValue(rule)}</td>
                      <td>
                        <span className={`xui-badge ${rule.value_type === 'percentage' ? 'xui-badge-info' : 'xui-badge-default'} xui-font-sz-70`}>
                          {rule.value_type}
                        </span>
                      </td>
                      <td className="xui-font-sz-85">{rule.applies_to}</td>
                      <td>
                        <span className={`xui-badge ${rule.is_active ? 'xui-badge-success' : 'xui-badge-danger'} xui-font-sz-70`}>
                          {rule.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            <button
                              onClick={() => navigate(`/dashboard/users/rules/edit/${rule.unique_id}`)}
                              className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                              style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                              title="Edit Rule"
                            >
                              <Edit size={16} />
                            </button>
                            {/*
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(rule)}
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

      {/* <Alert id="error-alert" type="error" title="Error" message={actionError} /> */}
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      {/*
      <ConfirmModal
        id="delete-rule-modal"
        title="Delete Business Rule"
        message="Are you sure you want to delete this business rule? This action cannot be undone."
        itemName={selectedRule ? selectedRule.rule_key : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteRule}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
      */}

      <ExportModal
        id="export-rules-modal"
        title="Export Business Rules"
        fileName="business-rules"
        columns={[
          { key: 'rule_key', header: 'Rule Key' },
          { key: 'rule_value', header: 'Value' },
          { key: 'value_type', header: 'Type' },
          { key: 'applies_to', header: 'Applies To' },
          { key: 'notes', header: 'Notes' },
          { key: 'is_active', header: 'Active' },
        ]}
        data={rules}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllBusinessRules;
