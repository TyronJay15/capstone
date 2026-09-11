import React from 'react';
import './common.css';

const SearchFilter = ({
  search,
  onSearchChange,
  placeholder = 'Search…',
  filters = [],
  children
}) => (
  <div className="gp-toolbar">
    <div className="gp-search">
      <span className="gp-search-icon" aria-hidden="true">🔍</span>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
    {filters.map((filter) => (
      <select
        key={filter.id}
        className="gp-select"
        value={filter.value}
        onChange={(e) => filter.onChange(e.target.value)}
        aria-label={filter.label}
      >
        {filter.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ))}
    {children}
  </div>
);

export default SearchFilter;
