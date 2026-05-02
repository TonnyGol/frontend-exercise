import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, FileText, Image, File, X, Ban, RefreshCw } from 'lucide-react';
import { ProcessingLoader } from './ProcessingLoader';
import type { UploadableFile } from '../../core/types';

interface FileListItemProps {
  file: UploadableFile;
  onCancelFile: (id: string) => void;
  onRetryFile: (id: string) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return Image;
  if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext || '')) return FileText;
  return File;
};

export const FileListItem: React.FC<FileListItemProps> = ({ file, onCancelFile, onRetryFile }) => {
  const Icon = getFileIcon(file.originalName);
  const isCancelable = file.status === 'uploading' || file.status === 'queued';
  const isRetryable = file.status === 'failed' || file.status === 'canceled';

  return (
    <motion.div
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
};
