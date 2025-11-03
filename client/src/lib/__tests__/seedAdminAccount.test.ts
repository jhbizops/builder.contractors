import { beforeEach, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { seedAdminAccount } from '@/lib/seedAdmin';
import {
  loginLocalUser,
  registerLocalUser,
  USERS_BACKUP_KEY,
  USERS_KEY,
} from '@/lib/localAuth';

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

describe('seedAdminAccount', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an admin user that can sign in with seeded credentials', async () => {
    const credentials = await seedAdminAccount();
    expect(credentials).not.toBeNull();
    if (!credentials) {
      throw new Error('Expected credentials to be returned');
    }

    const user = await loginLocalUser(credentials.email, credentials.password);

    expect(user.role).toBe('admin');
    expect(user.approved).toBe(true);
  });

  it('avoids creating duplicate admin accounts', async () => {
    await seedAdminAccount();
    const firstSnapshot = JSON.parse(
      localStorage.getItem(USERS_KEY) ?? '[]'
    ) as unknown[];

    await seedAdminAccount();
    const secondSnapshot = JSON.parse(
      localStorage.getItem(USERS_KEY) ?? '[]'
    ) as unknown[];

    expect(secondSnapshot).toHaveLength(firstSnapshot.length);
  });

  it('retains existing user accounts when seeding the admin', async () => {
    await registerLocalUser('member@example.com', 'SecurePass!1', 'builder');

    await seedAdminAccount();

    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as Array<
      Record<string, unknown>
    >;

    expect(users.some((entry) => entry.email === 'member@example.com')).toBe(
      true,
    );
    expect(users.some((entry) => entry.email === 'admin@builder.contractors')).toBe(
      true,
    );
  });

  it('restores from backup when the primary store is corrupted', async () => {
    await seedAdminAccount();
    const backupSnapshot = localStorage.getItem(USERS_BACKUP_KEY);
    expect(backupSnapshot).toBeTruthy();

    localStorage.setItem(USERS_KEY, 'not valid json');

    const credentials = await seedAdminAccount();
    expect(credentials).not.toBeNull();

    expect(localStorage.getItem(USERS_KEY)).toBe(backupSnapshot);
  });
});
