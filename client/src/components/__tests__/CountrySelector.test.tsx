import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CountrySelector } from '../CountrySelector';
import type { GeoCountry } from '@/types/geo';

const mockSetGeoCountry = vi.fn();

vi.mock('@/components/ui/select', () => {
  const flatten = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(flatten).join(' ');
    }
    if (React.isValidElement(content) && content.props?.children) {
      return flatten(content.props.children);
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

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    geo: { country: null, localize: false },
    setGeoCountry: mockSetGeoCountry,
  }),
}));

describe('CountrySelector', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockSetGeoCountry.mockReset();
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
        {
          name: 'Brazil',
          code: 'BR',
          currency: 'BRL',
          languages: ['pt-BR'],
          localize: true,
          proficiency: 'medium',
        },
      ] satisfies GeoCountry[],
    } as any);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders options and notifies selection', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(
      <QueryClientProvider client={client}>
        <CountrySelector />
      </QueryClientProvider>,
    );

    const select = await screen.findByRole('combobox');
    await waitFor(() => expect(select).not.toHaveAttribute('disabled'));
    fireEvent.change(select, { target: { value: 'BR' } });

    expect(mockSetGeoCountry).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'BR' }),
    );
  });
});
