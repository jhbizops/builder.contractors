import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthContext } from '@/contexts/AuthContext';
import type { User } from '@/types';

type AuthContextValue = NonNullable<React.ContextType<typeof AuthContext>>;

const baseUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'sales',
  approved: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const baseContext: AuthContextValue = {
  currentUser: { id: baseUser.id, email: baseUser.email },
  userData: baseUser,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
};

function renderWithAuth(value: Partial<AuthContextValue> = {}) {
  const contextValue: AuthContextValue = {
    ...baseContext,
    ...value,
    currentUser: value.currentUser ?? baseContext.currentUser ?? null,
    userData: value.userData ?? baseContext.userData ?? null,
    loading: value.loading ?? baseContext.loading ?? false,
    login: value.login ?? baseContext.login,
    register: value.register ?? baseContext.register,
    logout: value.logout ?? baseContext.logout,
  };

  return render(
    <AuthContext.Provider value={contextValue}>
      <ProtectedRoute>
        <div data-testid="protected-content">Protected</div>
      </ProtectedRoute>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('blocks unapproved non-admin users', () => {
    renderWithAuth({
      userData: {
        ...baseContext.userData!,
        approved: false,
        role: 'sales',
      },
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(
      screen.getByText('Your account is pending admin approval. Please wait for confirmation.'),
    ).toBeInTheDocument();
  });

  it('allows admin users even when pending approval', () => {
    renderWithAuth({
      userData: {
        ...baseContext.userData!,
        approved: false,
        role: 'admin',
      },
    });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
