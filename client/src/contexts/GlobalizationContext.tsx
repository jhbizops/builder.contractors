import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GLOBALIZATION_STORAGE_KEY,
  GlobalizationSettings,
  createCurrencyFormatter,
  createDateTimeFormatter,
  createDualCurrencyFormatter,
  createNumberFormatter,
  currencyDisplayModes,
  deriveDefaultSettings,
  deriveSettingsFromGeo,
  measurementSystems,
  normalizeSettings,
  PLATFORM_CURRENCY,
  priorityTimeZones,
  supportedCurrencies,
  supportedLocales,
  type CurrencyDisplayMode,
  type DateLike,
  type DualCurrencyOptions,
} from '@/lib/globalization';
import type { GeoCountry, GeoSession } from '@/types/geo';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface GlobalizationContextValue {
  settings: GlobalizationSettings;
  locales: readonly string[];
  currencies: readonly string[];
  currencyDisplayModes: typeof currencyDisplayModes;
  platformCurrency: string;
  timeZones: readonly string[];
  measurementSystems: typeof measurementSystems;
  updateSettings: (update: Partial<GlobalizationSettings>) => void;
  resetSettings: () => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDualCurrency: (valueInAUD: number, options?: DualCurrencyOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDateTime: (value: DateLike, options?: Intl.DateTimeFormatOptions) => string;
  geo: GeoSession;
  setGeoCountry: (country: GeoCountry | null) => void;
}

const GlobalizationContext = createContext<GlobalizationContextValue | undefined>(undefined);

const parseStoredSettings = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Partial<GlobalizationSettings>;
  } catch {
    return null;
  }
};

export const GlobalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalizationSettings>(() => deriveDefaultSettings());
  const [hydrated, setHydrated] = useState(false);
  const [geoSession, setGeoSession] = useState<GeoSession>({ country: null, localize: false });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = parseStoredSettings(window.localStorage.getItem(GLOBALIZATION_STORAGE_KEY));
    if (stored) {
      setSettings((previous) => normalizeSettings(stored, previous));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(GLOBALIZATION_STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const updateSettings = useCallback((update: Partial<GlobalizationSettings>) => {
    setSettings((previous) => normalizeSettings({ ...previous, ...update }, previous));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(deriveDefaultSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadGeoSession = async () => {
      try {
        const response = await fetch('/api/session/geo', { credentials: 'include' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as GeoSession;
        if (cancelled) {
          return;
        }

        setGeoSession(data);

        if (data.country) {
          const geoInput: GeoCountry = data.country;
          setSettings((previous) => deriveSettingsFromGeo({
            code: geoInput.code,
            languages: geoInput.languages,
            currency: geoInput.currency,
          }, previous));
        }
      } catch (error) {
        // Swallow errors silently to avoid blocking rendering; geo is optional
      }
    };

    void loadGeoSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!geoSession.country) {
      return;
    }

    const storageKey = `bc_geo_dimension_${geoSession.country.code}`;
    if (!window.sessionStorage.getItem(storageKey)) {
      window.sessionStorage.setItem(storageKey, '1');
      if (typeof window.gtag === 'function') {
        window.gtag('set', {
          country_dimension: geoSession.country.code,
        });
        window.gtag('event', 'country_launch', {
          country: geoSession.country.code,
        });
      }
    }
  }, [geoSession.country]);

  const formatCurrency = useMemo(() => createCurrencyFormatter(settings), [settings]);
  const formatDualCurrency = useMemo(() => createDualCurrencyFormatter(settings), [settings]);
  const formatNumber = useMemo(() => createNumberFormatter(settings), [settings]);
  const formatDateTime = useMemo(() => createDateTimeFormatter(settings), [settings]);

  const value = useMemo<GlobalizationContextValue>(
    () => ({
      settings,
      locales: supportedLocales,
      currencies: supportedCurrencies,
      currencyDisplayModes,
      platformCurrency: PLATFORM_CURRENCY,
      timeZones: priorityTimeZones,
      measurementSystems,
      updateSettings,
      resetSettings,
      formatCurrency,
      formatDualCurrency,
      formatNumber,
      formatDateTime,
      geo: geoSession,
      setGeoCountry: (country: GeoCountry | null) => {
        setGeoSession({ country, localize: country?.localize ?? false });
        if (country) {
          setSettings((previous) =>
            deriveSettingsFromGeo(
              {
                code: country.code,
                languages: country.languages,
                currency: country.currency,
              },
              previous,
            ),
          );
        }
      },
    }),
    [
      formatCurrency,
      formatDateTime,
      formatDualCurrency,
      formatNumber,
      geoSession,
      resetSettings,
      settings,
      updateSettings,
      setGeoSession,
      setSettings,
    ],
  );

  return <GlobalizationContext.Provider value={value}>{children}</GlobalizationContext.Provider>;
};

export const useGlobalization = () => {
  const context = useContext(GlobalizationContext);
  if (!context) {
    throw new Error('useGlobalization must be used within a GlobalizationProvider');
  }
  return context;
};
