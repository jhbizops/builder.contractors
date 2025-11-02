import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCollectionStore, resetCollections } from '@/lib/localCollectionStore';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

type TestItem = {
  id: string;
  name: string;
  createdAt: Date;
};

describe('CollectionStore', () => {
  const storageKey = 'bc_collection:test-items:v1';

  beforeEach(() => {
    localStorage.clear();
    resetCollections();
    vi.clearAllMocks();
  });

  it('adds items and persists them to localStorage', async () => {
    const store = getCollectionStore<TestItem>('test-items');

    const created = await store.add({
      name: 'First item',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    });

    expect(created.id).toMatch(/local_/);
    expect(store.getById(created.id)?.name).toBe('First item');

    const raw = localStorage.getItem(storageKey);
    expect(raw).toBeTruthy();
    expect(raw && raw.includes('First item')).toBe(true);
  });

  it('updates items in place', async () => {
    const store = getCollectionStore<TestItem>('test-items');
    const created = await store.add({
      name: 'Original',
      createdAt: new Date('2024-02-02T00:00:00Z'),
    });

    await store.update(created.id, { name: 'Updated' });

    const updated = store.getById(created.id);
    expect(updated?.name).toBe('Updated');
  });

  it('removes items and clears localStorage state', async () => {
    const store = getCollectionStore<TestItem>('test-items');
    const created = await store.add({
      name: 'Disposable',
      createdAt: new Date('2024-03-03T00:00:00Z'),
    });

    await store.remove(created.id);

    expect(store.getById(created.id)).toBeUndefined();
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as TestItem[];
    expect(parsed).toHaveLength(0);
  });

  it('hydrates date strings back into Date instances', async () => {
    const snapshot: TestItem[] = [
      {
        id: 'rehydrate',
        name: 'Hydrated',
        createdAt: new Date('2024-04-04T00:00:00Z'),
      },
    ];

    localStorage.setItem(storageKey, JSON.stringify(snapshot));

    const store = getCollectionStore<TestItem>('test-items');
    store.hydrate();

    const hydrated = store.getById('rehydrate');
    expect(hydrated).toBeDefined();
    expect(hydrated?.createdAt instanceof Date).toBe(true);
    expect(hydrated?.createdAt.toISOString()).toBe('2024-04-04T00:00:00.000Z');
  });

  it('syncs changes written outside the store instance', async () => {
    const store = getCollectionStore<TestItem>('test-items');
    await store.add({
      name: 'First',
      createdAt: new Date('2024-05-05T00:00:00Z'),
    });

    const external: TestItem[] = [
      {
        id: 'external',
        name: 'External update',
        createdAt: new Date('2024-06-06T00:00:00Z'),
      },
    ];

    localStorage.setItem(storageKey, JSON.stringify(external));
    store.syncFromStorage();

    const items = store.getSnapshot();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('external');
  });
});
