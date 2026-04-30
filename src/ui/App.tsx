import { useShallow } from 'zustand/react/shallow';
import { useUploadStore, selectUploadSummary } from '../core/state/useUploadStore';
//import { uploadFileAPI } from '../infrastructure/api/uploadService'; // קריאה לשירות האמיתי
import { mockUploadFileAPI } from '../infrastructure/api/mockService';
import { useUploadPolling } from '../core/hooks/useUploadPolling';
import { FileList } from './components/FileList';
import { UploadDropzone } from './components/UploadDropzone';
import { SummaryCards } from './components/SummaryCards';

export default function App() {
  const files = useUploadStore((state) => state.files);
  const addFiles = useUploadStore((state) => state.addFiles);
  const updateFile = useUploadStore((state) => state.updateFile);
  const summary = useUploadStore(useShallow(selectUploadSummary));

  useUploadPolling();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // 1. Domain Models Creation
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

    // 3. Process Uploads asynchronously
    newFiles.forEach(async (fileObj) => {
      try {
        updateFile(fileObj.id, { status: 'uploading', progress: 0 });
        await mockUploadFileAPI(
          fileObj.file,
          fileObj.uploadName,
          (progress) => updateFile(fileObj.id, { progress })
        );
        updateFile(fileObj.id, { status: 'processing', progress: 100 });
      } catch (error: any) {
        updateFile(fileObj.id, { status: 'failed', errorMessage: error.message });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Upload Portal</h1>
        <UploadDropzone onFilesSelected={handleFilesSelected} />
        <br></br><br></br><br></br>
        <div className="mb-8"><SummaryCards summary={summary} /></div>
        <br></br><br></br><br></br><br></br>
        <div className="mt-10"><FileList files={files} /></div>
      </div>
    </div>
  );
}