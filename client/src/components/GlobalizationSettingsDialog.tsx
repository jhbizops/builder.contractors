import React, { useMemo, useState } from 'react';
import { Globe, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { measurementSystems, type CurrencyDisplayMode } from '@/lib/globalization';

const currencyDisplayModeLabels: Record<CurrencyDisplayMode, string> = {
  platform: 'AUD only (platform currency)',
  local: 'Local currency only',
  both: 'Show both AUD and local currency',
};

export const GlobalizationSettingsDialog: React.FC = () => {
  const {
    settings,
    locales,
    currencies,
    currencyDisplayModes,
    platformCurrency,
    timeZones,
    updateSettings,
    resetSettings,
    isAdmin,
    canEditCurrencySettings,
  } = useGlobalization();
  const [open, setOpen] = useState(false);
  
  const isLocalCurrencyAUD = settings.currency === platformCurrency;
  const showCurrencyOptions = !isLocalCurrencyAUD && canEditCurrencySettings;

  const localeOptions = useMemo(() => locales.map((locale) => ({ value: locale, label: locale })), [locales]);
  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        value: currency,
        label: currency,
      })),
    [currencies],
  );
  const timeZoneOptions = useMemo(
    () =>
      timeZones.map((timeZone) => ({
        value: timeZone,
        label: timeZone,
      })),
    [timeZones],
  );

  const handleOpenChange = (next: boolean) => setOpen(next);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2" aria-label="Global settings">
          <Globe className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Global preferences</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure how Builder.Contractors displays currency, dates, and measurements for your region.
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Select
              value={settings.locale}
              onValueChange={(value) => updateSettings({ locale: value })}
            >
              <SelectTrigger id="locale">
                <SelectValue placeholder="Select a locale" />
              </SelectTrigger>
              <SelectContent>
                {localeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Your local currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => updateSettings({ currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && !isLocalCurrencyAUD && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                As an administrator, you see all prices in AUD with local currency equivalents where available.
              </p>
            </div>
          )}

          {showCurrencyOptions && (
            <>
              <div className="space-y-2">
                <Label htmlFor="currencyDisplayMode">Currency display</Label>
                <Select
                  value={settings.currencyDisplayMode}
                  onValueChange={(value) => updateSettings({ currencyDisplayMode: value as CurrencyDisplayMode })}
                >
                  <SelectTrigger id="currencyDisplayMode">
                    <SelectValue placeholder="Select display mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyDisplayModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {currencyDisplayModeLabels[mode]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Platform prices are in AUD. Choose how to display them.
                </p>
              </div>

              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="operateInLocalCurrency" className="font-medium">
                    Show prices in {settings.currency}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display all amounts in your local currency format.
                  </p>
                </div>
                <Switch
                  id="operateInLocalCurrency"
                  checked={settings.operateInLocalCurrency}
                  onCheckedChange={(checked) => updateSettings({ operateInLocalCurrency: checked })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="timezone">Time zone</Label>
            <Select
              value={settings.timeZone}
              onValueChange={(value) => updateSettings({ timeZone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select a time zone" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {timeZoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurement">Measurement system</Label>
            <Select
              value={settings.measurementSystem}
              onValueChange={(value) => updateSettings({ measurementSystem: value as (typeof measurementSystems)[number] })}
            >
              <SelectTrigger id="measurement">
                <SelectValue placeholder="Select a measurement system" />
              </SelectTrigger>
              <SelectContent>
                {measurementSystems.map((system) => (
                  <SelectItem key={system} value={system} className="capitalize">
                    {system === 'us' ? 'US customary' : system.charAt(0).toUpperCase() + system.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Preferences are stored on this device and can be changed at any time.
          </p>
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
