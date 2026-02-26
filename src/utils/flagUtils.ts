import { InvoiceFlag, InvoiceFlagDetail } from '@/types/invoice';

export interface FlagConfig {
  label: string;
  shortLabel: string;
  severity: 'critical' | 'review' | 'info';
  colorClass: string;
  bgClass: string;
}

export const FLAG_CONFIG: Record<InvoiceFlag, FlagConfig> = {
  DUPLICATE_SUSPECTED: {
    label: 'Duplicate Suspected',
    shortLabel: 'Duplicate',
    severity: 'critical',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  OVER_MAX_NIGHTLY_RATE: {
    label: 'Over Max Nightly Rate',
    shortLabel: 'Over Rate',
    severity: 'critical',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  OVER_MAX_RATE_PORTFOLIO: {
    label: 'Over Portfolio Rate',
    shortLabel: 'Over PF Rate',
    severity: 'critical',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  TOTAL_ASSISTANCE_CAP_EXCEEDED: {
    label: 'Cap Exceeded',
    shortLabel: 'Cap Exceeded',
    severity: 'critical',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  OVER_AUTHORIZED_NIGHTS: {
    label: 'Over Authorized Nights',
    shortLabel: 'Over Nights',
    severity: 'review',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10 text-warning border-warning/20',
  },
  DISALLOWED_CHARGE_CATEGORY: {
    label: 'Disallowed Charge',
    shortLabel: 'Bad Category',
    severity: 'review',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10 text-warning border-warning/20',
  },
  ROOM_TYPE_MISMATCH: {
    label: 'Room Type Mismatch',
    shortLabel: 'Room Mismatch',
    severity: 'review',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10 text-warning border-warning/20',
  },
  OFFSETS_PRESENT: {
    label: 'Offsets Present',
    shortLabel: 'Offsets',
    severity: 'info',
    colorClass: 'text-info',
    bgClass: 'bg-info/10 text-info border-info/20',
  },
};

// Sort flags by severity priority
const SEVERITY_ORDER: Record<string, number> = { critical: 0, review: 1, info: 2 };

export function sortFlagsBySeverity(flags: InvoiceFlag[]): InvoiceFlag[] {
  return [...flags].sort((a, b) => {
    const sa = SEVERITY_ORDER[FLAG_CONFIG[a].severity] ?? 9;
    const sb = SEVERITY_ORDER[FLAG_CONFIG[b].severity] ?? 9;
    return sa - sb;
  });
}

export function getDefaultTooltip(flag: InvoiceFlag): string {
  return FLAG_CONFIG[flag].label;
}

export function getFlagTooltip(flag: InvoiceFlag, details?: InvoiceFlagDetail[]): string {
  const detail = details?.find(d => d.flag === flag);
  return detail?.tooltip || getDefaultTooltip(flag);
}
