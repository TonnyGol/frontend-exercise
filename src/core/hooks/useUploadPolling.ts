// src/hooks/useUploadPolling.ts
import { useEffect, useRef } from 'react';
import { useUploadStore } from '../state/useUploadStore';
import { mockFetchFilesAPI } from '../../infrastructure/api/mockService';

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
        console.log('[POLLING] Fetching server status...');
        const response = await mockFetchFilesAPI();
        const serverFiles = response.files;

        // אנחנו מחפשים קבצים שקיימים אצלנו בסטטוס processing
        // ואצל השרת הם כבר בסטטוס accepted או rejected
        const finishedUpdates: { id: string; status: 'accepted' | 'rejected' }[] = [];

        processingFiles.forEach((localFile) => {
          const serverFile = serverFiles.find(sf => sf.filename === localFile.uploadName);
          
          if (serverFile && (serverFile.status === 'accepted' || serverFile.status === 'rejected')) {
            finishedUpdates.push({
              id: localFile.id,
              status: serverFile.status
            });
          }
        });

        // אם מצאנו קבצים שסיימו לעבד, נעדכן את ה-Store במכה אחת
        if (finishedUpdates.length > 0) {
          console.log('[POLLING] Found updates:', finishedUpdates);
          updateFilesBatch(finishedUpdates);
        }

        // תנאי העצירה (Stop Condition): האם עדיין יש קבצים שמעובדים?
        // אנחנו שולפים מחדש את הסטייט העדכני של ה-Store כדי לבדוק
        const currentFiles = useUploadStore.getState().files;
        const stillProcessing = currentFiles.some(f => f.status === 'processing');
        
        if (!stillProcessing) {
          console.log('[POLLING] All files finished. Stopping.');
          clearInterval(intervalId);
          isPollingRef.current = false;
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