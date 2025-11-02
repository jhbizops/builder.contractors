import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection, useCollectionQuery } from '@/hooks/useCollection';
import { resetCollections } from '@/lib/localCollectionStore';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
};

describe('useCollection', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCollections();
    vi.clearAllMocks();
  });

  it('provides collection operations backed by localStorage', async () => {
    const { result } = renderHook(() => useCollection<Todo>('todos'));

    await act(async () => {
      await result.current.add({
        title: 'Write docs',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].title).toBe('Write docs');

    const id = result.current.data[0].id;

    await act(async () => {
      await result.current.update(id, { completed: true });
    });

    expect(result.current.data[0].completed).toBe(true);

    await act(async () => {
      await result.current.remove(id);
    });

    expect(result.current.data).toHaveLength(0);
  });

  it('filters data using useCollectionQuery', async () => {
    const { result: base } = renderHook(() => useCollection<Todo>('todos'));

    await act(async () => {
      await Promise.all([
        base.current.add({
          title: 'Incomplete',
          completed: false,
          createdAt: new Date('2024-02-01T00:00:00Z'),
        }),
        base.current.add({
          title: 'Complete',
          completed: true,
          createdAt: new Date('2024-02-02T00:00:00Z'),
        }),
      ]);
    });

    const { result: filtered } = renderHook(() =>
      useCollectionQuery<Todo>('todos', (todo) => todo.completed),
    );

    expect(filtered.current.data).toHaveLength(1);
    expect(filtered.current.data[0].title).toBe('Complete');
  });
});
