import { beforeEach, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';

import { getCollectionStore, resetCollections } from '@/lib/localCollectionStore';
import {
  clearLocalAuthStore,
  getAllLocalUsers,
  registerLocalUser,
} from '@/lib/localAuth';
import {
  syncAllUsersToCollection,
  updateUserApprovalAndSync,
} from '@/lib/userCollectionSync';
import { User } from '@/types';

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

describe('userCollectionSync', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCollections();
    clearLocalAuthStore();
  });

  it('syncs all local auth users into the users collection', async () => {
    const firstUser = await registerLocalUser('first@example.com', 'Password!1', 'builder');
    const secondUser = await registerLocalUser('second@example.com', 'Password!1', 'sales');

    await syncAllUsersToCollection();

    const usersStore = getCollectionStore<User>('users');
    const snapshot = usersStore.getSnapshot();

    expect(snapshot.some((user) => user.id === firstUser.id)).toBe(true);
    expect(snapshot.some((user) => user.id === secondUser.id)).toBe(true);
  });

  it('updates approval status in both local auth and the collection store', async () => {
    const pendingUser = await registerLocalUser('pending@example.com', 'Password!1', 'builder');
    const usersStore = getCollectionStore<User>('users');

    expect(usersStore.getById(pendingUser.id)).toBeUndefined();

    await updateUserApprovalAndSync(pendingUser.id, true);

    const storedUser = usersStore.getById(pendingUser.id);
    expect(storedUser).toBeDefined();
    expect(storedUser?.approved).toBe(true);

    const localUsers = getAllLocalUsers();
    const updatedLocal = localUsers.find((user) => user.id === pendingUser.id);
    expect(updatedLocal?.approved).toBe(true);
  });
});
