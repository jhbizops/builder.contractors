import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Register from '@/pages/Register';

const registerMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    register: registerMock,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    userData: null,
  }),
}));

describe('Register page', () => {
  beforeEach(() => {
    registerMock.mockResolvedValue(undefined);
    registerMock.mockClear();
  });

  it('submits the form when terms are accepted', async () => {
    const user = userEvent.setup();

    render(<Register />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByLabelText(/sales partner/i));
    await user.click(screen.getByLabelText(/terms of service/i));

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'sales'
      );
    });

    expect(
      screen.queryByText(/expected boolean, received string/i)
    ).not.toBeInTheDocument();
  });
});
