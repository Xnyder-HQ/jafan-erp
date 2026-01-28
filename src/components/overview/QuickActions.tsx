import { ShoppingCart, Cube, DeliveryTruck, UserMultiple, Report } from '@carbon/icons-react';
import { useNavigate } from 'react-router';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  path: string;
}

const QuickActions = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      label: 'New Sale',
      icon: <ShoppingCart size={20} />,
      bgColor: 'var(--primary-100)',
      iconColor: 'var(--primary-700)',
      path: '/dashboard/sales/orders/add',
    },
    {
      label: 'Log Production',
      icon: <Cube size={20} />,
      bgColor: 'var(--info-light)',
      iconColor: 'var(--info)',
      path: '/dashboard/production/daily',
    },
    {
      label: 'Log Delivery',
      icon: <DeliveryTruck size={20} />,
      bgColor: 'var(--success-light)',
      iconColor: 'var(--success)',
      path: '/dashboard/logistics/supply-log',
    },
    {
      label: 'Add Customer',
      icon: <UserMultiple size={20} />,
      bgColor: 'var(--warning-light)',
      iconColor: 'var(--warning)',
      path: '/dashboard/sales/customers/add',
    },
    {
      label: 'Sales Overview',
      icon: <Report size={20} />,
      bgColor: 'var(--neutral-200)',
      iconColor: 'var(--neutral-700)',
      path: '/dashboard/sales/overview',
    },
  ];

  return (
    <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
      <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
        <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Quick Actions</h3>
      </div>
      <div className="xui-p-1">
        <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-5 xui-grid-gap-1">
          {actions.map((action) => (
            <button
              key={action.label}
              className="xui-d-flex xui-flex-ai-center xui-flex-dir-column xui-text-center xui-p-half xui-bdr-rad-half xui-cursor-pointer"
              style={{ background: '#FFFFFF', border: '1px solid var(--neutral-200)', transition: 'all 0.24s ease' }}
              onClick={() => navigate(action.path)}
            >
              <div
                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-bdr-rad-half"
                style={{ width: '36px', height: '36px', backgroundColor: action.bgColor, color: action.iconColor }}
              >
                <span className="icon-container">{action.icon}</span>
              </div>
              <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--neutral-700)' }}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
