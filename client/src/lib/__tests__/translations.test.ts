import { describe, expect, it } from 'vitest';
import { getTranslationsForLocale } from '../translations';

describe('translations', () => {
  it('falls back to default locale and exposes hyphenated keys', () => {
    const translations = getTranslationsForLocale('fr-FR');

    expect(translations['share-advice']).toBeDefined();
    expect(translations['connect-contractors']).toBeDefined();
    expect(translations.welcome).toContain('Exchange');
  });

  it('returns locale specific copy when available', () => {
    const translations = getTranslationsForLocale('pt-BR');

    expect(translations['share-advice']).toContain('conselhos');
    expect(translations['connect-contractors']).toContain('região');
  });
});
