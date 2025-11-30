import React from 'react';
import { SearchableCountrySelector } from './SearchableCountrySelector';

export interface CountrySelectorProps {
  readonly className?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
}

/**
 * CountrySelector - Now uses the searchable implementation for better UX
 * with 195+ countries. The component provides predictive search to help
 * users quickly find their country.
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({
  className,
  placeholder,
  value,
  onValueChange,
  disabled,
}) => {
  return (
    <SearchableCountrySelector
      className={className ?? 'w-[240px]'}
      placeholder={placeholder ?? 'Select your country'}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    />
  );
};

export default CountrySelector;
