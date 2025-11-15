import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLeads } from '@/hooks/api/useLeads';
import type { Lead } from '@/types';

const baseLead: Lead = {
  id: 'lead-1',
  partnerId: 'partner-1',
  clientName: 'Acme Co',
  status: 'new',
  location: 'Sydney',
  country: 'AU',
  region: 'NSW',
  notes: [],
  files: [],
  createdBy: 'sales@example.com',
  updatedBy: undefined,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { wrapper, client };
}

describe('useLeads', () => {
  type StoredLead = Omit<Lead, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };
  let serverLeads: StoredLead[];
  const fetchMock = vi.fn();

  beforeEach(() => {
    serverLeads = [
      {
        ...baseLead,
        createdAt: baseLead.createdAt.toISOString(),
        updatedAt: baseLead.updatedAt.toISOString(),
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.startsWith('/api/leads')) {
        return new Response(JSON.stringify(serverLeads), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST' && url === '/api/leads') {
        const body = JSON.parse(init?.body as string);
        const createdAt = new Date().toISOString();
        const record = {
          ...body,
          id: 'server-created',
          createdAt,
          updatedAt: createdAt,
        };
        serverLeads.push(record);
        return new Response(JSON.stringify(record), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'PATCH' && url.startsWith('/api/leads/')) {
        const body = JSON.parse(init?.body as string);
        const id = url.split('/').pop()!;
        serverLeads = serverLeads.map((lead) =>
          lead.id === id
            ? { ...lead, ...body, updatedAt: new Date().toISOString() }
            : lead,
        );
        const updated = serverLeads.find((lead) => lead.id === id)!;
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'DELETE' && url.startsWith('/api/leads/')) {
        const id = url.split('/').pop()!;
        serverLeads = serverLeads.filter((lead) => lead.id !== id);
        return new Response(null, { status: 204 });
      }

      return new Response(null, { status: 500 });
    });

    vi.spyOn(global, 'fetch').mockImplementation(fetchMock as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches leads from the API', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLeads(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].clientName).toBe('Acme Co');
    expect(result.current.data[0].createdAt).toBeInstanceOf(Date);
  });

  it('creates, updates, and deletes leads via mutations', async () => {
    const { wrapper, client } = createWrapper();
    const { result } = renderHook(() => useLeads(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const { id: _ignored, ...createInput } = baseLead;
    await act(async () => {
      await result.current.createLead({
        ...createInput,
        clientName: 'New Lead',
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
        updatedAt: new Date('2024-02-01T00:00:00.000Z'),
      });
    });

    await waitFor(() => expect(serverLeads).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/leads',
      expect.objectContaining({ method: 'POST' }),
    );

    await act(async () => {
      await result.current.updateLead({
        id: 'lead-1',
        updates: { status: 'completed' },
      });
    });

    await waitFor(() =>
      expect(serverLeads.find((lead) => lead.id === 'lead-1')?.status).toBe('completed'),
    );

    await act(async () => {
      await result.current.deleteLead('lead-1');
    });

    await waitFor(() => expect(serverLeads.find((lead) => lead.id === 'lead-1')).toBeUndefined());

    client.clear();
  });
});
