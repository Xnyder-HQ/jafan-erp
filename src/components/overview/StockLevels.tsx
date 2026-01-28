import { ChevronRight } from '@carbon/icons-react';
import { useNavigate } from 'react-router';

interface StockItem {
  name: string;
  current: number;
  minimum: number;
  unit: string;
}

interface StockLevelsProps {
  items: StockItem[];
}

const StockLevels = ({ items }: StockLevelsProps) => {
  const navigate = useNavigate();

  const getStockStatus = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 50) return { color: 'var(--error)', bg: 'var(--error-light)', label: 'LOW' };
    if (percentage <= 100) return { color: 'var(--warning)', bg: 'var(--warning-light)', label: 'MODERATE' };
    return { color: 'var(--success)', bg: 'var(--success-light)', label: 'GOOD' };
  };

  const getProgressWidth = (current: number, minimum: number) => {
    const percentage = Math.min((current / (minimum * 2)) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
      <div className="card-header">
        <h3 className="card-title">Stock Levels</h3>
        <button
          className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-600)',
            fontSize: '13px',
          }}
          onClick={() => navigate('/dashboard/inventory')}
        >
          View all
          <span className="icon-container">
            <ChevronRight size={16} />
          </span>
        </button>
      </div>
      <div className="card-body">
        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
          {items.map((item) => {
            const status = getStockStatus(item.current, item.minimum);
            return (
              <div key={item.name}>
                <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-half">
                  <span className="xui-font-sz-85" style={{ color: 'var(--neutral-800)' }}>
                    {item.name}
                  </span>
                  <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                    <span className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-700)' }}>
                      {item.current.toLocaleString()} {item.unit}
                    </span>
                    <span
                      className="xui-font-sz-70 xui-px-half xui-bdr-rad-half"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <div
                  className="xui-w-fluid-100 xui-h-6 xui-bdr-rad-half"
                  style={{ backgroundColor: 'var(--neutral-200)' }}
                >
                  <div
                    className="xui-h-fluid-100 xui-bdr-rad-half"
                    style={{
                      width: getProgressWidth(item.current, item.minimum),
                      backgroundColor: status.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <p className="xui-font-sz-75 xui-mt-half" style={{ color: 'var(--neutral-400)' }}>
                  Minimum: {item.minimum.toLocaleString()} {item.unit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StockLevels;
