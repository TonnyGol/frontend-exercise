// src/types/index.ts

/**
 * 1. Server Contracts (Based on the Swagger/PDF description)
 */

// The status returned by the GET /files polling endpoint
export type ServerFileStatus = 'accepted' | 'rejected' | 'processing';

// Response interface for GET /files
export interface ServerFileResponse {
  filename: string;
  status: ServerFileStatus;
}

export interface ServerFilesListResponse {
  files: ServerFileResponse[];
}

/**
 * 2. Client-Side State Models
 */

// Extended status to cover local UI states (uploading, failed locally, canceled)
export type ClientFileStatus = 
  | 'queued' 
  | 'uploading' 
  | 'processing' // Server is verifying
  | 'accepted'   // Server accepted
  | 'rejected'   // Server rejected (e.g., malware.exe)
  | 'failed'     // Network error, 500, or timeout
  | 'canceled';  // User aborted the upload

// The core model we will store in our Zustand Store
export interface UploadableFile {
  id: string;          // A local unique identifier (UUID)
  originalName: string;// For UI display (e.g., "my-doc.pdf")
  uploadName: string;  // The name sent to the server (e.g., "169000000_my-doc.pdf") to prevent overwrites
  file: File;          // The actual File object (needed for retry)
  status: ClientFileStatus;
  progress: number;    // 0 to 100
  errorMessage?: string; // Optional error detail for 'failed' or 'rejected'
  abortController?: AbortController; // Allows us to cancel an in-flight upload
}

// Derived Summary for the UI
export interface UploadSummary {
  total: number;
  queuedOrUploading: number;
  processing: number;
  accepted: number;
  rejected: number;
  failed: number;
}