import React from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFilesSelected }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onFilesSelected(acceptedFiles);
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 min-h-[250px] flex flex-col justify-center items-center hover:scale-105 ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <input {...getInputProps()} />
      <FileUp className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
      <p className="text-lg font-medium text-gray-700">
        {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
      </p>
      <p className="text-sm text-gray-500 mt-2">Supports multiple files</p>
    </div>
  );
};