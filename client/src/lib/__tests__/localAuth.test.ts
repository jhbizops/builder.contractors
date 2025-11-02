import { beforeEach, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  clearLocalAuthStore,
  loadLocalSession,
  loginLocalUser,
  logoutLocalUser,
  registerLocalUser,
} from '@/lib/localAuth';

describe('localAuth', () => {
  beforeEach(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        configurable: true,
      });
    }
    clearLocalAuthStore();
  });

  it('registers and logs in a user using secure hashes', async () => {
    const created = await registerLocalUser('user@example.com', 'hunter2', 'builder');

    expect(created.email).toBe('user@example.com');
    expect(created.role).toBe('builder');
    expect(created.approved).toBe(false);

    const sessionBeforeLogin = loadLocalSession();
    expect(sessionBeforeLogin?.email).toBe('user@example.com');

    logoutLocalUser();
    expect(loadLocalSession()).toBeNull();

    const loggedIn = await loginLocalUser('user@example.com', 'hunter2');
    expect(loggedIn.id).toBe(created.id);
    expect(loggedIn.email).toBe(created.email);

    const sessionAfterLogin = loadLocalSession();
    expect(sessionAfterLogin?.email).toBe('user@example.com');
  });

  it('rejects duplicate registration attempts', async () => {
    await registerLocalUser('dupe@example.com', 'password', 'sales');

    await expect(
      registerLocalUser('dupe@example.com', 'password', 'sales'),
    ).rejects.toThrow('An account with this email already exists.');
  });

  it('prevents logging in with the wrong password', async () => {
    await registerLocalUser('secure@example.com', '12345678', 'builder');

    await expect(loginLocalUser('secure@example.com', 'badpass')).rejects.toThrow(
      'Invalid email or password.',
    );
  });
});
