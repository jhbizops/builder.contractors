import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import type { GeoCountry } from '@/types/geo';
import { codeToFlagEmoji, fetchCountries } from '@/lib/countries';

const queryKey = ['/api/countries'] as const;

export interface CountrySelectorProps {
  readonly className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ className }) => {
  const { geo, setGeoCountry } = useGlobalization();
  const { data, isPending } = useQuery<GeoCountry[]>({
    queryKey,
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });

  const options = useMemo(() => data ?? [], [data]);
  const selected = geo.country?.code ?? '';

  return (
    <Select
      value={selected}
      onValueChange={(value) => {
        const match = options.find((option) => option.code === value);
        if (match) {
          setGeoCountry(match);
        }
      }}
      disabled={isPending || options.length === 0}
      aria-label="Select your country"
    >
      <SelectTrigger className={className ?? 'w-[240px]'} aria-label="Select your country">
        <SelectValue placeholder={isPending ? 'Loading…' : 'Country'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((country) => (
          <SelectItem key={country.code} value={country.code} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-lg">
                {codeToFlagEmoji(country.code)}
              </span>
              <span className="truncate">{country.name}</span>
              {country.localize ? (
                <Badge variant="secondary" className="ml-2">
                  Localized
                </Badge>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;
