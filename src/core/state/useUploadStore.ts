import { create } from 'zustand';
import type { UploadableFile, UploadSummary } from '../types';

interface UploadState {
  files: UploadableFile[];

  // Actions
  addFiles: (files: UploadableFile[]) => void;
  updateFile: (id: string, updates: Partial<UploadableFile>) => void;
  cancelFile: (id: string) => void;
  updateFilesBatch: (updates: { id: string; status: 'accepted' | 'rejected' }[]) => void;
  removeFile: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],

  // 1. Initialization
  addFiles: (newFiles: UploadableFile[]) => {
    set((state) => ({
      files: [...state.files, ...newFiles],
    }));
  },

  // 2. State Transitions
  updateFile: (id: string, updates: Partial<UploadableFile>) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      ),
    }));
  },

  // 3. Cancel an in-flight upload
  cancelFile: (id: string) => {
    set((state) => ({
      files: state.files.map((file) => {
        if (file.id === id && (file.status === 'uploading' || file.status === 'queued')) {
          // Abort the network request if it's in progress
          file.abortController?.abort();
          return { ...file, status: 'canceled' as const, progress: 0 };
        }
        return file;
      }),
    }));
  },

  updateFilesBatch: (updates) => set((state) => {
    // Creating a fast lookup map (O(1) Lookup)
    const updatesMap = new Map(updates.map(u => [u.id, u.status]));

    return {
      files: state.files.map((file) => {
        if (updatesMap.has(file.id)) {
          return { ...file, status: updatesMap.get(file.id)! };
        }
        return file;
      })
    };
  }),

  // 3. Cleanup
  removeFile: (id: string) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    }));
  },
}));

/**
 * Derived State Selector
 * We do not store the summary in the state itself to avoid out-of-sync bugs.
 * Instead, we compute it on the fly when components subscribe to it.
 */
export const selectUploadSummary = (state: UploadState): UploadSummary => {
  return state.files.reduce(
    (summary, file) => {
      summary.total++;
      if (file.status === 'queued' || file.status === 'uploading') summary.queuedOrUploading++;
      else if (file.status === 'processing') summary.processing++;
      else if (file.status === 'accepted') summary.accepted++;
      else if (file.status === 'rejected') summary.rejected++;
      else if (file.status === 'failed' || file.status === 'canceled') summary.failed++;
      return summary;
    },
    { total: 0, queuedOrUploading: 0, processing: 0, accepted: 0, rejected: 0, failed: 0 }
  );
};