import { beforeEach, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  clearLocalAuthStore,
  loadLocalSession,
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

const USERS_CORRUPT_KEY = `${USERS_KEY}__corrupted`;
const SESSION_BACKUP_KEY = 'bc_local_auth_session_v1__backup';
const SESSION_CORRUPT_KEY = 'bc_local_auth_session_v1__corrupted';

describe('localAuth data retention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores from the backup store when the primary users store is corrupted', async () => {
    const email = 'tester@example.com';
    const password = 'Secr3t!Pass';

    await registerLocalUser(email, password, 'sales');
    const backupSnapshot = localStorage.getItem(USERS_BACKUP_KEY);
    expect(backupSnapshot).toBeTruthy();

    localStorage.setItem(USERS_KEY, 'corrupted!');

    await expect(loginLocalUser(email, password)).resolves.toMatchObject({
      email,
    });

    expect(localStorage.getItem(USERS_KEY)).toBe(backupSnapshot);
    expect(localStorage.getItem(USERS_CORRUPT_KEY)).toBe('corrupted!');
  });

  it('normalises input for login while preserving the stored email casing', async () => {
    const user = await registerLocalUser('  TeSt@Example.Com  ', 'CmplxPwd!3', 'dual');

    expect(user.email).toBe('TeSt@Example.Com');

    await expect(
      loginLocalUser('   test@example.com   ', 'CmplxPwd!3'),
    ).resolves.toMatchObject({ email: 'TeSt@Example.Com' });

    const sessionUser = loadLocalSession();
    expect(sessionUser?.email).toBe('TeSt@Example.Com');
    expect(sessionUser?.createdAt).toBeInstanceOf(Date);
  });

  it('removes all persisted data, backups, and corrupted snapshots when cleared', async () => {
    await registerLocalUser('cleanup@example.com', 'Cl3anPwd!4', 'builder');
    await loginLocalUser('cleanup@example.com', 'Cl3anPwd!4');

    expect(localStorage.getItem(USERS_BACKUP_KEY)).not.toBeNull();
    expect(localStorage.getItem(SESSION_BACKUP_KEY)).not.toBeNull();

    clearLocalAuthStore();

    expect(localStorage.getItem(USERS_KEY)).toBeNull();
    expect(localStorage.getItem(USERS_BACKUP_KEY)).toBeNull();
    expect(localStorage.getItem(USERS_CORRUPT_KEY)).toBeNull();
    expect(localStorage.getItem('bc_local_auth_session_v1')).toBeNull();
    expect(localStorage.getItem(SESSION_BACKUP_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_CORRUPT_KEY)).toBeNull();
  });
});
