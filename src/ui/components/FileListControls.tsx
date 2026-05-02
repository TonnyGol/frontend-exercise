import React from 'react';
import { Filter, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import type { ClientFileStatus } from '../../core/types';

export type FileStatusFilter = 'all' | ClientFileStatus;
export type FileSortField = 'name' | 'status';
export type SortDirection = 'asc' | 'desc';

export const STATUS_LABELS: Record<FileStatusFilter, string> = {
  all: 'All Statuses',
  queued: 'Queued',
  uploading: 'Uploading',
  processing: 'Processing',
  accepted: 'Accepted',
  rejected: 'Rejected',
  failed: 'Failed',
  canceled: 'Canceled',
};

interface FileListControlsProps {
  totalFiles: number;
  filteredFilesCount: number;
  statusFilter: FileStatusFilter;
  onFilterChange: (filter: FileStatusFilter) => void;
  sortField: FileSortField;
  sortDirection: SortDirection;
  onSortChange: (field: FileSortField) => void;
}

export const FileListControls: React.FC<FileListControlsProps> = ({
  totalFiles,
  filteredFilesCount,
  statusFilter,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
}) => {
  if (totalFiles === 0) return null;

  const SortIcon = sortDirection === 'asc' ? ChevronUp : ChevronDown;

  return (
    <div className="file-list__controls">
      <div className="file-list__filter">
        <Filter className="file-list__control-icon" size={14} />
        <select
          id="status-filter"
          className="file-list__select"
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value as FileStatusFilter)}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="file-list__sort-group">
        <ArrowUpDown className="file-list__control-icon" size={14} />
        <button
          className={`file-list__sort-btn ${sortField === 'name' ? 'file-list__sort-btn--active' : ''}`}
          onClick={() => onSortChange('name')}
        >
          Name
          {sortField === 'name' && <SortIcon size={12} />}
        </button>
        <button
          className={`file-list__sort-btn ${sortField === 'status' ? 'file-list__sort-btn--active' : ''}`}
          onClick={() => onSortChange('status')}
        >
          Status
          {sortField === 'status' && <SortIcon size={12} />}
        </button>
      </div>

      {statusFilter !== 'all' && (
        <span className="file-list__result-count">
          {filteredFilesCount} of {totalFiles} files
        </span>
      )}
    </div>
  );
};
