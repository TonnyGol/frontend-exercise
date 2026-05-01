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
      // תמיכה בביטול העלאה (AbortController) שנוסיף בהמשך
      if (signal?.aborted) {
        clearInterval(interval);
        return reject(new Error('CANCELED'));
      }

      progress += 10;
      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        
        // העלאה הסתיימה - סטטוס עיבוד
        serverFilesDB.set(uploadName, { filename: uploadName, status: 'processing' });
        resolve();

        // סימולציה של זמן עיבוד בשרת (5 עד 30 שניות לטובת נוחות הפיתוח)
        const processingTime = Math.floor(Math.random() * 30000) + 5000;
        
        setTimeout(() => {
          if (serverFilesDB.has(uploadName)) {
            // 80% הצלחה, 20% כישלון
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