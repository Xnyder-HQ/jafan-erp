import { WarningAlt, Renew } from '@carbon/icons-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data.',
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="xui-py-3 xui-text-center xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-grid-gap-1">
      <div style={{ color: 'var(--error)' }}>
        <WarningAlt size={48} />
      </div>
      <div>
        <p className="xui-font-sz-90 xui-font-w-500" style={{ color: 'var(--error)' }}>{title}</p>
        <p className="xui-font-sz-80 xui-opacity-6 xui-mt-half">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-mt-half"
          style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
        >
          <span className="icon-container">
            <Renew size={16} />
          </span>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
