// src/hooks/useUploadPolling.ts
import { useEffect, useRef } from 'react';
import { useUploadStore } from '../state/useUploadStore';
import { fetchFilesAPI } from '../../infrastructure/api/uploadService';

const POLLING_INTERVAL_MS = 3000;

export const useUploadPolling = () => {
  const files = useUploadStore((state) => state.files);
  const updateFilesBatch = useUploadStore((state) => state.updateFilesBatch);
  
  // נשמור Reference כדי שלא נריץ כמה פולינגים במקביל
  const isPollingRef = useRef(false);

  useEffect(() => {
    // בדוק אם יש קבצים שדורשים תשאול השרת
    const processingFiles = files.filter(f => f.status === 'processing');
    
    // אם אין, או שאנחנו כבר רצים, אל תעשה כלום
    if (processingFiles.length === 0 || isPollingRef.current) return;

    isPollingRef.current = true;
    console.log('[POLLING] Started...');

    const intervalId = setInterval(async () => {
      try {
        // Read fresh state on every tick (avoids stale closure — Gap B fix)
        const currentFiles = useUploadStore.getState().files;
        const processingFiles = currentFiles.filter(f => f.status === 'processing');

        // Stop condition: no more files to poll for
        if (processingFiles.length === 0) {
          console.log('[POLLING] All files finished. Stopping.');
          clearInterval(intervalId);
          isPollingRef.current = false;
          return;
        }

        console.log('[POLLING] Fetching server status...');
        const response = await fetchFilesAPI();
        const serverFiles = response?.files ?? [];

        // Match local processing files against server responses
        const finishedUpdates: { id: string; status: 'accepted' | 'rejected' }[] = [];

        processingFiles.forEach((localFile) => {
          // Match by originalName (real server) or uploadName (mock server)
          const serverFile = serverFiles.find(
            sf => sf.filename === localFile.originalName || sf.filename === localFile.uploadName
          );
          
          if (serverFile && (serverFile.status === 'accepted' || serverFile.status === 'rejected')) {
            finishedUpdates.push({
              id: localFile.id,
              status: serverFile.status
            });
          }
        });

        // Batch update if any files finished processing
        if (finishedUpdates.length > 0) {
          console.log('[POLLING] Found updates:', finishedUpdates);
          updateFilesBatch(finishedUpdates);
        }

      } catch (error) {
        console.error('[POLLING] Error fetching status:', error);
      }
    }, POLLING_INTERVAL_MS);

    // Cleanup function: למקרה שהקומפוננטה תעשה Unmount לפני שכל הקבצים סיימו
    return () => {
      if (isPollingRef.current) {
        console.log('[POLLING] Cleanup triggered (Unmount).');
        clearInterval(intervalId);
        isPollingRef.current = false;
      }
    };
  }, [files, updateFilesBatch]); // ה-Effect ירוץ מחדש כשמערך הקבצים משתנה
};