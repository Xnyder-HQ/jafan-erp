import { FolderOpen } from '@carbon/icons-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

const EmptyState = ({
  title = 'No data found',
  message = 'There are no items to display.',
  icon,
}: EmptyStateProps) => {
  return (
    <div className="xui-py-3 xui-text-center xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-grid-gap-1">
      <div className="xui-opacity-3">
        {icon || <FolderOpen size={48} />}
      </div>
      <div>
        <p className="xui-font-sz-90 xui-font-w-500 xui-opacity-8">{title}</p>
        <p className="xui-font-sz-80 xui-opacity-5 xui-mt-half">{message}</p>
      </div>
    </div>
  );
};

export default EmptyState;
