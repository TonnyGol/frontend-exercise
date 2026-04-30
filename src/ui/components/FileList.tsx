import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, FileText, Image, File } from 'lucide-react';
import type { UploadableFile } from '../../core/types';

interface FileListProps {
  files: UploadableFile[];
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return Image;
  if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext || '')) return FileText;
  return File;
};

export const FileList: React.FC<FileListProps> = ({ files }) => {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Uploaded Files</h2>
      <AnimatePresence>
        {files.map((file) => {
          const Icon = getFileIcon(file.originalName);
          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-5 p-5 bg-white rounded-xl shadow-sm mb-4 hover:shadow-lg hover:scale-[1.02] transition-shadow duration-200"
            >
              <Icon className="w-6 h-6 text-gray-500 flex-shrink-0 hover:text-blue-600 transition-colors duration-200" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-900">{file.originalName}</p>
                {file.status === 'uploading' && (
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-orange-500 rounded-full"
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                {file.errorMessage && (
                  <p className="text-xs text-red-500 mt-1 truncate">{file.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'processing' && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                )}
                {file.status === 'accepted' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Accepted
                  </span>
                )}
                {(file.status === 'rejected' || file.status === 'failed') && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                    <XCircle className="w-4 h-4" />
                    Rejected
                  </span>
                )}
                {file.status === 'queued' && (
                  <span className="w-2 h-2 bg-gray-400 rounded-full" title="Queued" />
                )}
                {file.status === 'uploading' && (
                  <span className="text-xs font-mono text-gray-600">{file.progress}%</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {files.length === 0 && (
        <p className="text-gray-500 text-center py-8">No files uploaded yet.</p>
      )}
    </div>
  );
};