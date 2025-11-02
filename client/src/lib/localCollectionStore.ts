import { toast } from '@/hooks/use-toast';

type Listener = () => void;

type CollectionItem = { id: string };

const STORAGE_PREFIX = 'bc_collection';
const STORAGE_VERSION = 'v1';
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const stores = new Map<string, CollectionStore<any>>();
const storeByKey = new Map<string, CollectionStore<any>>();
let storageListenerRegistered = false;
let storageListener: ((event: StorageEvent) => void) | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function ensureStorageListener() {
  if (!isBrowser() || storageListenerRegistered) {
    return;
  }

  storageListener = (event) => {
    if (!event.key) {
      return;
    }

    const store = storeByKey.get(event.key);
    if (store) {
      store.syncFromStorage();
    }
  };

  window.addEventListener('storage', storageListener);

  storageListenerRegistered = true;
}

function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, itemValue]) => {
      if (typeof itemValue === 'string' && ISO_DATE_REGEX.test(itemValue)) {
        return [key, new Date(itemValue)];
      }

      return [key, reviveDates(itemValue)];
    });

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function serialise<T>(value: T): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to serialise collection', error);
    return null;
  }
}

function parseStoredValue<T>(raw: string | null, storageKey: string): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return reviveDates(parsed);
  } catch (error) {
    console.warn('Failed to parse stored collection; resetting store', error);
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (storageError) {
        console.warn('Failed to clear invalid store', storageError);
      }
    }
    return [];
  }
}

export class CollectionStore<T extends CollectionItem> {
  private data: T[] = [];
  private listeners: Set<Listener> = new Set();
  private hydrated = false;
  private readonly storageKey: string;

  constructor(private readonly collection: string) {
    this.storageKey = `${STORAGE_PREFIX}:${collection}:${STORAGE_VERSION}`;
    ensureStorageListener();
    storeByKey.set(this.storageKey, this);
  }

  getSnapshot = (): T[] => {
    if (!this.hydrated) {
      this.hydrate();
    }
    return this.data;
  };

  isHydrated(): boolean {
    return this.hydrated;
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  hydrate(): void {
    if (!isBrowser()) {
      this.hydrated = true;
      this.data = [];
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      this.data = parseStoredValue<T>(raw, this.storageKey);
    } catch (error) {
      console.warn('Failed to hydrate collection store', error);
      this.data = [];
    } finally {
      this.hydrated = true;
    }
  }

  syncFromStorage(): void {
    if (!isBrowser()) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      const parsed = parseStoredValue<T>(raw, this.storageKey);
      this.data = parsed;
      this.hydrated = true;
      this.notify();
    } catch (error) {
      console.warn('Failed to synchronise collection store', error);
    }
  }

  async add(item: Omit<T, 'id'> & Partial<Pick<T, 'id'>>): Promise<T> {
    const id = item.id ?? `local_${crypto.randomUUID()}`;
    const newItem = { ...item, id } as T;
    this.setData([...this.data, newItem]);
    toast({ title: 'Success', description: 'Item added successfully' });
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found in ${this.collection}`);
    }

    const updatedItem = { ...this.data[index], ...updates } as T;
    const newData = [...this.data];
    newData[index] = updatedItem;
    this.setData(newData);
    toast({ title: 'Success', description: 'Item updated successfully' });
    return updatedItem;
  }

  async remove(id: string): Promise<void> {
    const exists = this.data.some((item) => item.id === id);
    if (!exists) {
      throw new Error(`Item with id ${id} not found in ${this.collection}`);
    }

    this.setData(this.data.filter((item) => item.id !== id));
    toast({ title: 'Success', description: 'Item deleted successfully' });
  }

  async clear(): Promise<void> {
    this.setData([]);
  }

  getById(id: string): T | undefined {
    return this.data.find((item) => item.id === id);
  }

  private persist() {
    if (!isBrowser()) {
      return;
    }

    const serialised = serialise(this.data);
    if (serialised === null) {
      return;
    }

    window.localStorage.setItem(this.storageKey, serialised);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private setData(newData: T[]) {
    this.data = newData;
    this.persist();
    this.notify();
  }
}

export function getCollectionStore<T extends CollectionItem>(collection: string): CollectionStore<T> {
  const existing = stores.get(collection);
  if (existing) {
    return existing;
  }

  const store = new CollectionStore<T>(collection);
  stores.set(collection, store);
  return store;
}

export function resetCollections() {
  stores.clear();
  storeByKey.clear();
  if (storageListener && isBrowser()) {
    window.removeEventListener('storage', storageListener);
  }
  storageListener = null;
  storageListenerRegistered = false;
}
