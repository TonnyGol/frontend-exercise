import type { ServerFileResponse } from '../../core/types';

// In-memory Database to track files on the "server"
const serverFilesDB = new Map<string, ServerFileResponse>();

export const mockUploadFileAPI = async (
  file: File,
  uploadName: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let progress = 0;

    const interval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(interval);
        return reject(new Error('CANCELED'));
      }

      progress += 10;
      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        // Upload finished - processing status
        serverFilesDB.set(uploadName, { filename: uploadName, status: 'processing' });
        resolve();

        // Simulation of server processing time (5 to 30 seconds for development convenience)
        const processingTime = Math.floor(Math.random() * 30000) + 5000;

        setTimeout(() => {
          if (serverFilesDB.has(uploadName)) {
            // 80% success, 20% failure
            const finalStatus = Math.random() > 0.2 ? 'accepted' : 'rejected';
            serverFilesDB.set(uploadName, { filename: uploadName, status: finalStatus });
          }
        }, processingTime);
      }
    }, 500); // 500ms per step = ~5 seconds total upload time (testable for cancel)
  });
};

export const mockFetchFilesAPI = async (): Promise<{ files: ServerFileResponse[] }> => {
  await new Promise(res => setTimeout(res, 200));
  return { files: Array.from(serverFilesDB.values()) };
};