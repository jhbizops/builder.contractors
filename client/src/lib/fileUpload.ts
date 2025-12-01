import { LeadFile } from '@/types';
import { z } from 'zod';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const blockedExtensions = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.sh$/i, /\.js$/i];

const fileGuard = z.object({
  name: z.string().min(1),
  size: z.number().max(MAX_FILE_SIZE_BYTES),
  type: z.string().optional(),
});

export type VirusScanResult = { status: 'clean' | 'blocked'; reason?: string };

export async function scanFileForThreats(file: File): Promise<VirusScanResult> {
  const validation = fileGuard.safeParse({ name: file.name, size: file.size, type: file.type });

  if (!validation.success) {
    return {
      status: 'blocked',
      reason: validation.error.errors[0]?.message || 'File failed validation',
    };
  }

  const normalizedName = file.name.toLowerCase();

  if (blockedExtensions.some((pattern) => pattern.test(normalizedName))) {
    return {
      status: 'blocked',
      reason: 'Executable files are not allowed',
    };
  }

  if (/virus|malware|trojan/i.test(file.name)) {
    return {
      status: 'blocked',
      reason: 'Suspicious filename detected',
    };
  }

  if (
    !allowedMimeTypes.has(file.type) &&
    !allowedExtensions.some((extension) => normalizedName.endsWith(extension))
  ) {
    return {
      status: 'blocked',
      reason: 'Unsupported file type',
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 20));

  return { status: 'clean' };
}

export const readFileAsLeadFile = (file: File): Promise<LeadFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unsupported file format'));
        return;
      }

      resolve({
        id: `file_${crypto.randomUUID()}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result,
        uploadedAt: new Date(),
      });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const isPreviewableImage = (mimeType: string) => mimeType.startsWith('image/');
export const isPreviewablePdf = (mimeType: string) => mimeType === 'application/pdf';
