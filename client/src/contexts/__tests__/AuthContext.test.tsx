import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { webcrypto } from 'node:crypto';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('registers, logs out, and logs in users via local auth', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('tester@example.com', 'password123', 'sales');
    });

    expect(result.current.currentUser?.email).toBe('tester@example.com');
    expect(result.current.userData?.approved).toBe(false);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.currentUser).toBeNull();

    await act(async () => {
      await result.current.login('tester@example.com', 'password123');
    });

    expect(result.current.currentUser?.email).toBe('tester@example.com');
  });
});
