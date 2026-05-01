import { useShallow } from 'zustand/react/shallow';
import { useUploadStore, selectUploadSummary } from '../core/state/useUploadStore';
import { uploadFileAPI } from '../infrastructure/api/uploadService';
import { useUploadPolling } from '../core/hooks/useUploadPolling';
import { validateFile } from '../core/validation';
import { FileList } from './components/FileList';
import { UploadDropzone } from './components/UploadDropzone';
import { SummaryCards } from './components/SummaryCards';
import type { UploadableFile } from '../core/types';
import { UploadBackground } from './components/UploadBackground';
import '../App.css';

export default function App() {
  const files = useUploadStore((state) => state.files);
  const addFiles = useUploadStore((state) => state.addFiles);
  const updateFile = useUploadStore((state) => state.updateFile);
  const cancelFile = useUploadStore((state) => state.cancelFile);
  const summary = useUploadStore(useShallow(selectUploadSummary));

  useUploadPolling();

  const processUpload = async (fileObj: UploadableFile) => {
    // Client-side validation — fail fast before uploading (Gap F fix)
    const validation = validateFile(fileObj.file);
    if (!validation.valid) {
      updateFile(fileObj.id, { status: 'rejected', errorMessage: validation.error });
      return;
    }

    try {
      updateFile(fileObj.id, { status: 'uploading', progress: 0 });
      await uploadFileAPI(
        fileObj.file,
        fileObj.uploadName,
        (progress) => {
          // Guard: don't update progress if the file was canceled or removed
          const current = useUploadStore.getState().files.find(f => f.id === fileObj.id);
          if (!current || current.status === 'canceled') return;
          updateFile(fileObj.id, { progress });
        },
        fileObj.abortController?.signal
      );

      // Guard: verify file still exists and wasn't canceled before transitioning to 'processing'
      const afterUpload = useUploadStore.getState().files.find(f => f.id === fileObj.id);
      if (!afterUpload || afterUpload.status === 'canceled') return;

      updateFile(fileObj.id, { status: 'processing', progress: 100 });
    } catch (error: unknown) {
      // Guard: don't overwrite 'canceled' status if the abort caused the error
      const currentFile = useUploadStore.getState().files.find(f => f.id === fileObj.id);
      if (!currentFile || currentFile.status === 'canceled') return;

      const message = error instanceof Error ? error.message : 'Unknown upload error';
      updateFile(fileObj.id, { status: 'failed', errorMessage: message });
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // 1. Domain Models Creation — each file gets its own AbortController
    const newFiles: UploadableFile[] = selectedFiles.map((file) => {
      const abortController = new AbortController();
      return {
        id: crypto.randomUUID(),
        originalName: file.name,
        uploadName: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
        file,
        status: 'queued' as const,
        progress: 0,
        abortController,
      };
    });

    // 2. Update UI instantly
    addFiles(newFiles);

    // 3. Process Uploads asynchronously
    newFiles.forEach((fileObj) => processUpload(fileObj));
  };

  const handleRetryFile = (id: string) => {
    const fileObj = useUploadStore.getState().files.find(f => f.id === id);
    if (!fileObj || !['failed', 'rejected', 'canceled'].includes(fileObj.status)) return;

    const abortController = new AbortController();
    const retriedFile: UploadableFile = {
      ...fileObj,
      abortController,
      status: 'queued',
      progress: 0,
      errorMessage: undefined
    };
    updateFile(id, { ...retriedFile });
    processUpload(retriedFile);
  };

  const handleRetryAllFailed = () => {
    const failedFiles = useUploadStore.getState().files.filter(f => ['failed', 'rejected', 'canceled'].includes(f.status));
    failedFiles.forEach((f) => handleRetryFile(f.id));
  };

  return (
    <div className="app-wrapper">
      <UploadBackground />
      <div className="app-container">
        <h1 className="app-title">Upload Portal</h1>
        <UploadDropzone onFilesSelected={handleFilesSelected} />
        <div className="app-filelist-section">
          <FileList
            files={files}
            onCancelFile={cancelFile}
            onRetryFile={handleRetryFile}
            onRetryAll={handleRetryAllFailed}
          />
        </div>
        <br></br>
        <div className="app-summary-section"><SummaryCards summary={summary} /></div>
      </div>
    </div>
  );
}
