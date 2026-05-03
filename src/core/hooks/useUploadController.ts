import { useUploadStore } from '../state/useUploadStore';
import { uploadFileAPI } from '../../infrastructure/api/uploadService';
import { validateFile } from '../validation';
import type { UploadableFile } from '../types';

export const useUploadController = () => {
  const addFiles = useUploadStore((state) => state.addFiles);
  const updateFile = useUploadStore((state) => state.updateFile);
  const cancelFile = useUploadStore((state) => state.cancelFile);

  const processFileUpload = async (fileObj: UploadableFile) => {
    // Client-side validation — fail fast before uploading
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

  const getFormattedTimestamp = () => {
    const now = new Date();
    
    const year = now.getFullYear();
    
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Return formatted timestamp: 2024-10-27_14-30-05
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  

  const onFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // 1. Domain Models Creation — each file gets its own AbortController
    const newFiles: UploadableFile[] = selectedFiles.map((file) => {
      const abortController = new AbortController();
      return {
        id: crypto.randomUUID(),
        originalName: file.name,
        uploadName: `${getFormattedTimestamp()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
        file,
        status: 'queued' as const,
        progress: 0,
        abortController,
      };
    });

    // 2. Update UI instantly
    addFiles(newFiles);

    // 3. Process Uploads asynchronously
    newFiles.forEach((fileObj) => processFileUpload(fileObj));
  };

  const retryFileUpload = (id: string) => {
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
    processFileUpload(retriedFile);
  };

  const retryAllFailedUploads = () => {
    const failedFiles = useUploadStore.getState().files.filter(f => ['failed', 'rejected', 'canceled'].includes(f.status));
    failedFiles.forEach((f) => retryFileUpload(f.id));
  };

  return {
    onFilesSelected,
    retryFileUpload,
    retryAllFailedUploads,
    cancelFile,
  };
};
