import type { GeoCountry } from '@/types/geo';

export const codeToFlagEmoji = (code: string | null | undefined): string => {
  if (!code) {
    return '🏳️';
  }

  return code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
    .map((unicode) => String.fromCodePoint(unicode))
    .join('');
};

export const fetchCountries = async (): Promise<GeoCountry[]> => {
  const response = await fetch('/api/countries', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to load countries: ${response.status}`);
  }

  return (await response.json()) as GeoCountry[];
};
