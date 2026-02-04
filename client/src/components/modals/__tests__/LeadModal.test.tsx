import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { LeadModal } from '../LeadModal';
import { Lead } from '@/types';

const toastMock = vi.fn();
const mutateAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock('@/api/leads', () => ({
  fetchLeadComments: vi.fn().mockResolvedValue([]),
  fetchLeadActivity: vi.fn().mockResolvedValue([]),
  addLeadComment: vi.fn().mockResolvedValue({
    id: 'comment-1',
    leadId: 'lead-1',
    body: 'New comment',
    author: 'tester@example.com',
    timestamp: new Date(),
  }),
  addLeadActivity: vi.fn().mockResolvedValue({
    id: 'log-1',
    leadId: 'lead-1',
    jobId: null,
    action: 'test',
    performedBy: 'tester@example.com',
    details: {},
    timestamp: new Date(),
  }),
  leadsQueryKey: ['leads'] as const,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ data: [] }),
    useMutation: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
    useQueryClient: () => ({
      cancelQueries: vi.fn(),
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ userData: { email: 'tester@example.com' } }),
}));

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    formatDateTime: () => 'Jan 1',
  }),
}));

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
    mutateAsyncMock.mockReset();
    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
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

  it('syncs the status value when the lead changes', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<LeadModal lead={lead} isOpen onClose={() => undefined} onSave={onSave} />);

    const statusTrigger = screen.getByRole('combobox');
    expect(statusTrigger).toHaveTextContent('New');

    rerender(
      <LeadModal
        lead={{ ...lead, status: 'completed' }}
        isOpen
        onClose={() => undefined}
        onSave={onSave}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Completed');
  });
});
