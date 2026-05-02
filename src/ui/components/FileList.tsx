import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { FileListControls, type FileStatusFilter, type FileSortField, type SortDirection } from './FileListControls';
import { FileListItem } from './FileListItem';
import type { UploadableFile, ClientFileStatus } from '../../core/types';
import '../style/FileList.css';

interface FileListProps {
  files: UploadableFile[];
  onCancelFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onRetryAll: () => void;
}

const STATUS_ORDER: Record<ClientFileStatus, number> = {
  uploading: 0,
  queued: 1,
  processing: 2,
  accepted: 3,
  rejected: 4,
  failed: 5,
  canceled: 6,
};

export const FileList: React.FC<FileListProps> = ({ files, onCancelFile, onRetryFile, onRetryAll }) => {
  const [fileStatusFilter, setFileStatusFilter] = useState<FileStatusFilter>('all');
  const [fileSortField, setFileSortField] = useState<FileSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const hasFailedFiles = files.some(f => ['failed', 'canceled'].includes(f.status));

  const displayFiles = useMemo(() => {
    let result = [...files];

    // Filter
    if (fileStatusFilter !== 'all') {
      result = result.filter(f => f.status === fileStatusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (fileSortField === 'name') {
        cmp = a.originalName.localeCompare(b.originalName, undefined, { sensitivity: 'base' });
      } else {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [files, fileStatusFilter, fileSortField, sortDirection]);

  const handleSortChange = (field: FileSortField) => {
    if (fileSortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setFileSortField(field);
      setSortDirection('asc');
    }
  };

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

      <FileListControls
        totalFiles={files.length}
        filteredFilesCount={displayFiles.length}
        statusFilter={fileStatusFilter}
        onFilterChange={setFileStatusFilter}
        sortField={fileSortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      <AnimatePresence>
        {displayFiles.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            onCancelFile={onCancelFile}
            onRetryFile={onRetryFile}
          />
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <p className="file-list__empty">No files uploaded yet.</p>
      )}
      {files.length > 0 && displayFiles.length === 0 && (
        <p className="file-list__empty">No files match the selected filter.</p>
      )}
    </div>
  );
};