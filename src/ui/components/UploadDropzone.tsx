import React from 'react';
import { useDropzone } from 'react-dropzone';
import '../style/UploadDropzone.css';

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
    <section
      {...getRootProps()}
      className={`upload-dropzone ${isDragActive ? 'upload-dropzone--active' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Folder animation */}
      <div className="upload-dropzone__folder">
        {/* Back cover */}
        <div className="upload-dropzone__back"></div>
        {/* Paper sheets */}
        <div className="upload-dropzone__paper upload-dropzone__paper--1"></div>
        <div className="upload-dropzone__paper upload-dropzone__paper--2"></div>
        <div className="upload-dropzone__paper upload-dropzone__paper--3"></div>
        {/* Front cover */}
        <div className="upload-dropzone__front"></div>
      </div>

      <p className="upload-dropzone__title">
        {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to browse'}
      </p>
      <p className="upload-dropzone__subtitle">Supports multiple files</p>
    </section>
  );
};