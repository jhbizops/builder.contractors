import { describe, expect, it } from 'vitest';
import {
  createLocaleFromCountry,
  deriveSettingsFromGeo,
  deriveDefaultSettings,
  supportedLocales,
} from '../globalization';

describe('globalization helpers', () => {
  it('creates locale from country and languages', () => {
    expect(createLocaleFromCountry('BR', ['pt-BR'])).toBe('pt-BR');
    expect(createLocaleFromCountry('CN', ['zh'])).toBe('zh-CN');
    expect(createLocaleFromCountry('US', [])).toBe('en-US');
  });

  it('derives settings from geo payload', () => {
    const fallback = deriveDefaultSettings();
    const result = deriveSettingsFromGeo(
      {
        code: 'BR',
        languages: ['pt-BR', 'en'],
        currency: 'BRL',
      },
      fallback,
    );

    expect(result.locale).toBe('pt-BR');
    expect(result.currency).toBe('BRL');
    expect(result.measurementSystem).toBe('metric');
    expect(supportedLocales).toContain(result.locale);
  });
});
