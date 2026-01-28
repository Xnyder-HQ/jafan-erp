import { Link, useLocation } from 'react-router';
import {
  Dashboard,
  ShoppingCart,
  Cube,
  UserMultiple,
  Settings,
  Logout,
  Report,
  Purchase,
  Money,
  UserAdmin,
  Security,
  Checkmark,
  DataBase,
  Receipt,
  GasStation,
  WarningAlt,
  ChevronDown,
  ChevronUp,
  TagGroup,
  Box,
  DeliveryParcel,
  DeliveryTruck,
  Industry,
  Document,
  Folder,
  SidePanelCloseFilled,
  SidePanelOpenFilled,
} from '@carbon/icons-react';
import { useState, useMemo } from 'react';
import { APP_SHORT_NAME } from '../../Globals';
import { useGeneral } from '../../context/GeneralContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  end?: boolean;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const moduleIcons: Record<string, React.ReactNode> = {
  'sales-customer-management': <ShoppingCart size={20} />,
  'procurement-vendor-management': <Purchase size={20} />,
  'inventory-stock-management': <Box size={20} />,
  'logistics-supply-chain': <DeliveryParcel size={20} />,
  'production-quality-control': <Industry size={20} />,
  'roles': <UserAdmin size={20} />,
  'acls': <Security size={20} />,
  'approvals': <Checkmark size={20} />,
  'logs': <DataBase size={20} />,
  'administration': <UserMultiple size={20} />,
};

const subModuleIcons: Record<string, React.ReactNode> = {
  'customers': <UserMultiple size={16} />,
  'products': <Cube size={16} />,
  'sales-orders': <ShoppingCart size={16} />,
  'invoices': <Receipt size={16} />,
  'block-creditors-report': <WarningAlt size={16} />,
  'discounts': <TagGroup size={16} />,
  'vendors': <UserMultiple size={16} />,
  'purchase-orders': <Purchase size={16} />,
  'vendor-payments': <Money size={16} />,
  'fuel-purchases': <GasStation size={16} />,
  'expenses': <Money size={16} />,
  'raw-materials': <Cube size={16} />,
  'raw-material-stock-logs': <Report size={16} />,
  'finished-goods': <Cube size={16} />,
  'finished-goods-stock-logs': <Report size={16} />,
  'delivery-assignments': <DeliveryParcel size={16} />,
  'supply-logs': <Report size={16} />,
  'logistics-fuel-logs': <GasStation size={16} />,
  'production-batches': <Industry size={16} />,
  'production-teams': <UserMultiple size={16} />,
  'production-qc-logs': <Checkmark size={16} />,
  'production-fuel-logs': <GasStation size={16} />,
  'machine-maintenance-logs': <Settings size={16} />,
  'stacking-logs': <Report size={16} />,
  'users': <UserMultiple size={16} />,
  'vehicles': <DeliveryTruck size={16} />,
  'business-rules': <Settings size={16} />,
  'all-roles': <UserAdmin size={16} />,
  'roles-overview': <Dashboard size={16} />,
  'role-acls': <Security size={16} />,
  'all-acls': <Security size={16} />,
  'all-approvals': <Checkmark size={16} />,
  'approvals-overview': <Dashboard size={16} />,
  'all-logs': <Report size={16} />,
  'logs-overview': <Dashboard size={16} />,
  'sales-customer-management-overview': <Dashboard size={16} />,
  'procurement-vendor-management-overview': <Dashboard size={16} />,
  'inventory-stock-management-overview': <Dashboard size={16} />,
  'production-quality-control-overview': <Dashboard size={16} />,
  'logistics-supply-chain-overview': <Dashboard size={16} />,
  'administration-overview': <Dashboard size={16} />,
};

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

const moduleGroups: Record<string, string> = {
  'sales-customer-management': 'Operations',
  'procurement-vendor-management': 'Operations',
  'inventory-stock-management': 'Operations',
  'logistics-supply-chain': 'Operations',
  'production-quality-control': 'Operations',
  'roles': 'Administration',
  'acls': 'Administration',
  'approvals': 'Administration',
  'logs': 'Administration',
  'administration': 'Administration',
};

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { acls } = useGeneral();
  const location = useLocation();

  const toggleExpand = (label: string) => {
    if (collapsed) return;
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const navGroups = useMemo(() => {
    const groups: Record<string, NavItem[]> = {
      'Overview': [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Dashboard size={20} />,
        },
      ],
      'Operations': [],
      'Administration': [],
    };

    const aclsByModule: Record<string, { moduleName: string; moduleStripped: string; subModules: { name: string; stripped: string }[] }> = {};

    acls.forEach((acl) => {
      const moduleStripped = acl.Module?.stripped;
      const moduleName = acl.Module?.name;
      const subModuleStripped = acl.SubModule?.stripped;
      const subModuleName = acl.SubModule?.name;

      if (moduleStripped && moduleName) {
        if (!aclsByModule[moduleStripped]) {
          aclsByModule[moduleStripped] = {
            moduleName,
            moduleStripped,
            subModules: [],
          };
        }
        if (subModuleStripped && subModuleName) {
          const exists = aclsByModule[moduleStripped].subModules.some(s => s.stripped === subModuleStripped);
          if (!exists) {
            aclsByModule[moduleStripped].subModules.push({
              name: subModuleName,
              stripped: subModuleStripped,
            });
          }
        }
      }
    });

    Object.values(aclsByModule).forEach((module) => {
      const groupName = moduleGroups[module.moduleStripped] || 'Operations';
      const basePath = modulePaths[module.moduleStripped] || `/dashboard/${module.moduleStripped}`;
      const moduleIcon = moduleIcons[module.moduleStripped] || <Folder size={20} />;

      const children: NavItem[] = module.subModules.map((subModule) => {
        const subPath = subModulePaths[subModule.stripped] ?? `/${subModule.stripped}`;
        const subIcon = subModuleIcons[subModule.stripped] || <Document size={16} />;

        return {
          label: subModule.name,
          path: `${basePath}${subPath}`,
          icon: subIcon,
          end: subPath === '',
        };
      });

      if (children.length > 0) {
        const navItem: NavItem = {
          label: module.moduleName,
          path: basePath,
          icon: moduleIcon,
          children,
        };
        groups[groupName].push(navItem);
      }
    });

    const result: NavGroup[] = [];
    ['Overview', 'Operations', 'Administration'].forEach((groupLabel) => {
      if (groups[groupLabel].length > 0) {
        result.push({
          label: groupLabel,
          items: groups[groupLabel],
        });
      }
    });

    return result;
  }, [acls]);

  const getIsActive = (item: NavItem, siblings?: NavItem[]) => {
    const pathname = location.pathname;
    if (item.path === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (item.end && siblings) {
      const siblingPaths = siblings.filter(s => s.path !== item.path).map(s => s.path);
      return pathname === item.path ||
        (pathname.startsWith(item.path + '/') &&
          !siblingPaths.some(sp => pathname.startsWith(sp)));
    }
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  const renderNavItem = (item: NavItem, isChild = false, siblings?: NavItem[]) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label) && !collapsed;

    if (hasChildren) {
      return (
        <div key={item.label} className={`sidebar-dropdown ${isExpanded ? 'open' : ''}`}>
          <div
            className="sidebar-link sidebar-link-parent"
            onClick={() => toggleExpand(item.label)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-text">{item.label}</span>
            <span className="sidebar-link-chevron">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
          {isExpanded && (
            <div className="sidebar-dropdown-menu">
              {item.children?.map((child) => renderNavItem(child, true, item.children))}
            </div>
          )}
        </div>
      );
    }

    const isActive = getIsActive(item, siblings);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`sidebar-link ${isChild ? 'sidebar-link-child' : ''} ${isActive ? 'active' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="sidebar-link-icon">{item.icon}</span>
        <span className="sidebar-link-text">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className={`navigator ${collapsed ? 'collapsed' : ''} xui-pos-relative`}>
      <div className="brand xui-py-1">
        <div className={`xui-w-fluid-100 xui-d-flex xui-flex-ai-center ${collapsed ? 'xui-flex-jc-center' : 'xui-flex-jc-space-between'}`}>
          {!collapsed ? (
            <>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                <div className="sidebar-logo">JB</div>
                <div className="sidebar-brand-text">
                  <span className="sidebar-brand-name">{APP_SHORT_NAME}</span>
                  <span className="sidebar-brand-subtitle">Block Industry</span>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="xui-d-none xui-lg-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                style={{
                  alignItems: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary-600)',
                  color: '#000',
                }}
                title="Collapse sidebar"
              >
                <SidePanelCloseFilled size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="xui-d-none xui-lg-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              style={{
                alignItems: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary-600)',
                color: '#000',
                cursor: 'pointer',
              }}
              title="Expand sidebar"
            >
              <SidePanelOpenFilled size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="links xui-font-1">
        <div>
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              {!collapsed && <span className="sidebar-group-label">{group.label}</span>}
              {group.items.map((item) => renderNavItem(item))}
            </div>
          ))}
        </div>

        <div className="bottom-fixed">
          <div
            className="sidebar-link xui-cursor-pointer"
            title={collapsed ? 'Log out' : undefined}
            xui-modal-open="logout-modal"
          >
            <span className="sidebar-link-icon"><Logout size={18} /></span>
            {!collapsed && <span className="sidebar-link-text">Log out</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
