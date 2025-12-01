import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { LeadModal } from '../LeadModal';
import { Lead } from '@/types';

const toastMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ userData: { email: 'tester@example.com' } }),
}));

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    formatDateTime: () => 'Jan 1',
  }),
}));

vi.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ add: vi.fn().mockResolvedValue(undefined) }),
  useCollectionQuery: () => ({ data: [] }),
}));

class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,ZWx5bWVudA==`;
    if (this.onload) {
      this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  }
}

describe('LeadModal file management', () => {
  const lead: Lead = {
    id: 'lead-1',
    partnerId: 'partner-1',
    clientName: 'Acme Corp',
    status: 'new',
    location: 'Sydney',
    notes: [],
    files: [],
    createdBy: 'tester@example.com',
    updatedBy: 'tester@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const originalFileReader = global.FileReader;

  beforeEach(() => {
    toastMock.mockReset();
    // @ts-expect-error overriding for tests
    global.FileReader = MockFileReader;
  });

  afterEach(() => {
    // @ts-expect-error restore after tests
    global.FileReader = originalFileReader;
  });

  it('uploads files via drag-and-drop after virus scanning', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<LeadModal lead={lead} isOpen onClose={() => undefined} onSave={onSave} />);

    const [dropzone] = screen.getAllByTestId('file-dropzone');
    const safeFile = new File(['content'], 'proposal.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, { dataTransfer: { files: [safeFile] } });

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];

    expect(payload.files[0].name).toBe('proposal.pdf');
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
  });

  it('blocks suspicious files and surfaces a toast', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<LeadModal lead={lead} isOpen onClose={() => undefined} onSave={onSave} />);

    const [dropzone] = screen.getAllByTestId('file-dropzone');
    const dangerousFile = new File(['bad'], 'virus.exe', { type: 'application/octet-stream' });

    fireEvent.drop(dropzone, { dataTransfer: { files: [dangerousFile] } });

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders a preview for supported formats', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const leadWithFile: Lead = {
      ...lead,
      files: [
        {
          id: 'file-1',
          name: 'site-plan.png',
          mimeType: 'image/png',
          size: 1024,
          dataUrl: 'data:image/png;base64,ZWx5bWVudA==',
          uploadedAt: new Date(),
        },
      ],
    };

    render(<LeadModal lead={leadWithFile} isOpen onClose={() => undefined} onSave={onSave} />);

    const previewButton = screen.getByLabelText('Preview site-plan.png');
    fireEvent.click(previewButton);

    expect(screen.getByTestId('file-preview')).toBeInTheDocument();
    expect(screen.getByAltText('Preview of site-plan.png')).toBeInTheDocument();
  });
});
