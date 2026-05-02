import { describe, it, expect } from 'vitest';
import { validateFile } from './validation';

// ── Helper to create a mock File object ──────────────────────

const makeFile = (name: string, sizeBytes: number): File => {
  // Create content of the specified size
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type: 'application/octet-stream' });
};

// ── Tests ────────────────────────────────────────────────────

describe('validateFile', () => {
  describe('valid files', () => {
    it('accepts a normal .txt file', () => {
      expect(validateFile(makeFile('readme.txt', 100))).toEqual({ valid: true });
    });

    it('accepts a .pdf under the size limit', () => {
      expect(validateFile(makeFile('document.pdf', 5 * 1024 * 1024))).toEqual({ valid: true });
    });

    it('accepts a file exactly at 10MB', () => {
      const result = validateFile(makeFile('exactly10.zip', 10 * 1024 * 1024));
      expect(result.valid).toBe(true);
    });

    it('accepts image file types', () => {
      expect(validateFile(makeFile('photo.png', 500))).toEqual({ valid: true });
      expect(validateFile(makeFile('photo.jpg', 500))).toEqual({ valid: true });
    });
  });

  describe('blocked extensions', () => {
    const blockedExts = ['.exe', '.dll', '.bat', '.cmd', '.msi', '.scr'];

    blockedExts.forEach((ext) => {
      it(`rejects ${ext} files`, () => {
        const result = validateFile(makeFile(`malware${ext}`, 100));
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Blocked file type');
        expect(result.error).toContain(ext);
      });
    });

    it('rejects blocked extensions case-insensitively', () => {
      // Our validator lowercases the extension, so .EXE → .exe → blocked
      const result = validateFile(makeFile('virus.EXE', 100));
      expect(result.valid).toBe(false);
    });
  });

  describe('file size limits', () => {
    it('rejects a file larger than 10MB', () => {
      const result = validateFile(makeFile('huge.zip', 11 * 1024 * 1024));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('rejects a file just over the limit (10MB + 1 byte)', () => {
      const result = validateFile(makeFile('barely-over.zip', 10 * 1024 * 1024 + 1));
      expect(result.valid).toBe(false);
    });
  });

  describe('empty files', () => {
    it('rejects a 0-byte file', () => {
      const result = validateFile(makeFile('empty.txt', 0));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });
});
