import { ChargeCategory, InvoiceFlag } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES } from '@/constants/usStates';
import { X } from 'lucide-react';

export interface DashboardFilterValues {
  disasterId: string;
  fiscalYear: string;
  state: string;
  amountMin: string;
  amountMax: string;
  category: ChargeCategory | '';
  flag: InvoiceFlag | '';
}

interface DashboardFiltersProps {
  filters: DashboardFilterValues;
  onChange: (filters: DashboardFilterValues) => void;
  availableDisasterIds: string[];
  availableStates: string[];
  availableFiscalYears: string[];
}

const EMPTY_FILTERS: DashboardFilterValues = {
  disasterId: '',
  fiscalYear: '',
  state: '',
  amountMin: '',
  amountMax: '',
  category: '',
  flag: '',
};

export function DashboardFilters({ filters, onChange, availableDisasterIds, availableStates, availableFiscalYears }: DashboardFiltersProps) {
  const update = (key: keyof DashboardFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)} className="text-xs h-7">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Disaster ID */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Disaster ID</Label>
          <Select value={filters.disasterId} onValueChange={v => update('disasterId', v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {availableDisasterIds.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fiscal Year */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fiscal Year</Label>
          <Select value={filters.fiscalYear} onValueChange={v => update('fiscalYear', v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {availableFiscalYears.map(fy => (
                <SelectItem key={fy} value={fy}>{fy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">State</Label>
          <Select value={filters.state} onValueChange={v => update('state', v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {availableStates.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Min */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Min Amount</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            placeholder="$0"
            value={filters.amountMin}
            onChange={e => update('amountMin', e.target.value)}
          />
        </div>

        {/* Amount Max */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Amount</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            placeholder="$∞"
            value={filters.amountMax}
            onChange={e => update('amountMax', e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</Label>
          <Select value={filters.category} onValueChange={v => update('category', v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {(['ROOM', 'TAX', 'PET', 'PARKING', 'OTHER_FEE', 'ADJUSTMENT', 'UNKNOWN'] as ChargeCategory[]).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Flags */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Flags</Label>
          <Select value={filters.flag} onValueChange={v => update('flag', v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="DUPLICATE_SUSPECTED">Duplicates</SelectItem>
              <SelectItem value="OFFSETS_PRESENT">Offsets</SelectItem>
              <SelectItem value="OVER_MAX_NIGHTLY_RATE">Over Max Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export { EMPTY_FILTERS };
