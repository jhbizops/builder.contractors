import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../auth';

describe('auth hashing', () => {
  it('hashes and verifies passwords correctly', async () => {
    const password = 'Secur3Pass!';
    const hashed = await hashPassword(password);

    expect(hashed.hash).toBeTypeOf('string');
    expect(hashed.salt).toBeTypeOf('string');
    expect(hashed.hash).not.toHaveLength(0);
    expect(hashed.salt).not.toHaveLength(0);

    await expect(verifyPassword(password, hashed)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hashed)).resolves.toBe(false);
  });

  it('produces different salts for each hash', async () => {
    const first = await hashPassword('password123');
    const second = await hashPassword('password123');

    expect(first.salt).not.toEqual(second.salt);
    expect(first.hash).not.toEqual(second.hash);
  });
});
