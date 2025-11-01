import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GLOBALIZATION_STORAGE_KEY,
  GlobalizationSettings,
  createCurrencyFormatter,
  createDateTimeFormatter,
  createNumberFormatter,
  deriveDefaultSettings,
  measurementSystems,
  normalizeSettings,
  priorityTimeZones,
  supportedCurrencies,
  supportedLocales,
  type DateLike,
} from '@/lib/globalization';

interface GlobalizationContextValue {
  settings: GlobalizationSettings;
  locales: readonly string[];
  currencies: readonly string[];
  timeZones: readonly string[];
  measurementSystems: typeof measurementSystems;
  updateSettings: (update: Partial<GlobalizationSettings>) => void;
  resetSettings: () => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDateTime: (value: DateLike, options?: Intl.DateTimeFormatOptions) => string;
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

  const formatCurrency = useMemo(() => createCurrencyFormatter(settings), [settings]);
  const formatNumber = useMemo(() => createNumberFormatter(settings), [settings]);
  const formatDateTime = useMemo(() => createDateTimeFormatter(settings), [settings]);

  const value = useMemo<GlobalizationContextValue>(
    () => ({
      settings,
      locales: supportedLocales,
      currencies: supportedCurrencies,
      timeZones: priorityTimeZones,
      measurementSystems,
      updateSettings,
      resetSettings,
      formatCurrency,
      formatNumber,
      formatDateTime,
    }),
    [
      formatCurrency,
      formatDateTime,
      formatNumber,
      resetSettings,
      settings,
      updateSettings,
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
