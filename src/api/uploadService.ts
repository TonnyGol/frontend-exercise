import axios from 'axios';

export const uploadFileAPI = async (
  file: File,
  uploadName: string, // ה-Interface דורש את זה, אבל אנחנו לא מעבירים את זה ל-FormData כרגע
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  
  // חובה: להעביר את הקובץ נטו. לא מוסיפים פרמטר שלישי של שינוי שם.
  formData.append('file', file);

  try {
    // הפנייה היא יחסית. ה-Proxy של Vite יתפוס אותה ויעביר ל-127.0.0.1:3000
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