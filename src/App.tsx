import React, { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUploadStore, selectUploadSummary } from './state/useUploadStore';
import { uploadFileAPI } from './api/uploadService'; // קריאה לשירות האמיתי
import { mockUploadFileAPI } from './api/mockService';
import { useUploadPolling } from './hooks/useUploadPolling';
import { FileList } from './components/FileList';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const files = useUploadStore((state) => state.files);
  const addFiles = useUploadStore((state) => state.addFiles);
  const updateFile = useUploadStore((state) => state.updateFile);
  const summary = useUploadStore(useShallow(selectUploadSummary));

  useUploadPolling();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // 1. Domain Models Creation (Synchronous)
    const newFiles = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      originalName: file.name,
      uploadName: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
      file,
      status: 'queued' as const,
      progress: 0,
    }));

    // 2. Update UI instantly
    addFiles(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // 3. Process Uploads asynchronously
    newFiles.forEach(async (fileObj) => {
      try {
        updateFile(fileObj.id, { status: 'uploading', progress: 0 });

        // כאן הקריאה ל-Mock שיצרנו
        await mockUploadFileAPI(
          fileObj.file,
          fileObj.uploadName,
          (progress) => updateFile(fileObj.id, { progress })
        );

        // ברגע שההעלאה הסתיימה (100%), אנחנו מעבירים לסטטוס processing.
        // מכאן, ה-useUploadPolling שכתבנו לוקח פיקוד וממתין לתשובת השרת.
        updateFile(fileObj.id, { status: 'processing', progress: 100 });
      } catch (error: any) {
        updateFile(fileObj.id, { status: 'failed', errorMessage: error.message });
      }
    });
  };

  return (
    <div className="p-8 font-sans max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Portal - Edge Test</h1>
      
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500"
        />
      </div>

      <div className="mb-4 text-sm font-mono bg-gray-100 p-2 rounded">
        Summary: {JSON.stringify(summary)}
      </div>

      {/* File List – refined UI */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Uploaded Files</h2>
        <FileList files={files} />
      </div>
    </div>
  );
}