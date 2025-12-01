import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import type { GeoCountry } from '@/types/geo';
import { codeToFlagEmoji, fetchCountries } from '@/lib/countries';

const queryKey = ['/api/countries'] as const;

export interface SearchableCountrySelectorProps {
  readonly className?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
}

export const SearchableCountrySelector: React.FC<SearchableCountrySelectorProps> = ({ 
  className,
  placeholder = "Select country...",
  value: controlledValue,
  onValueChange,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { geo, setGeoCountry } = useGlobalization();
  
  // Use controlled value if provided, otherwise use globalization context
  const isControlled = controlledValue !== undefined && onValueChange !== undefined;
  const selected = isControlled ? controlledValue : (geo.country?.code ?? '');
  
  const { data, isPending } = useQuery<GeoCountry[]>({
    queryKey,
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });

  const countries = useMemo(() => data ?? [], [data]);
  
  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchValue.trim()) return countries;
    
    const search = searchValue.toLowerCase().trim();
    return countries.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search)
    );
  }, [countries, searchValue]);
  
  // Sort filtered countries alphabetically
  const sortedCountries = useMemo(() => {
    return [...filteredCountries].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredCountries]);
  
  const selectedCountry = countries.find(c => c.code === selected);
  
  const handleSelect = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      if (isControlled) {
        onValueChange?.(countryCode);
      } else {
        setGeoCountry(country);
      }
    }
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select your country"
          className={cn("w-full justify-between", className)}
          disabled={disabled || isPending}
          data-testid="button-country-selector"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedCountry ? (
              <>
                <span className="text-lg" aria-hidden="true">
                  {codeToFlagEmoji(selectedCountry.code)}
                </span>
                <span className="truncate">{selectedCountry.name}</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 opacity-50" />
                <span className="text-muted-foreground">
                  {isPending ? 'Loading countries...' : placeholder}
                </span>
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search countries..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
            data-testid="input-country-search"
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              {isPending ? 'Loading countries...' : 'No country found.'}
            </CommandEmpty>
            
            <CommandGroup>
              {sortedCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  onSelect={handleSelect}
                  className="flex items-center gap-2"
                  data-testid={`item-country-${country.code}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-lg" aria-hidden="true">
                    {codeToFlagEmoji(country.code)}
                  </span>
                  <span className="flex-1 truncate">{country.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Export both named and default for compatibility
export default SearchableCountrySelector;