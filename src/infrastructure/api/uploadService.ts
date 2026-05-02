import axios from 'axios';
import type { ServerFileResponse } from '../../core/types';

export const uploadFileAPI = async (
  file: File,
  uploadName: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file, uploadName);

  try {
    await axios.post('/upload', formData, {
      signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  } catch (error) {
    if (axios.isCancel(error)) throw new Error('CANCELED');
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400) throw new Error('Invalid file type (.exe, .dll) or missing file');
      if (status === 413) throw new Error('File exceeds 10MB limit');
      if (status === 500) throw new Error('Internal Server Error');
    }
    throw new Error('Network error during upload');
  }
};

/**
 * GET /files — polls the server for file processing status.
 * Used by useUploadPolling to check if files moved to accepted/rejected.
 */
export const fetchFilesAPI = async (): Promise<{ files: ServerFileResponse[] }> => {
  try {
    const response = await axios.get<{ files: ServerFileResponse[] }>('/files');
    return { files: response.data?.files ?? [] };
  } catch (error) {
    console.error('[API] Error fetching files:', error);
    return { files: [] };
  }
};