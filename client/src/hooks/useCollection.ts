import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { CollectionStore, getCollectionStore } from '@/lib/localCollectionStore';

type CollectionItem = { id: string };

type CollectionError = string | null;

export function useCollection<T extends CollectionItem>(collection: string) {
  const store = useMemo<CollectionStore<T>>(() => getCollectionStore<T>(collection), [collection]);
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [loading, setLoading] = useState(!store.isHydrated());
  const [error, setError] = useState<CollectionError>(null);

  useEffect(() => {
    if (!store.isHydrated()) {
      try {
        store.hydrate();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      }
    }
    setLoading(false);
  }, [store]);

  const add = useCallback(
    async (item: Omit<T, 'id'> & Partial<Pick<T, 'id'>>) => {
      try {
        const result = await store.add(item);
        setError(null);
        return result.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add item';
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      try {
        await store.update(id, updates);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update item';
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await store.remove(id);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete item';
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const getById = useCallback(
    async (id: string) => {
      const item = store.getById(id);
      return item ?? null;
    },
    [store],
  );

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    getById,
  };
}

export function useCollectionQuery<T extends CollectionItem>(
  collection: string,
  predicate: (item: T) => boolean = () => true,
) {
  const result = useCollection<T>(collection);
  const filtered = useMemo(() => result.data.filter(predicate), [result.data, predicate]);

  return {
    ...result,
    data: filtered,
  };
}
