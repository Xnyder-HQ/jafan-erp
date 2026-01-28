import { Search, User, Menu } from '@carbon/icons-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useGeneral } from '../../context/GeneralContext';

const modulePaths: Record<string, string> = {
  'sales-customer-management': '/dashboard/sales',
  'procurement-vendor-management': '/dashboard/procurement',
  'inventory-stock-management': '/dashboard/inventory',
  'logistics-supply-chain': '/dashboard/logistics',
  'production-quality-control': '/dashboard/production',
  'roles': '/dashboard/roles',
  'acls': '/dashboard/acls',
  'approvals': '/dashboard/approvals',
  'logs': '/dashboard/logs',
  'administration': '/dashboard/users',
};

const subModulePaths: Record<string, string> = {
  'customers': '/customers',
  'products': '/products',
  'sales-orders': '/orders',
  'invoices': '/invoices',
  'block-creditors-report': '/creditors',
  'discounts': '/discounts',
  'vendors': '/vendors',
  'purchase-orders': '/orders',
  'vendor-payments': '/payments',
  'fuel-purchases': '/fuel',
  'expenses': '/expenses',
  'raw-materials': '/raw-materials',
  'raw-material-stock-logs': '/raw-material-logs',
  'finished-goods': '/finished-goods',
  'finished-goods-stock-logs': '/finished-goods-logs',
  'delivery-assignments': '/queue',
  'supply-logs': '/supply-log',
  'logistics-fuel-logs': '/fuel',
  'production-batches': '/daily',
  'production-teams': '/teams',
  'production-qc-logs': '/qc',
  'production-fuel-logs': '/fuel',
  'machine-maintenance-logs': '/maintenance',
  'stacking-logs': '/stacking',
  'users': '',
  'machines': '/machines',
  'vehicles': '/vehicles',
  'business-rules': '/rules',
  'all-roles': '',
  'roles-overview': '/overview',
  'role-acls': '/acls',
  'all-acls': '',
  'acls-overview': '/overview',
  'all-approvals': '',
  'approvals-overview': '/overview',
  'all-logs': '',
  'logs-overview': '/overview',
  'sales-customer-management-overview': '/overview',
  'procurement-vendor-management-overview': '/overview',
  'inventory-stock-management-overview': '/overview',
  'production-quality-control-overview': '/overview',
  'logistics-supply-chain-overview': '/overview',
  'administration-overview': '/overview',
};

interface SearchResult {
  type: 'module' | 'submodule';
  moduleName: string;
  moduleStripped: string;
  subModuleName?: string;
  subModuleStripped?: string;
  path: string;
}

interface NavbarProps {
  title?: string;
  subtitle?: string;
  heading?: ReactNode;
}

const Navbar = ({ title, subtitle, heading }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, acls } = useGeneral();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const userRole = acls[0]?.Role?.name || 'User';

  const searchableItems = useMemo(() => {
    const items: SearchResult[] = [];
    const addedModules = new Set<string>();
    const addedSubModules = new Set<string>();

    acls.forEach((acl) => {
      const moduleStripped = acl.Module?.stripped;
      const moduleName = acl.Module?.name;
      const subModuleStripped = acl.SubModule?.stripped;
      const subModuleName = acl.SubModule?.name;

      if (moduleStripped && moduleName) {
        if (!addedModules.has(moduleStripped)) {
          addedModules.add(moduleStripped);
          const basePath = modulePaths[moduleStripped] || `/dashboard/${moduleStripped}`;
          items.push({
            type: 'module',
            moduleName,
            moduleStripped,
            path: basePath,
          });
        }

        if (subModuleStripped && subModuleName) {
          const key = `${moduleStripped}:${subModuleStripped}`;
          if (!addedSubModules.has(key)) {
            addedSubModules.add(key);
            const basePath = modulePaths[moduleStripped] || `/dashboard/${moduleStripped}`;
            const subPath = subModulePaths[subModuleStripped] ?? `/${subModuleStripped}`;
            items.push({
              type: 'submodule',
              moduleName,
              moduleStripped,
              subModuleName,
              subModuleStripped,
              path: `${basePath}${subPath}`,
            });
          }
        }
      }
    });

    return items;
  }, [acls]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchableItems.filter((item) => {
      if (item.type === 'module') {
        return item.moduleName.toLowerCase().includes(query);
      }
      return (
        item.subModuleName?.toLowerCase().includes(query) ||
        item.moduleName.toLowerCase().includes(query)
      );
    }).slice(0, 10);
  }, [searchQuery, searchableItems]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ borderWidth: '1px 0px 1px 0px', marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px' }} className="xui-bdr-s-solid xui-bdr-[#E9EAEBB2]">
      <nav className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-1">
        {heading || (
          <div>
            <h1 className="xui-font-sz-150 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="xui-font-sz-85 xui-mt-half xui-d-none xui-lg-d-block" style={{ color: 'var(--neutral-500)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="xui-d-inline-flex xui-grid-gap-1 xui-flex-ai-center">
          <div ref={searchRef} className="xui-pos-relative xui-w-250 xui-d-none xui-lg-d-flex xui-flex-dir-column">
            <div className="xui-pos-relative">
              <span className="icon-container xui-pos-absolute" style={{ color: 'var(--neutral-400)', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search modules..."
                className="xui-form-input"
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
              />
            </div>

            {showSearchResults && filteredResults.length > 0 && (
              <div
                className="xui-pos-absolute xui-bg-white xui-bdr-rad-half xui-shadow-lg xui-w-fluid-100"
                style={{
                  top: '48px',
                  left: 0,
                  border: '1px solid var(--neutral-200)',
                  zIndex: 1000,
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                {filteredResults.map((result, index) => (
                  <div
                    key={`${result.moduleStripped}-${result.subModuleStripped || 'module'}-${index}`}
                    className="xui-p-half xui-cursor-pointer"
                    style={{
                      borderBottom: index < filteredResults.length - 1 ? '1px solid var(--neutral-100)' : 'none',
                    }}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {result.type === 'module' ? (
                      <div>
                        <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                          {result.moduleName}
                        </p>
                        <p className="xui-font-sz-75" style={{ color: 'var(--neutral-500)' }}>
                          Module
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                          {result.subModuleName}
                        </p>
                        <p className="xui-font-sz-75" style={{ color: 'var(--neutral-500)' }}>
                          {result.moduleName}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showSearchResults && searchQuery.trim() && filteredResults.length === 0 && (
              <div
                className="xui-pos-absolute xui-bg-white xui-bdr-rad-half xui-shadow-lg xui-w-fluid-100 xui-p-1"
                style={{
                  top: '48px',
                  left: 0,
                  border: '1px solid var(--neutral-200)',
                  zIndex: 1000,
                }}
              >
                <p className="xui-font-sz-85 xui-text-center" style={{ color: 'var(--neutral-500)' }}>
                  No modules found
                </p>
              </div>
            )}
          </div>

          <div className="xui-pos-relative">
            <button
              className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-py-half xui-px-1 xui-bdr-rad-half xui-cursor-pointer"
              style={{
                backgroundColor: 'var(--neutral-100)',
                border: 'none',
              }}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div
                className="xui-w-32 xui-h-32 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                style={{ backgroundColor: 'var(--secondary-500)' }}
              >
                <span className="icon-container" style={{ color: 'white' }}>
                  <User size={16} />
                </span>
              </div>
              <span className="xui-font-sz-85 xui-d-none xui-lg-d-inline" style={{ color: 'var(--neutral-700)' }}>
                {user?.fullname?.split(' ')[0] || 'User'}
              </span>
            </button>

            {showProfile && (
              <div
                className="xui-pos-absolute xui-bg-white xui-bdr-rad-1 xui-shadow-lg xui-p-half"
                style={{
                  top: '48px',
                  right: 0,
                  width: '200px',
                  border: '1px solid var(--neutral-200)',
                  zIndex: 1000,
                }}
              >
                <div className="xui-p-half">
                  <p className="xui-font-sz-90 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
                    {user?.fullname || 'User'}
                  </p>
                  <p className="xui-font-sz-80" style={{ color: 'var(--neutral-500)' }}>
                    {userRole}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="xui-w-40 xui-h-40 xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-bg-light xui-bdr-rad-circle xui-bdr-w-1 xui-bdr-style-solid xui-bdr-fade xui-opacity-6 xui-cursor-pointer menu">
            <Menu size={20} />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
