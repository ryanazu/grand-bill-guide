export type FlagConditionType =
  | 'rate_exceeds_threshold'
  | 'duplicate_charges'
  | 'category_present'
  | 'offset_pairs'
  | 'custom_keyword';

export type FlagSeverity = 'critical' | 'review' | 'info';

export interface FlagRule {
  id: string;
  name: string;
  shortLabel: string;
  conditionType: FlagConditionType;
  severity: FlagSeverity;
  enabled: boolean;
  /** For rate_exceeds_threshold: the dollar amount */
  threshold?: number;
  /** For category_present: which categories trigger this */
  categories?: string[];
  /** For custom_keyword: keywords to search in line item descriptions */
  keywords?: string[];
}

export const CONDITION_TYPE_LABELS: Record<FlagConditionType, string> = {
  rate_exceeds_threshold: 'Rate exceeds threshold',
  duplicate_charges: 'Duplicate charges detected',
  category_present: 'Specific charge category present',
  offset_pairs: 'Offset/reversal pairs present',
  custom_keyword: 'Line item contains keyword',
};

export const DEFAULT_FLAG_RULES: FlagRule[] = [
  {
    id: 'rule-duplicate',
    name: 'Duplicate Suspected',
    shortLabel: 'Duplicate',
    conditionType: 'duplicate_charges',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'rule-over-rate',
    name: 'Over Max Nightly Rate',
    shortLabel: 'Over Rate',
    conditionType: 'rate_exceeds_threshold',
    severity: 'critical',
    enabled: true,
    threshold: 200,
  },
  {
    id: 'rule-offsets',
    name: 'Offsets Present',
    shortLabel: 'Offsets',
    conditionType: 'offset_pairs',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-pet-charges',
    name: 'Pet Charges',
    shortLabel: 'Pet',
    conditionType: 'category_present',
    severity: 'review',
    enabled: true,
    categories: ['PET'],
  },
  {
    id: 'rule-parking',
    name: 'Parking Charges',
    shortLabel: 'Parking',
    conditionType: 'category_present',
    severity: 'review',
    enabled: true,
    categories: ['PARKING'],
  },
];
