import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Login from '@/pages/Login';

const loginMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    login: loginMock,
    register: vi.fn(),
    logout: vi.fn(),
    loading: false,
    userData: null,
  }),
}));

describe('Login page', () => {
  afterEach(() => {
    cleanup();
    loginMock.mockClear();
  });

  it('submits the form with valid credentials', async () => {
    loginMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'tester@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByTestId('button-signin'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('tester@example.com', 'password123');
    });
  });

  it('shows validation errors for invalid inputs', async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/^password$/i), '123');
    await user.click(screen.getByTestId('button-signin'));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
