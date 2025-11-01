import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCurrencyFormatter,
  createDateTimeFormatter,
  createNumberFormatter,
  deriveDefaultSettings,
  normalizeSettings,
  resolveCurrencyForLocale,
  resolveMeasurementForLocale,
  type GlobalizationSettings,
} from './globalization';

describe('globalization helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives defaults based on Intl locale metadata', () => {
    const restore = vi
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation((locales?: string | string[]) => {
        const locale = Array.isArray(locales) ? locales[0] : locales;
        return {
          resolvedOptions: () => ({
            locale: locale ?? 'fr-FR',
            timeZone: 'Europe/Paris',
          }),
          format: () => 'mocked',
        } as unknown as Intl.DateTimeFormat;
      });

    const settings = deriveDefaultSettings();
    expect(settings.locale).toBe('fr-FR');
    expect(settings.timeZone).toBe('Europe/Paris');
    expect(settings.currency).toBe('EUR');
    expect(settings.measurementSystem).toBe('metric');

    restore.mockRestore();
  });

  it('normalizes invalid currency and time zone gracefully', () => {
    const fallback: GlobalizationSettings = {
      locale: 'en-US',
      currency: 'USD',
      timeZone: 'America/New_York',
      measurementSystem: 'us',
    };

    const normalized = normalizeSettings(
      {
        currency: 'usd',
        timeZone: 'Mars/OlympusMons',
      },
      fallback,
    );

    expect(normalized.currency).toBe('USD');
    expect(normalized.timeZone).toBe(fallback.timeZone);
  });

  it('formats values with currency and numbering standards', () => {
    const settings: GlobalizationSettings = {
      locale: 'ja-JP',
      currency: 'JPY',
      timeZone: 'Asia/Tokyo',
      measurementSystem: 'metric',
    };

    const currency = createCurrencyFormatter(settings);
    const number = createNumberFormatter(settings);

    expect(currency(1500)).toMatch(/￥|JPY/);
    expect(number(1200000)).toBe(new Intl.NumberFormat('ja-JP').format(1200000));
  });

  it('formats datetimes respecting locale and timezone', () => {
    const settings: GlobalizationSettings = {
      locale: 'en-GB',
      currency: 'GBP',
      timeZone: 'UTC',
      measurementSystem: 'imperial',
    };

    const formatDate = createDateTimeFormatter(settings);
    const formatted = formatDate('2024-05-05T12:34:00Z', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    expect(formatted).toMatch(/12:34/i);
    expect(formatted).toMatch(/UTC/i);
  });

  it('provides sane defaults for currency and measurement when locale missing region', () => {
    expect(resolveCurrencyForLocale('en')).toBe('USD');
    expect(resolveMeasurementForLocale('en')).toBe('metric');
    expect(resolveMeasurementForLocale('en-US')).toBe('us');
  });
});
