import { useMemo } from 'react';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type CollectionName =
  | 'users'
  | 'leads'
  | 'lead_comments'
  | 'activity_logs'
  | 'services';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

const collectionToEndpoint: Record<CollectionName, string> = {
  users: '/api/users',
  leads: '/api/leads',
  lead_comments: '/api/lead-comments',
  activity_logs: '/api/activity-logs',
  services: '/api/services',
};

function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => {
      if (typeof val === 'string' && key.endsWith('At')) {
        return [key, new Date(val)];
      }

      return [key, reviveDates(val)];
    });

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function useCollectionData<T>(collection: CollectionName, params?: QueryParams) {
  const endpoint = collectionToEndpoint[collection];
  const paramEntries = useMemo(() => {
    const entries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null);
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries;
  }, [params]);

  const queryKey = useMemo(() => [endpoint, paramEntries], [endpoint, paramEntries]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      for (const [key, value] of paramEntries) {
        searchParams.set(key, String(value));
      }
      const queryString = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
      const res = await fetch(`${endpoint}${queryString}`, { credentials: 'include' });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(text);
      }
      const data = (await res.json()) as unknown;
      return reviveDates(data) as T[];
    },
  });

  return {
    data: (query.data ?? []) as T[],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    endpoint,
    queryKey,
  };
}

function invalidateCollection(queryClient: ReturnType<typeof useQueryClient>, endpoint: string) {
  return queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === endpoint,
  });
}

export const useFirestore = <T>(collection: CollectionName, params?: QueryParams) => {
  const queryClient = useQueryClient();
  const { data, loading, error, endpoint, queryKey } = useCollectionData<T>(collection, params);

  const add = async (item: Omit<T, 'id'> & Partial<Pick<T, 'id'>>) => {
    const res = await apiRequest('POST', endpoint, item);
    const created = reviveDates((await res.json()) as unknown) as T;
    queryClient.setQueryData<T[]>(queryKey, (existing) => ([...(existing ?? []), created]));
    await invalidateCollection(queryClient, endpoint);
    return (created as { id?: string }).id;
  };

  const update = async (id: string, updates: Partial<T>) => {
    const res = await apiRequest('PATCH', `${endpoint}/${id}`, updates);
    const updated = reviveDates((await res.json()) as unknown) as T;
    queryClient.setQueryData<T[]>(queryKey, (existing) =>
      (existing ?? []).map((record) => ((record as { id?: string }).id === id ? updated : record)),
    );
    await invalidateCollection(queryClient, endpoint);
    return updated;
  };

  const remove = async (id: string) => {
    await apiRequest('DELETE', `${endpoint}/${id}`);
    queryClient.setQueryData<T[]>(queryKey, (existing) =>
      (existing ?? []).filter((record) => (record as { id?: string }).id !== id),
    );
    await invalidateCollection(queryClient, endpoint);
  };

  const getById = async (id: string) => {
    const res = await apiRequest('GET', `${endpoint}/${id}`);
    return reviveDates((await res.json()) as unknown) as T;
  };

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    getById,
  };
};

export const useFirestoreQuery = <T>(collection: CollectionName, params?: QueryParams) => {
  const { data, loading, error } = useCollectionData<T>(collection, params);
  return { data, loading, error };
};
