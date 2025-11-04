import type { CountryMetadata } from "@shared/countryMetadata";
import countryMetadata, {
  countryMetadataByCode,
  countryCodes,
} from "@shared/countryMetadata";

export type SupportedCountry = CountryMetadata;

export interface CountryLookupResult {
  readonly country?: SupportedCountry;
  readonly reason?: string;
}

export const supportedCountries: readonly SupportedCountry[] = countryMetadata;

export function findCountryByCode(code: string | null | undefined): CountryLookupResult {
  if (!code) {
    return { reason: "missing-country-code" };
  }

  const normalized = code.trim().toUpperCase();
  const country = countryMetadataByCode[normalized];
  if (!country) {
    return { reason: "unsupported-country" };
  }

  return { country };
}

export function isCountrySupported(code: string | null | undefined): boolean {
  if (!code) {
    return false;
  }

  return countryCodes.includes(code.toUpperCase());
}

export function formatCountryPayload(country: SupportedCountry) {
  return {
    name: country.name,
    code: country.code,
    currency: country.currency,
    languages: country.languages,
    localize: country.localize,
    proficiency: country.proficiency,
  } as const;
}
