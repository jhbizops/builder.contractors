import { z } from 'zod';

export const measurementSystems = ['metric', 'imperial', 'us'] as const;
export type MeasurementSystem = (typeof measurementSystems)[number];

export const currencyDisplayModes = ['platform', 'local', 'both'] as const;
export type CurrencyDisplayMode = (typeof currencyDisplayModes)[number];

export const PLATFORM_CURRENCY = 'AUD';

export const globalizationSettingsSchema = z.object({
  locale: z.string().min(2),
  currency: z
    .string()
    .length(3)
    .transform((val) => val.toUpperCase()),
  timeZone: z.string().min(2),
  measurementSystem: z.enum(measurementSystems),
  currencyDisplayMode: z.enum(currencyDisplayModes).default('both'),
  operateInLocalCurrency: z.boolean().default(false),
});

export type GlobalizationSettings = z.infer<typeof globalizationSettingsSchema>;

export const supportedLocales = [
  'en-US',
  'en-GB',
  'en-AU',
  'en-CA',
  'en-NZ',
  'es-ES',
  'es-MX',
  'es-PA',
  'fr-FR',
  'fr-CA',
  'de-DE',
  'pt-BR',
  'pt-PT',
  'hi-IN',
  'ja-JP',
  'zh-CN',
  'zh-HK',
  'zh-TW',
  'ar-EG',
  'ar-KW',
  'ar-OM',
  'ar-AE',
  'ar-SA',
  'ar-QA',
  'it-IT',
  'nl-NL',
  'pl-PL',
  'sv-SE',
  'ko-KR',
  'th-TH',
  'id-ID',
  'sl-SI',
  'tr-TR',
];

const countryCurrencyMap: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'NZD',
  CA: 'CAD',
  MX: 'MXN',
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  PT: 'EUR',
  BR: 'BRL',
  IN: 'INR',
  JP: 'JPY',
  CN: 'CNY',
  HK: 'HKD',
  TW: 'TWD',
  AE: 'AED',
  SA: 'SAR',
  IT: 'EUR',
  NL: 'EUR',
  PL: 'PLN',
  SE: 'SEK',
  KR: 'KRW',
  TH: 'THB',
  ID: 'IDR',
  SG: 'SGD',
  ZA: 'ZAR',
};

export const supportedCurrencies = Array.from(
  new Set(Object.values(countryCurrencyMap).concat(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'])),
).sort();

const imperialCountries = new Set(['US', 'LR', 'MM']);

export const priorityTimeZones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const isValidTimeZone = (timeZone: string): boolean => {
  if (!timeZone) {
    return false;
  }

  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone').includes(timeZone);
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const extractRegion = (locale: string): string | undefined => {
  const parts = locale.split('-');
  if (parts.length >= 2) {
    return parts[1]!.toUpperCase();
  }
  return undefined;
};

export const resolveCurrencyForLocale = (locale: string): string => {
  const region = extractRegion(locale);
  if (region && countryCurrencyMap[region]) {
    return countryCurrencyMap[region];
  }
  return 'USD';
};

export const resolveMeasurementForLocale = (locale: string): MeasurementSystem => {
  const region = extractRegion(locale);
  if (region && imperialCountries.has(region)) {
    return region === 'US' ? 'us' : 'imperial';
  }
  return 'metric';
};

const fallbackTimeZone = 'UTC';

export const createLocaleFromCountry = (
  countryCode: string,
  languages: readonly string[],
): string => {
  if (languages.length === 0) {
    return `en-${countryCode}`;
  }

  const primary = languages[0]!;
  if (primary.includes('-')) {
    return primary;
  }

  return `${primary}-${countryCode}`;
};

export interface GeoSettingsInput {
  readonly code: string;
  readonly languages: readonly string[];
  readonly currency: string;
}

export const deriveSettingsFromGeo = (
  geo: GeoSettingsInput,
  fallback: GlobalizationSettings = deriveDefaultSettings(),
): GlobalizationSettings => {
  const locale = createLocaleFromCountry(geo.code, geo.languages);
  const normalizedLocale = supportedLocales.includes(locale)
    ? locale
    : fallback.locale;

  const currency = geo.currency || resolveCurrencyForLocale(normalizedLocale);

  return globalizationSettingsSchema.parse({
    locale: normalizedLocale,
    currency,
    timeZone: fallback.timeZone ?? fallbackTimeZone,
    measurementSystem: resolveMeasurementForLocale(normalizedLocale),
    currencyDisplayMode: fallback.currencyDisplayMode ?? 'both',
    operateInLocalCurrency: fallback.operateInLocalCurrency ?? false,
  });
};

export const deriveDefaultSettings = (): GlobalizationSettings => {
  const resolvedOptions =
    typeof Intl !== 'undefined' ? new Intl.DateTimeFormat().resolvedOptions() : undefined;
  const fallbackLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const locale = resolvedOptions?.locale ?? fallbackLocale ?? 'en-US';
  const timeZone =
    resolvedOptions?.timeZone && isValidTimeZone(resolvedOptions.timeZone)
      ? resolvedOptions.timeZone
      : 'UTC';

  const currency = resolveCurrencyForLocale(locale);
  const measurementSystem = resolveMeasurementForLocale(locale);

  return globalizationSettingsSchema.parse({
    locale,
    currency,
    timeZone,
    measurementSystem,
    currencyDisplayMode: 'both',
    operateInLocalCurrency: false,
  });
};

export const normalizeSettings = (
  settings: Partial<GlobalizationSettings> | null | undefined,
  fallback: GlobalizationSettings = deriveDefaultSettings(),
): GlobalizationSettings => {
  const merged: GlobalizationSettings = {
    ...fallback,
    ...(settings ?? {}),
  } as GlobalizationSettings;

  const { locale } = merged;
  const normalized: GlobalizationSettings = {
    locale,
    currency: merged.currency || resolveCurrencyForLocale(locale),
    timeZone: isValidTimeZone(merged.timeZone) ? merged.timeZone : fallback.timeZone,
    measurementSystem:
      measurementSystems.includes(merged.measurementSystem)
        ? merged.measurementSystem
        : resolveMeasurementForLocale(locale),
    currencyDisplayMode:
      currencyDisplayModes.includes(merged.currencyDisplayMode)
        ? merged.currencyDisplayMode
        : fallback.currencyDisplayMode,
    operateInLocalCurrency: merged.operateInLocalCurrency ?? fallback.operateInLocalCurrency,
  };

  const parsed = globalizationSettingsSchema.safeParse(normalized);
  if (parsed.success) {
    return parsed.data;
  }

  return fallback;
};

export const createNumberFormatter = (settings: GlobalizationSettings) =>
  (value: number, options?: Intl.NumberFormatOptions): string => {
    if (!Number.isFinite(value)) {
      return '—';
    }

    try {
      return new Intl.NumberFormat(settings.locale, options).format(value);
    } catch {
      return value.toString();
    }
  };

export const createCurrencyFormatter = (settings: GlobalizationSettings) =>
  (value: number, options?: Intl.NumberFormatOptions): string => {
    if (!Number.isFinite(value)) {
      return '—';
    }

    try {
      return new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: settings.currency,
        ...options,
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  };

export interface DualCurrencyOptions {
  readonly exchangeRate?: number;
}

export const createDualCurrencyFormatter = (settings: GlobalizationSettings) =>
  (valueInAUD: number, options?: DualCurrencyOptions): string => {
    if (!Number.isFinite(valueInAUD)) {
      return '—';
    }

    const { currencyDisplayMode, currency, operateInLocalCurrency, locale } = settings;
    const isLocalCurrencyAUD = currency === PLATFORM_CURRENCY;
    const exchangeRate = options?.exchangeRate;
    const hasExchangeRate = exchangeRate !== undefined && exchangeRate !== 1;

    const formatAUD = (val: number): string => {
      try {
        return new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: PLATFORM_CURRENCY,
        }).format(val);
      } catch {
        return `A$${val.toFixed(2)}`;
      }
    };

    const formatLocal = (val: number): string => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
        }).format(val);
      } catch {
        return `${currency} ${val.toFixed(2)}`;
      }
    };

    if (isLocalCurrencyAUD) {
      return formatAUD(valueInAUD);
    }

    if (operateInLocalCurrency) {
      if (hasExchangeRate) {
        return formatLocal(valueInAUD * exchangeRate);
      }
      return formatLocal(valueInAUD);
    }

    if (currencyDisplayMode === 'platform') {
      return formatAUD(valueInAUD);
    }

    if (currencyDisplayMode === 'local') {
      if (hasExchangeRate) {
        return formatLocal(valueInAUD * exchangeRate);
      }
      return formatLocal(valueInAUD);
    }

    if (hasExchangeRate) {
      return `${formatAUD(valueInAUD)} (${formatLocal(valueInAUD * exchangeRate)})`;
    }

    return formatAUD(valueInAUD);
  };

export type DateLike = Date | string | number;

const toDate = (value: DateLike): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const createDateTimeFormatter = (settings: GlobalizationSettings) =>
  (value: DateLike, options?: Intl.DateTimeFormatOptions): string => {
    const date = toDate(value);
    if (!date) {
      return '';
    }

    try {
      return new Intl.DateTimeFormat(settings.locale, {
        timeZone: settings.timeZone,
        ...options,
      }).format(date);
    } catch {
      return date.toISOString();
    }
  };

export const GLOBALIZATION_STORAGE_KEY = 'elyment.globalization.settings';
