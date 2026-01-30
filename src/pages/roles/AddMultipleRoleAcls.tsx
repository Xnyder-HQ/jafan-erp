import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Add, TrashCan } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import roleAclsService from '../../services/roleAcls.service';
import type { RoleOption, ModuleOption, BulkRoleAclItem } from '../../services/roleAcls.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface AclRow {
  module_unique_id: string;
  sub_module_unique_id: string;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
}

const emptyRow: AclRow = {
  module_unique_id: '',
  sub_module_unique_id: '',
  add: false,
  edit: false,
  delete: false,
  elevated_role: false,
};

const AddMultipleRoleAcls = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rows, setRows] = useState<AclRow[]>([{ ...emptyRow }]);

  const accessIds = getAccessIds('roles', 'role-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [rolesRes, modulesRes] = await Promise.all([
          roleAclsService.getRoles(),
          roleAclsService.getModules(),
        ]);

        if (rolesRes.success && rolesRes.data) {
          const data = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.rows;
          setRoles(data || []);
        }

        if (modulesRes.success && modulesRes.data) {
          const data = Array.isArray(modulesRes.data) ? modulesRes.data : modulesRes.data.rows;
          setModules(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const getSubModules = (modId: string) => {
    const mod = modules.find(m => m.unique_id === modId);
    return mod?.SubModules || [];
  };

  const updateRow = (index: number, field: keyof AclRow, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'module_unique_id') {
        updated[index].sub_module_unique_id = '';
      }
      return updated;
    });
  };

  const addRow = () => {
    setRows(prev => [...prev, { ...emptyRow }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    if (!selectedRoleId) {
      setError('Please select a role');
      showAlert('error-alert');
      return;
    }

    const validRows = rows.filter(r => r.module_unique_id);
    if (validRows.length === 0) {
      setError('Please add at least one ACL entry with a module selected');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const role_acls: BulkRoleAclItem[] = validRows.map(r => ({
        module_unique_id: r.module_unique_id,
        ...(r.sub_module_unique_id && { sub_module_unique_id: r.sub_module_unique_id }),
        add: r.add,
        edit: r.edit,
        delete: r.delete,
        elevated_role: r.elevated_role,
      }));

      const response = await roleAclsService.addMultipleRoleAcls(
        {
          role_unique_id: selectedRoleId,
          role_acls,
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage(`${role_acls.length} role ACL(s) added successfully`);
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/roles/acls');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add role ACLs');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add role ACLs'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div>
        <Navbar title="Add Multiple Role ACLs" subtitle="Grant multiple module access to a role at once" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add Multiple Role ACLs" subtitle="Grant multiple module access to a role at once" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Select a role, then add one or more module access entries with permissions.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit} className="xui-form">
          <div className="xui-form-box xui-mb-1-half" style={{ maxWidth: '500px' }}>
            <label htmlFor="role_unique_id">Role *</label>
            <select
              id="role_unique_id"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="">--Select role--</option>
              {roles.map((role) => (
                <option key={role.unique_id} value={role.unique_id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
            <p className="xui-font-w-600">ACL Entries</p>
            <button
              type="button"
              onClick={addRow}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
            >
              <span className="icon-container"><Add size={16} /></span>
              Add Entry
            </button>
          </div>

          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
            {rows.map((row, index) => {
              const subModules = getSubModules(row.module_unique_id);
              return (
                <div
                  key={index}
                  className="xui-bg-white xui-bdr-rad-half xui-p-1"
                  style={{ border: '1px solid var(--neutral-200)' }}
                >
                  <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                    <span className="xui-font-w-600 xui-font-sz-85" style={{ color: 'var(--neutral-600)' }}>
                      Entry {index + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                        style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                        title="Remove entry"
                      >
                        <TrashCan size={16} />
                      </button>
                    )}
                  </div>

                  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
                    <div>
                      <div className="xui-form-box">
                        <label>Module *</label>
                        <select
                          value={row.module_unique_id}
                          onChange={(e) => updateRow(index, 'module_unique_id', e.target.value)}
                        >
                          <option value="">--Select module--</option>
                          {modules.map((mod) => (
                            <option key={mod.unique_id} value={mod.unique_id}>
                              {mod.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="xui-form-box">
                        <label>Sub Module</label>
                        <select
                          disabled={!row.module_unique_id || subModules.length === 0}
                          value={row.sub_module_unique_id}
                          onChange={(e) => updateRow(index, 'sub_module_unique_id', e.target.value)}
                        >
                          <option value="">
                            {!row.module_unique_id ? '--Select a module first--' : subModules.length === 0 ? '--No sub modules--' : '--Select sub module (optional)--'}
                          </option>
                          {subModules.map((sub) => (
                            <option key={sub.unique_id} value={sub.unique_id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-half">
                        <p className="xui-font-w-500 xui-font-sz-85">Permissions</p>
                        <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80">
                          <input
                            type="checkbox"
                            checked={row.add && row.edit && row.delete && row.elevated_role}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateRow(index, 'add', checked);
                              updateRow(index, 'edit', checked);
                              updateRow(index, 'delete', checked);
                              updateRow(index, 'elevated_role', checked);
                            }}
                          />
                          <span className="xui-font-w-500">Check All</span>
                        </label>
                      </div>
                      <div className="xui-p-1 xui-bg-light xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-200)' }}>
                        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                          {/* Row 1: View + Add */}
                          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ opacity: 0.6 }}>
                              <input
                                type="checkbox"
                                checked={true}
                                disabled
                              />
                              <div>
                                <span className="xui-font-w-500">View</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">View records (default)</span>
                              </div>
                            </label>

                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.add}
                                onChange={(e) => updateRow(index, 'add', e.target.checked)}
                              />
                              <div>
                                <span className="xui-font-w-500">Add</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Create new records</span>
                              </div>
                            </label>
                          </div>

                          {/* Row 2: Edit + Delete */}
                          <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.edit}
                                onChange={(e) => updateRow(index, 'edit', e.target.checked)}
                              />
                              <div>
                                <span className="xui-font-w-500">Edit</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Modify records</span>
                              </div>
                            </label>

                            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.delete}
                                onChange={(e) => updateRow(index, 'delete', e.target.checked)}
                              />
                              <div>
                                <span className="xui-font-w-500">Delete</span>
                                <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Remove records</span>
                              </div>
                            </label>
                          </div>

                          <hr className="xui-my-half" />

                          {/* Row 3: Elevated Role */}
                          <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.elevated_role}
                              onChange={(e) => updateRow(index, 'elevated_role', e.target.checked)}
                            />
                            <div>
                              <span className="xui-font-w-500">Elevated Role</span>
                              <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Grant elevated administrative access</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1-half xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Adding Role ACLs...' : `Add ${rows.length} Role ACL${rows.length > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddMultipleRoleAcls;
