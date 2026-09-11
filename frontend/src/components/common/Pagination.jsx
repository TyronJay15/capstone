import React from 'react';
import './common.css';

function buildPageList(current, total) {
  const pages = [];
  const add = (p) => pages.push(p);
  if (total <= 7) {
    for (let i = 1; i <= total; i += 1) add(i);
    return pages;
  }
  add(1);
  if (current > 3) add('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) add(i);
  if (current < total - 2) add('…');
  add(total);
  return pages;
}

const Pagination = ({ page, pageSize, totalItems, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPageList(page, totalPages);

  return (
    <div className="gp-pagination">
      <div className="gp-pagination-info">
        Showing {from}–{to} of {totalItems}
      </div>
      <div className="gp-pagination-controls">
        <button
          type="button"
          className="gp-page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`gap-${idx}`} className="gp-pagination-info" style={{ padding: '0 0.25rem' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`gp-page-btn ${p === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="gp-page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
