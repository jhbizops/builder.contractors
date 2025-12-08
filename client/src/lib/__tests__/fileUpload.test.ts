import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPreviewableImage,
  isPreviewablePdf,
  MAX_FILE_SIZE_BYTES,
  readFileAsLeadFile,
  scanFileForThreats,
} from '../fileUpload';

class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,ZWx5bWVudA==`;
    if (this.onload) {
      this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  }
}

describe('fileUpload helpers', () => {
  const originalFileReader = global.FileReader;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
  });

  it('blocks executable-like files during virus scan', async () => {
    const file = new File(['payload'], 'virus.exe', { type: 'application/octet-stream' });
    const result = await scanFileForThreats(file);

    expect(result.status).toBe('blocked');
    expect(result.reason).toContain('Executable');
  });

  it('blocks files that exceed the maximum size', async () => {
    const oversizedFile = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], 'large.pdf', {
      type: 'application/pdf',
    });

    const result = await scanFileForThreats(oversizedFile);

    expect(result.status).toBe('blocked');
  });

  it('reads a safe file into a lead file structure', async () => {
    const pdfFile = new File(['hello'], 'safe.pdf', { type: 'application/pdf' });

    const leadFile = await readFileAsLeadFile(pdfFile);

    expect(leadFile.name).toBe('safe.pdf');
    expect(leadFile.dataUrl).toContain('data:application/pdf');
    expect(leadFile.mimeType).toBe('application/pdf');
  });

  it('identifies previewable formats', () => {
    expect(isPreviewableImage('image/png')).toBe(true);
    expect(isPreviewablePdf('application/pdf')).toBe(true);
    expect(isPreviewablePdf('application/msword')).toBe(false);
  });
});
