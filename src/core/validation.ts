/**
 * Client-side file validation.
 * Mirrors the server's rejection rules so we can fail fast
 * before wasting bandwidth on an upload that will be rejected.
 */

const BLOCKED_EXTENSIONS = ['.exe', '.dll', '.bat', '.cmd', '.msi', '.scr'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): ValidationResult => {
  // Check file extension
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Blocked file type: ${ext}` };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File too large (${sizeMB}MB). Max is 10MB.` };
  }

  // Check for empty files
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};
