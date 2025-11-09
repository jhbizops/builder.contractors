import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CountrySelector } from '../CountrySelector';
import type { GeoCountry } from '@/types/geo';

const mockSetGeoCountry = vi.fn();

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    geo: { country: null, localize: false },
    setGeoCountry: mockSetGeoCountry,
  }),
}));

describe('CountrySelector', () => {
  const originalFetch = globalThis.fetch;
  const originalScrollIntoView =
    HTMLElement.prototype.scrollIntoView ?? undefined;

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

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: originalScrollIntoView,
      });
    } else {
      delete (HTMLElement.prototype as { scrollIntoView?: typeof Element.prototype.scrollIntoView }).scrollIntoView;
    }
  });

  it('renders options and notifies selection', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(
      <QueryClientProvider client={client}>
        <CountrySelector />
      </QueryClientProvider>,
    );

    const trigger = await screen.findByTestId('button-country-selector');
    await waitFor(() => expect(trigger).not.toBeDisabled());

    await user.click(trigger);

    const option = await screen.findByTestId('item-country-BR');
    await user.click(option);

    expect(mockSetGeoCountry).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'BR' }),
    );
  });
});
