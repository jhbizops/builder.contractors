import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SearchableCountrySelector } from '@/components/SearchableCountrySelector';

const mockCountries = vi.hoisted(() => [
  { code: 'AU', name: 'Australia', currency: 'AUD', languages: ['en'] },
  { code: 'CA', name: 'Canada', currency: 'CAD', languages: ['en', 'fr'] },
]);

const useQueryMock = vi.hoisted(() => vi.fn(() => ({
  data: mockCountries,
  isPending: false,
})));

const setGeoCountryMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}));

vi.mock('@/contexts/GlobalizationContext', () => ({
  useGlobalization: () => ({
    geo: { country: null },
    setGeoCountry: setGeoCountryMock,
  }),
}));

beforeEach(() => {
  useQueryMock.mockClear();
  setGeoCountryMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('SearchableCountrySelector', () => {
  it('clears the search input when the popover closes', async () => {
    const user = userEvent.setup();
    render(<SearchableCountrySelector />);

    const [trigger] = screen.getAllByTestId('button-country-selector');
    await user.click(trigger);

    const searchInput = screen.getByPlaceholderText('Search countries...');
    await user.type(searchInput, 'aus');

    expect(searchInput).toHaveValue('aus');
    expect(screen.getByText('Australia')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(trigger);

    const reopenedSearchInput = screen.getByPlaceholderText('Search countries...');
    expect(reopenedSearchInput).toHaveValue('');
    expect(screen.getByText('Australia')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
  });

  it('updates the globalization country when selecting an item', async () => {
    const user = userEvent.setup();
    render(<SearchableCountrySelector />);

    const [trigger] = screen.getAllByTestId('button-country-selector');
    await user.click(trigger);
    await user.click(screen.getByTestId('item-country-CA'));

    expect(setGeoCountryMock).toHaveBeenCalledWith(mockCountries[1]);
  });
});
