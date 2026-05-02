import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUploadStore, selectUploadSummary } from './useUploadStore';
import type { UploadableFile } from '../types';

// ── Helpers ──────────────────────────────────────────────────

const makeFile = (overrides: Partial<UploadableFile> = {}): UploadableFile => ({
  id: crypto.randomUUID(),
  originalName: 'test.txt',
  uploadName: `${Date.now()}_test.txt`,
  file: new File(['hello'], 'test.txt'),
  status: 'queued',
  progress: 0,
  ...overrides,
});

const resetStore = () => useUploadStore.setState({ files: [] });

// ── Tests ────────────────────────────────────────────────────

describe('useUploadStore', () => {
  beforeEach(resetStore);

  // ─── addFiles ───────────────────────────────────
  describe('addFiles', () => {
    it('adds files to an empty store', () => {
      const f = makeFile();
      useUploadStore.getState().addFiles([f]);
      expect(useUploadStore.getState().files).toHaveLength(1);
      expect(useUploadStore.getState().files[0].id).toBe(f.id);
    });

    it('appends files without replacing existing ones', () => {
      useUploadStore.getState().addFiles([makeFile()]);
      useUploadStore.getState().addFiles([makeFile(), makeFile()]);
      expect(useUploadStore.getState().files).toHaveLength(3);
    });
  });

  // ─── updateFile ─────────────────────────────────
  describe('updateFile (state transitions)', () => {
    it('queued → uploading', () => {
      const f = makeFile({ status: 'queued' });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().updateFile(f.id, { status: 'uploading', progress: 10 });

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('uploading');
      expect(updated.progress).toBe(10);
    });

    it('uploading → processing', () => {
      const f = makeFile({ status: 'uploading', progress: 50 });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().updateFile(f.id, { status: 'processing', progress: 100 });

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('processing');
      expect(updated.progress).toBe(100);
    });

    it('uploading → failed', () => {
      const f = makeFile({ status: 'uploading' });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().updateFile(f.id, { status: 'failed', errorMessage: 'Network error' });

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('failed');
      expect(updated.errorMessage).toBe('Network error');
    });

    it('does not mutate other files', () => {
      const f1 = makeFile({ originalName: 'a.txt' });
      const f2 = makeFile({ originalName: 'b.txt' });
      useUploadStore.getState().addFiles([f1, f2]);
      useUploadStore.getState().updateFile(f1.id, { status: 'accepted' });

      const files = useUploadStore.getState().files;
      expect(files[0].status).toBe('accepted');
      expect(files[1].status).toBe('queued'); // unchanged
    });
  });

  // ─── cancelFile ─────────────────────────────────
  describe('cancelFile', () => {
    it('cancels a queued file', () => {
      const f = makeFile({ status: 'queued' });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().cancelFile(f.id);

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('canceled');
      expect(updated.progress).toBe(0);
    });

    it('cancels an uploading file and resets progress', () => {
      const f = makeFile({ status: 'uploading', progress: 42 });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().cancelFile(f.id);

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('canceled');
      expect(updated.progress).toBe(0);
    });

    it('calls abortController.abort() for uploading files', () => {
      const abortController = new AbortController();
      const abortSpy = vi.spyOn(abortController, 'abort');
      const f = makeFile({ status: 'uploading', abortController });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().cancelFile(f.id);

      expect(abortSpy).toHaveBeenCalled();
    });

    it('does NOT cancel an already-accepted file', () => {
      const f = makeFile({ status: 'accepted', progress: 100 });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().cancelFile(f.id);

      const updated = useUploadStore.getState().files[0];
      expect(updated.status).toBe('accepted'); // unchanged
      expect(updated.progress).toBe(100);
    });

    it('does NOT cancel an already-failed file', () => {
      const f = makeFile({ status: 'failed' });
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().cancelFile(f.id);

      expect(useUploadStore.getState().files[0].status).toBe('failed');
    });
  });

  // ─── updateFilesBatch ───────────────────────────
  describe('updateFilesBatch', () => {
    it('updates multiple files in one call', () => {
      const f1 = makeFile({ status: 'processing' });
      const f2 = makeFile({ status: 'processing' });
      useUploadStore.getState().addFiles([f1, f2]);

      useUploadStore.getState().updateFilesBatch([
        { id: f1.id, status: 'accepted' },
        { id: f2.id, status: 'rejected' },
      ]);

      const files = useUploadStore.getState().files;
      expect(files[0].status).toBe('accepted');
      expect(files[1].status).toBe('rejected');
    });

    it('leaves non-matched files untouched', () => {
      const f1 = makeFile({ status: 'processing' });
      const f2 = makeFile({ status: 'uploading' });
      useUploadStore.getState().addFiles([f1, f2]);

      useUploadStore.getState().updateFilesBatch([
        { id: f1.id, status: 'accepted' },
      ]);

      expect(useUploadStore.getState().files[1].status).toBe('uploading');
    });
  });

  // ─── removeFile ─────────────────────────────────
  describe('removeFile', () => {
    it('removes a file by id', () => {
      const f = makeFile();
      useUploadStore.getState().addFiles([f]);
      useUploadStore.getState().removeFile(f.id);

      expect(useUploadStore.getState().files).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      useUploadStore.getState().addFiles([makeFile()]);
      useUploadStore.getState().removeFile('non-existent');

      expect(useUploadStore.getState().files).toHaveLength(1);
    });
  });
});

// ─── Summary Selector ─────────────────────────────────────────

describe('selectUploadSummary', () => {
  beforeEach(resetStore);

  it('returns all zeros for an empty store', () => {
    const summary = selectUploadSummary(useUploadStore.getState());
    expect(summary).toEqual({
      total: 0,
      queuedOrUploading: 0,
      processing: 0,
      accepted: 0,
      rejected: 0,
      failed: 0,
    });
  });

  it('counts queued and uploading together', () => {
    useUploadStore.getState().addFiles([
      makeFile({ status: 'queued' }),
      makeFile({ status: 'uploading' }),
    ]);

    const summary = selectUploadSummary(useUploadStore.getState());
    expect(summary.total).toBe(2);
    expect(summary.queuedOrUploading).toBe(2);
  });

  it('counts each terminal status correctly', () => {
    useUploadStore.getState().addFiles([
      makeFile({ status: 'accepted' }),
      makeFile({ status: 'accepted' }),
      makeFile({ status: 'rejected' }),
      makeFile({ status: 'failed' }),
      makeFile({ status: 'canceled' }),
      makeFile({ status: 'processing' }),
    ]);

    const summary = selectUploadSummary(useUploadStore.getState());
    expect(summary.total).toBe(6);
    expect(summary.accepted).toBe(2);
    expect(summary.rejected).toBe(1);
    expect(summary.failed).toBe(2);       // failed + canceled both map to failed counter
    expect(summary.processing).toBe(1);
    expect(summary.queuedOrUploading).toBe(0);
  });

  it('reflects changes after a cancel', () => {
    const f = makeFile({ status: 'uploading' });
    useUploadStore.getState().addFiles([f]);

    let summary = selectUploadSummary(useUploadStore.getState());
    expect(summary.queuedOrUploading).toBe(1);
    expect(summary.failed).toBe(0);

    useUploadStore.getState().cancelFile(f.id);
    summary = selectUploadSummary(useUploadStore.getState());
    expect(summary.queuedOrUploading).toBe(0);
    expect(summary.failed).toBe(1);
  });

  it('reflects changes after a batch update', () => {
    const f1 = makeFile({ status: 'processing' });
    const f2 = makeFile({ status: 'processing' });
    useUploadStore.getState().addFiles([f1, f2]);

    useUploadStore.getState().updateFilesBatch([
      { id: f1.id, status: 'accepted' },
      { id: f2.id, status: 'rejected' },
    ]);

    const summary = selectUploadSummary(useUploadStore.getState());
    expect(summary.processing).toBe(0);
    expect(summary.accepted).toBe(1);
    expect(summary.rejected).toBe(1);
  });
});
