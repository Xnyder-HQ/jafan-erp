import { WarningAlt, Information, WarningFilled, ChevronRight } from '@carbon/icons-react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  time: string;
}

interface AlertsWidgetProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

const AlertsWidget = ({ alerts, onViewAll }: AlertsWidgetProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <WarningFilled size={18} />;
      case 'warning':
        return <WarningAlt size={18} />;
      default:
        return <Information size={18} />;
    }
  };

  const getAlertIconBg = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'var(--error)';
      case 'warning':
        return 'var(--warning)';
      default:
        return 'var(--info)';
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'var(--error-light)';
      case 'warning':
        return 'var(--warning-light)';
      default:
        return 'var(--info-light)';
    }
  };

  return (
    <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
      <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
        <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Alerts & Notifications</h3>
        <button
          className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-600)',
            fontSize: '13px',
          }}
          onClick={onViewAll}
        >
          View all
          <span className="icon-container">
            <ChevronRight size={16} />
          </span>
        </button>
      </div>
      <div className="xui-p-1">
        {alerts.length === 0 ? (
          <div className="xui-text-center xui-py-2">
            <p className="xui-font-sz-85 xui-opacity-5">No alerts at this time</p>
          </div>
        ) : (
          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="xui-d-flex xui-flex-ai-start xui-grid-gap-1 xui-p-half xui-bdr-rad-half"
                style={{ backgroundColor: getAlertBg(alert.type) }}
              >
                <div
                  className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-bdr-rad-half"
                  style={{ width: '32px', height: '32px', backgroundColor: getAlertIconBg(alert.type), color: 'white', flexShrink: 0 }}
                >
                  <span className="icon-container">{getAlertIcon(alert.type)}</span>
                </div>
                <div className="xui-flex-1">
                  <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                    {alert.title}
                  </p>
                  <p className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--neutral-600)' }}>
                    {alert.message}
                  </p>
                  <p className="xui-font-sz-75 xui-mt-half" style={{ color: 'var(--neutral-400)' }}>
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
