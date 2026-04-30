import React from 'react';
import type { UploadableFile } from '../types';

interface FileListProps {
  files: UploadableFile[];
}

export const FileList: React.FC<FileListProps> = ({ files }) => {
  const renderStatusIndicator = (file: UploadableFile) => {
    switch (file.status) {
      case 'uploading':
        return (
          <div className="w-12 h-2 bg-[#FF9800] rounded-lg ml-2">
            <div className="h-2 bg-[#FF6B00] rounded-full w-full"></div>
          </div>
        );
      case 'processing':
        return (
          <div className="w-6 h-6 bg-[#2196F3] rounded-full ml-2 animate-spin" style={{ animationDuration: '1s' }} />
        );
      case 'accepted':
        return <span className="text-[#4CAF50] font-medium ml-2">✔️</span>;
      case 'rejected':
        return <span className="text-[#F44336] font-medium ml-2">✖</span>;
      default:
        return <span className="text-[#9E9E9E] ml-2">...</span>;
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h3 className="text-xl font-medium mb-4">Files</h3>
      {files.length === 0 ? (
        <p className="text-gray-600">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-3 divide-y divide-gray-200 divid
e-y-[1px]_last:mb-0">
          {files.map(file => (
            <li
              key={file.id}
              className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:bg-[#F5F5F5]"
            >
              <div className="flex-1 min-w-0">
                <span className="truncate">{file.originalName}</span>
              </div>
              <div className="flex items-center gap-2">
                {renderStatusIndicator(file)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};