import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRegions, type Region } from "@shared/countries";

interface RegionFilterProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  includeAll?: boolean;
}

export function RegionFilter({
  value,
  onValueChange,
  placeholder = "Filter by region",
  className,
  includeAll = true,
}: RegionFilterProps) {
  const regions = getRegions();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} data-testid="select-region">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all" data-testid="option-region-all">
            All Regions
          </SelectItem>
        )}
        {regions.map((region) => (
          <SelectItem 
            key={region} 
            value={region}
            data-testid={`option-region-${region.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {region}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}