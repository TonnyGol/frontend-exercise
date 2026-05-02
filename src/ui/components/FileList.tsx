import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, FileText, Image, File, X, Ban, RefreshCw, Filter, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { ProcessingLoader } from './ProcessingLoader';
import type { UploadableFile, ClientFileStatus } from '../../core/types';
import '../style/FileList.css';

interface FileListProps {
  files: UploadableFile[];
  onCancelFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onRetryAll: () => void;
}

type StatusFilter = 'all' | ClientFileStatus;
type SortField = 'name' | 'status';
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: Record<ClientFileStatus, number> = {
  uploading: 0,
  queued: 1,
  processing: 2,
  accepted: 3,
  rejected: 4,
  failed: 5,
  canceled: 6,
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All Statuses',
  queued: 'Queued',
  uploading: 'Uploading',
  processing: 'Processing',
  accepted: 'Accepted',
  rejected: 'Rejected',
  failed: 'Failed',
  canceled: 'Canceled',
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return Image;
  if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext || '')) return FileText;
  return File;
};

export const FileList: React.FC<FileListProps> = ({ files, onCancelFile, onRetryFile, onRetryAll }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const hasFailedFiles = files.some(f => ['failed', 'canceled'].includes(f.status));

  const filteredAndSorted = useMemo(() => {
    let result = [...files];

    // Filter
    if (statusFilter !== 'all') {
      result = result.filter(f => f.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.originalName.localeCompare(b.originalName, undefined, { sensitivity: 'base' });
      } else {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [files, statusFilter, sortField, sortDirection]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = sortDirection === 'asc' ? ChevronUp : ChevronDown;

  return (
    <div className="file-list">
      <div className="file-list__header">
        <h2 className="file-list__title">Uploaded Files</h2>
        {hasFailedFiles && (
          <button className="file-list__retry-all-btn" onClick={onRetryAll}>
            <RefreshCw className="file-list__retry-all-icon" size={16} />
            Retry All Failed
          </button>
        )}
      </div>

      {/* Filter & Sort Controls */}
      {files.length > 0 && (
        <div className="file-list__controls">
          <div className="file-list__filter">
            <Filter className="file-list__control-icon" size={14} />
            <select
              id="status-filter"
              className="file-list__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
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
              onClick={() => handleSortToggle('name')}
            >
              Name
              {sortField === 'name' && <SortIcon size={12} />}
            </button>
            <button
              className={`file-list__sort-btn ${sortField === 'status' ? 'file-list__sort-btn--active' : ''}`}
              onClick={() => handleSortToggle('status')}
            >
              Status
              {sortField === 'status' && <SortIcon size={12} />}
            </button>
          </div>

          {statusFilter !== 'all' && (
            <span className="file-list__result-count">
              {filteredAndSorted.length} of {files.length} files
            </span>
          )}
        </div>
      )}

      <AnimatePresence>
        {filteredAndSorted.map((file) => {
          const Icon = getFileIcon(file.originalName);
          const isCancelable = file.status === 'uploading' || file.status === 'queued';
          const isRetryable = file.status === 'failed' || file.status === 'canceled';

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="file-list__item"
            >
              <Icon className="file-list__file-icon" />
              <div className="file-list__info">
                <p className="file-list__filename">{file.originalName}</p>
                {file.status === 'uploading' && (
                  <div className="file-list__progress-track">
                    <motion.div
                      className="file-list__progress-bar"
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                {file.errorMessage && (
                  <p className="file-list__error">{file.errorMessage}</p>
                )}
              </div>
              <div className="file-list__status">
                {file.status === 'processing' && (
                  <div className="file-list__status-processing">
                    <ProcessingLoader />
                    <span className="file-list__status-text">Processing</span>
                  </div>
                )}
                {file.status === 'accepted' && (
                  <span className="file-list__badge--accepted">
                    <CheckCircle className="file-list__badge-icon" />
                    Accepted
                  </span>
                )}
                {isRetryable && (
                  <button
                    className="file-list__retry-btn"
                    onClick={() => onRetryFile(file.id)}
                    title="Retry upload"
                  >
                    <RefreshCw className="file-list__retry-icon" size={16} />
                    Retry
                  </button>
                )}
                {(file.status === 'failed') && (
                  <span className="file-list__badge--rejected">
                    <XCircle className="file-list__badge-icon" />
                    Failed
                  </span>
                )}
                {file.status === 'canceled' && (
                  <span className="file-list__badge--canceled">
                    <Ban className="file-list__badge-icon" />
                    Canceled
                  </span>
                )}
                {file.status === 'queued' && (
                  <span className="file-list__queued-dot" title="Queued" />
                )}
                {file.status === 'uploading' && (
                  <span className="file-list__progress-text">{file.progress}%</span>
                )}

                {/* Cancel button for in-progress uploads */}
                {isCancelable && (
                  <button
                    className="file-list__cancel-btn"
                    onClick={() => onCancelFile(file.id)}
                    title="Cancel upload"
                  >
                    <X className="file-list__cancel-icon" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {files.length === 0 && (
        <p className="file-list__empty">No files uploaded yet.</p>
      )}
      {files.length > 0 && filteredAndSorted.length === 0 && (
        <p className="file-list__empty">No files match the selected filter.</p>
      )}
    </div>
  );
};