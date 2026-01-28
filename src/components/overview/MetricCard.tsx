import CountUp from 'react-countup';
import { ArrowUp, ArrowDown } from '@carbon/icons-react';
import { formatCompactNumber } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  decimals?: number;
  useCompact?: boolean;
}

const MetricCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  iconBgColor,
  iconColor,
  trend,
  decimals = 0,
  useCompact = false,
}: MetricCardProps) => {
  return (
    <div className="stat-card">
      <div className="xui-d-flex xui-flex-ai-start xui-flex-jc-space-between" style={{flexWrap: 'nowrap'}}>
        <div>
          <p className="stat-label">{title}</p>
          <div className="xui-d-flex xui-flex-ai-baseline xui-grid-gap-half xui-mt-half">
            {prefix && (
              <span className="xui-font-sz-100" style={{ color: 'var(--neutral-500)' }}>
                {prefix}
              </span>
            )}
            <span className="stat-value">
              {useCompact ? (
                formatCompactNumber(value)
              ) : (
                <CountUp end={value} duration={1.5} separator="," decimals={decimals} />
              )}
            </span>
            {suffix && (
              <span className="xui-font-sz-90" style={{ color: 'var(--neutral-500)' }}>
                {suffix}
              </span>
            )}
          </div>
          {trend && (
            <div className={`stat-trend xui-mt-half ${trend.isPositive ? 'positive' : 'negative'}`}>
              <span className="icon-container icon-container-sm">
                {trend.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="xui-font-sz-80" style={{ color: 'var(--neutral-500)' }}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className="stat-icon"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          <span className="icon-container">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
