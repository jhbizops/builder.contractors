import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countriesByRegion, getRegionForCountry, type Country, type Region } from "@shared/countries";

interface CountrySelectorProps {
  value?: string;
  onValueChange: (value: string, region: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = "Select a country",
  className,
  disabled,
  required,
}: CountrySelectorProps) {
  const handleValueChange = (country: string) => {
    const region = getRegionForCountry(country as Country) || "";
    onValueChange(country, region);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled} required={required}>
      <SelectTrigger className={className} data-testid="select-country">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {Object.entries(countriesByRegion).map(([region, countries]) => (
          <SelectGroup key={region}>
            <SelectLabel>{region}</SelectLabel>
            {countries.map((country) => (
              <SelectItem 
                key={country} 
                value={country}
                data-testid={`option-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {country}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}