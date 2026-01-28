import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Renew, Add, Edit, TrashCan, Download } from '@carbon/icons-react';
import { extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import { useNavigate } from 'react-router';
import usersService from '../../services/users.service';
import type { User } from '../../services/users.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput } from '../../components/common';
import { ConfirmModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

const AllUsers = () => {
  const navigate = useNavigate();
  const { getAccessIds, checkAccess } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const accessIds = getAccessIds('administration', 'users');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const accessResult = moduleId ? checkAccess(moduleId, subModuleId) : { hasAccess: false, accessTypes: [] };
  const canAdd = accessResult.accessTypes.includes('add');
  const canEdit = accessResult.accessTypes.includes('edit');
  const canDelete = accessResult.accessTypes.includes('delete');

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setUsers(response.data);
        setTotalPages(1);
      } else {
        setUsers(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setUsers([]);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await usersService.getUsers({
        page: currentPage,
        size: pageSize,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const searchUsers = useCallback(async (query: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await usersService.searchUsers({
        search: query,
        page: currentPage,
        size: pageSize,
      });
      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search users'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    modalShow('delete-user-modal');
  };

  const handleDeleteUser = async () => {
    if (!moduleId || !subModuleId || !selectedUser) {
      return { success: false, message: 'Unable to delete user' };
    }
    return usersService.deleteUser(selectedUser.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchUsers();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      searchUsers(value);
    } else {
      fetchUsers();
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      fetchUsers();
    }
  }, [currentPage, fetchUsers, searchQuery]);

  const getUserInitials = (user: User) => {
    return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <div>
      <Navbar title="All Users" subtitle="Manage system users and access" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={() => modalShow('export-users-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || users.length === 0}
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
                onClick={() => navigate('/dashboard/users/add')}
                className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                <span className="icon-container"><Add size={16} /></span>
                Add User
              </button>
            )}
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading users...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load users"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                message={searchQuery ? "No users match your search query." : "There are no users to display."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Role</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.unique_id}>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={`${user.firstname} ${user.lastname}`}
                              className="xui-w-40 xui-h-40 xui-bdr-rad-circle"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-font-sz-80 xui-font-w-600"
                              style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
                            >
                              {getUserInitials(user)}
                            </div>
                          )}
                          <div>
                            <span className="xui-font-w-500">
                              {user.firstname} {user.middlename ? `${user.middlename} ` : ''}{user.lastname}
                            </span>
                            <span className="xui-d-block xui-font-sz-75 xui-opacity-5">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="xui-font-sz-85 xui-opacity-7">{user.phone_number || '—'}</span>
                      </td>
                      <td>
                        {user.Role ? (
                          <span className="xui-badge xui-badge-info xui-font-sz-70">{user.Role.name}</span>
                        ) : (
                          <span className="xui-font-sz-85 xui-opacity-5">—</span>
                        )}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/dashboard/users/edit/${user.unique_id}`)}
                                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                                style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                                title="Manage User"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(user)}
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
        id="delete-user-modal"
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        itemName={selectedUser ? `${selectedUser.firstname} ${selectedUser.lastname} — ${selectedUser.email}` : ''}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteUser}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-users-modal"
        title="Export Users"
        fileName="users"
        columns={[
          { key: 'firstname', header: 'First Name' },
          { key: 'middlename', header: 'Middle Name' },
          { key: 'lastname', header: 'Last Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'username', header: 'Username' },
          { key: 'Role.name', header: 'Role' },
        ]}
        data={users}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default AllUsers;
