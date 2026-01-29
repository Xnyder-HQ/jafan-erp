import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  pageSize,
  onPageSizeChange,
}) => {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const getVisiblePages = () => {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 1;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

  return (
    <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ padding: '0 1rem' }}>
      {onPageSizeChange && pageSize ? (
        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-80">
          <span className="xui-opacity-6">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              border: '1px solid var(--neutral-300)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '12px',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      ) : <div />}

      {totalPages > 1 && (
        <div className="xui-pagination">
          <div
            className={`prev ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          >
            <div className="icon">&#9668;</div>
            <div className="text"><span>Previous</span></div>
          </div>

          <div className="pages">
            {showStartEllipsis && (
              <>
                <div
                  className={`counter ${currentPage === 1 ? 'active' : ''}`}
                  onClick={() => onPageChange(1)}
                >
                  1
                </div>
                <div className="counter">...</div>
              </>
            )}

            {visiblePages.map(page => (
              <div
                key={page}
                className={`counter ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </div>
            ))}

            {showEndEllipsis && (
              <>
                <div className="counter">...</div>
                <div
                  className={`counter ${currentPage === totalPages ? 'active' : ''}`}
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </div>
              </>
            )}

            <div className="default">Page {currentPage} of {totalPages}</div>
          </div>

          <div
            className={`next ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          >
            <div className="text"><span>Next</span></div>
            <div className="icon">&#9658;</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;
