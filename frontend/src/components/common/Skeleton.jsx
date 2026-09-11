import React from 'react';
import './common.css';

export function Skeleton({ width = '100%', height = 16, radius, style = {} }) {
  return (
    <span
      className="gp-skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, lastWidth = '60%' }) {
  return (
    <span className="gp-stack" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="gp-skeleton-card" aria-hidden="true">
      <div className="gp-row" style={{ marginBottom: '1rem' }}>
        <Skeleton width={38} height={38} radius={12} />
        <Skeleton width="50%" height={16} />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="gp-grid" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
