import { describe, expect, it } from 'vitest';
import countryMetadata, {
  countryCodes,
  countryMetadataByCode,
  localizeCountryCodes,
} from '../countryMetadata';

describe('countryMetadata', () => {
  it('contains 91 supported countries', () => {
    expect(countryMetadata).toHaveLength(91);
    expect(countryCodes).toHaveLength(91);
  });

  it('exposes metadata by country code', () => {
    const usa = countryMetadataByCode.US;
    expect(usa).toBeDefined();
    expect(usa?.currency).toBe('USD');
    expect(usa?.languages).toContain('en');
  });

  it('flags low English proficiency countries for localization', () => {
    const expected = [
      'BR',
      'CN',
      'EG',
      'ID',
      'JP',
      'KW',
      'OM',
      'PA',
      'QA',
      'SA',
      'SI',
      'TH',
      'TR',
      'AE',
    ];
    expect(new Set(localizeCountryCodes)).toEqual(new Set(expected));
  });
});
