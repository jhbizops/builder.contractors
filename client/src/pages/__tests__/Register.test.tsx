import React from 'react';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, afterEach, beforeAll } from 'vitest';
import Register from '@/pages/Register';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { GeoCountry } from '@/types/geo';

const mockSetGeoCountry = vi.fn();

const registerMock = vi.fn();

vi.mock('@/components/ui/select', () => {
  const flatten = (content: unknown): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(flatten).join(' ');
    }
    if (React.isValidElement(content)) {
      const element = content as React.ReactElement<{ children?: React.ReactNode }>;
      const childContent = element.props.children as unknown;
      return childContent ? flatten(childContent) : '';
    }
    return '';
  };

  const SelectItem = ({ value, children }: any) => (
    <option value={value}>{flatten(children)}</option>
  );

  const Select = ({ value, onValueChange, disabled, children, ...props }: any) => (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      disabled={disabled}
      {...props}
    >
      {React.Children.toArray(children).flatMap((child) => {
        if (!React.isValidElement(child)) {
          return [];
        }

        if (child.type === SelectItem) {
          return child;
        }

        if (child.props?.children) {
          return React.Children.toArray(child.props.children).filter(
            (grandChild) => React.isValidElement(grandChild) && grandChild.type === SelectItem,
          );
        }

        return [];
      })}
    </select>
  );

  const SelectTrigger = ({ children }: any) => <>{children}</>;
  const SelectValue = ({ placeholder }: any) => <option value="">{placeholder}</option>;
  const SelectContent = ({ children }: any) => <>{children}</>;

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

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

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    geo: { country: null, localize: false },
    setGeoCountry: mockSetGeoCountry,
  }),
}));

describe('Register page', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    registerMock.mockResolvedValue(undefined);
    registerMock.mockClear();
    mockSetGeoCountry.mockClear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'United States',
          code: 'US',
          currency: 'USD',
          languages: ['en'],
          localize: false,
          proficiency: 'high',
        },
      ] satisfies GeoCountry[],
    } as any);
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  beforeAll(() => {
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => undefined;
    }
  });

  it('submits the form when terms are accepted', async () => {
    const user = userEvent.setup();

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(
      <QueryClientProvider client={client}>
        <Register />
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    const [countrySelect] = screen.getAllByTestId('select-country');
    await waitFor(() => expect(countrySelect).not.toHaveAttribute('disabled'));
    fireEvent.change(countrySelect, { target: { value: 'US' } });

    await user.click(screen.getByLabelText(/terms of service/i));

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'dual',
        expect.objectContaining({ country: 'US' })
      );
    });

    expect(
      screen.queryByText(/expected boolean, received string/i)
    ).not.toBeInTheDocument();
  });

  it('shows a validation error when the password is too short', async () => {
    const user = userEvent.setup();

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(
      <QueryClientProvider client={client}>
        <Register />
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText(/email/i), 'short@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');

    const [countrySelect] = screen.getAllByTestId('select-country');
    await waitFor(() => expect(countrySelect).not.toHaveAttribute('disabled'));
    fireEvent.change(countrySelect, { target: { value: 'US' } });

    await user.click(screen.getByLabelText(/terms of service/i));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });
});
