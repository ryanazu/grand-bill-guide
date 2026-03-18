import { Invoice, InvoiceLineItem, InvoiceFlag, InvoiceFlagDetail, ChargeCategory, OffsetPair } from '@/types/invoice';
import { FlagRule } from '@/types/flagRule';
import { differenceInDays } from 'date-fns';

// ─── Category Normalization ─────────────────────────────────────────────────

export function normalizeCategory(description: string, type: string): ChargeCategory {
  const desc = description.toLowerCase();
  const t = type.toLowerCase();

  if (t === 'adjustment' || desc.includes('adjust') || desc.includes('credit') || desc.includes('refund')) {
    return 'ADJUSTMENT';
  }
  if (t === 'tax' || desc.includes('tax') || desc.includes('lodging') || desc.includes('occupancy') || desc.includes('tourism') || desc.includes('state levy')) {
    return 'TAX';
  }
  if (desc.includes('room') || desc.includes('rate')) {
    return 'ROOM';
  }
  if (desc.includes('pet')) {
    return 'PET';
  }
  if (desc.includes('parking')) {
    return 'PARKING';
  }
  if (t === 'charge' && (desc.includes('fee') || desc.includes('service') || desc.includes('resort') || desc.includes('internet') || desc.includes('minibar') || desc.includes('laundry'))) {
    return 'OTHER_FEE';
  }
  if (t === 'charge') {
    return 'OTHER_FEE';
  }
  return 'UNKNOWN';
}

// ─── Nights Calculation ─────────────────────────────────────────────────────

export function calculateNights(checkIn: string, checkOut: string): number {
  const d = differenceInDays(new Date(checkOut), new Date(checkIn));
  return Math.max(d, 1);
}

// ─── Offset Pair Detection ──────────────────────────────────────────────────

export function detectOffsetPairs(lineItems: InvoiceLineItem[]): OffsetPair[] {
  const pairs: OffsetPair[] = [];
  const used = new Set<string>();

  for (let i = 0; i < lineItems.length; i++) {
    if (used.has(lineItems[i].id)) continue;
    for (let j = i + 1; j < lineItems.length; j++) {
      if (used.has(lineItems[j].id)) continue;

      const a = lineItems[i];
      const b = lineItems[j];

      if (
        a.reference === b.reference &&
        a.guestName === b.guestName &&
        a.description === b.description &&
        Math.abs(Math.abs(a.amount) - Math.abs(b.amount)) < 0.01 &&
        ((a.amount > 0 && b.amount < 0) || (a.amount < 0 && b.amount > 0))
      ) {
        const positive = a.amount > 0 ? a : b;
        const negative = a.amount < 0 ? a : b;
        pairs.push({ positive, negative });
        used.add(a.id);
        used.add(b.id);
        break;
      }
    }
  }

  return pairs;
}

// ─── Computed Totals ────────────────────────────────────────────────────────

export function computeInvoiceTotals(lineItems: InvoiceLineItem[], nights: number) {
  const roomSubtotal = lineItems.filter(li => li.category === 'ROOM').reduce((s, li) => s + li.amount, 0);
  const taxSubtotal = lineItems.filter(li => li.category === 'TAX').reduce((s, li) => s + li.amount, 0);
  const adjustmentsSubtotal = lineItems.filter(li => li.category === 'ADJUSTMENT').reduce((s, li) => s + li.amount, 0);
  const feesSubtotal = lineItems
    .filter(li => ['PET', 'PARKING', 'OTHER_FEE', 'UNKNOWN'].includes(li.category))
    .reduce((s, li) => s + li.amount, 0);

  const grossTotal = lineItems.reduce((s, li) => s + li.amount, 0);

  const offsetPairs = detectOffsetPairs(lineItems);
  const offsetIds = new Set(offsetPairs.flatMap(p => [p.positive.id, p.negative.id]));
  const netTotal = lineItems.filter(li => !offsetIds.has(li.id)).reduce((s, li) => s + li.amount, 0);

  // Rate per night is based on net total per user request
  const ratePerNight = nights > 0 && netTotal > 0 ? netTotal / nights : 0;

  return { roomSubtotal, taxSubtotal, feesSubtotal, adjustmentsSubtotal, grossTotal, netTotal, ratePerNight };
}

// ─── Duplicate Detection ────────────────────────────────────────────────────

export function detectDuplicates(invoices: Invoice[]): Set<string> {
  const duplicateIds = new Set<string>();

  for (let i = 0; i < invoices.length; i++) {
    for (let j = i + 1; j < invoices.length; j++) {
      const a = invoices[i];
      const b = invoices[j];

      if (
        a.hotelName.toLowerCase() === b.hotelName.toLowerCase() &&
        a.disasterId === b.disasterId &&
        a.state === b.state &&
        a.checkInDate === b.checkInDate &&
        a.checkOutDate === b.checkOutDate &&
        Math.abs(a.netTotal - b.netTotal) < 0.01 &&
        hasGuestOverlap(a.guests, b.guests)
      ) {
        duplicateIds.add(a.id);
        duplicateIds.add(b.id);
      }
    }
  }

  return duplicateIds;
}

function hasGuestOverlap(a: { name: string }[], b: { name: string }[]): boolean {
  const namesA = new Set(a.map(g => g.name.toLowerCase()));
  return b.some(g => namesA.has(g.name.toLowerCase()));
}

// ─── Apply Flags (uses user-defined FlagRules) ──────────────────────────────

export function applyFlags(invoices: Invoice[], maxRatePerNight: number, flagRules?: FlagRule[]): Invoice[] {
  // Pre-compute duplicates
  const duplicateIds = detectDuplicates(invoices);
  const duplicatePairs: Record<string, string[]> = {};
  for (let i = 0; i < invoices.length; i++) {
    for (let j = i + 1; j < invoices.length; j++) {
      const a = invoices[i];
      const b = invoices[j];
      if (duplicateIds.has(a.id) && duplicateIds.has(b.id) &&
        a.hotelName.toLowerCase() === b.hotelName.toLowerCase() &&
        a.checkInDate === b.checkInDate && a.checkOutDate === b.checkOutDate) {
        if (!duplicatePairs[a.id]) duplicatePairs[a.id] = [];
        if (!duplicatePairs[b.id]) duplicatePairs[b.id] = [];
        duplicatePairs[a.id].push(b.invoiceNumber);
        duplicatePairs[b.id].push(a.invoiceNumber);
      }
    }
  }

  // If no rules provided, use legacy hardcoded behavior
  if (!flagRules || flagRules.length === 0) {
    return invoices.map(inv => {
      const flags: InvoiceFlag[] = [];
      const flagDetails: InvoiceFlagDetail[] = [];

      if (duplicateIds.has(inv.id)) {
        flags.push('DUPLICATE_SUSPECTED');
        const matches = duplicatePairs[inv.id] || [];
        flagDetails.push({ flag: 'DUPLICATE_SUSPECTED', severity: 'critical', tooltip: `Duplicate match: ${matches.join(', ') || 'detected'}` });
      }

      const offsetPairs = detectOffsetPairs(inv.lineItems);
      if (offsetPairs.length > 0) {
        flags.push('OFFSETS_PRESENT');
        flagDetails.push({ flag: 'OFFSETS_PRESENT', severity: 'info', tooltip: `Offsets: ${offsetPairs.length} pair${offsetPairs.length !== 1 ? 's' : ''} net to $0` });
      }

      if (inv.ratePerNight > maxRatePerNight && inv.ratePerNight > 0) {
        flags.push('OVER_MAX_NIGHTLY_RATE');
        flagDetails.push({ flag: 'OVER_MAX_NIGHTLY_RATE', severity: 'critical', tooltip: `Rate: $${inv.ratePerNight.toFixed(0)} > $${maxRatePerNight}` });
      }

      return { ...inv, flags, flagDetails };
    });
  }

  // Apply user-defined flag rules
  const enabledRules = flagRules.filter(r => r.enabled);

  return invoices.map(inv => {
    const flags: InvoiceFlag[] = [];
    const flagDetails: InvoiceFlagDetail[] = [];

    for (const rule of enabledRules) {
      let triggered = false;
      let tooltip = rule.name;

      switch (rule.conditionType) {
        case 'duplicate_charges':
          if (duplicateIds.has(inv.id)) {
            triggered = true;
            const matches = duplicatePairs[inv.id] || [];
            tooltip = `Duplicate match: ${matches.join(', ') || 'detected'}`;
          }
          break;

        case 'rate_exceeds_threshold': {
          const threshold = rule.threshold ?? maxRatePerNight;
          if (inv.ratePerNight > threshold && inv.ratePerNight > 0) {
            triggered = true;
            tooltip = `Rate: $${inv.ratePerNight.toFixed(0)}/night > $${threshold} threshold`;
          }
          break;
        }

        case 'offset_pairs': {
          const offsetPairs = detectOffsetPairs(inv.lineItems);
          if (offsetPairs.length > 0) {
            triggered = true;
            tooltip = `Offsets: ${offsetPairs.length} pair${offsetPairs.length !== 1 ? 's' : ''} net to $0`;
          }
          break;
        }

        case 'category_present': {
          const cats = rule.categories || [];
          const found = cats.filter(cat => inv.lineItems.some(li => li.category === cat));
          if (found.length > 0) {
            triggered = true;
            tooltip = `Contains: ${found.join(', ')}`;
          }
          break;
        }

        case 'custom_keyword': {
          const keywords = rule.keywords || [];
          const matchedKw = keywords.filter(kw =>
            inv.lineItems.some(li => li.description.toLowerCase().includes(kw.toLowerCase()))
          );
          if (matchedKw.length > 0) {
            triggered = true;
            tooltip = `Keyword match: ${matchedKw.join(', ')}`;
          }
          break;
        }
      }

      if (triggered) {
        // Map rule to closest InvoiceFlag enum value
        const flagType = mapRuleToFlag(rule);
        if (!flags.includes(flagType)) {
          flags.push(flagType);
        }
        flagDetails.push({ flag: flagType, severity: rule.severity, tooltip });
      }
    }

    return { ...inv, flags, flagDetails };
  });
}

function mapRuleToFlag(rule: FlagRule): InvoiceFlag {
  switch (rule.conditionType) {
    case 'duplicate_charges': return 'DUPLICATE_SUSPECTED';
    case 'rate_exceeds_threshold': return 'OVER_MAX_NIGHTLY_RATE';
    case 'offset_pairs': return 'OFFSETS_PRESENT';
    case 'category_present': {
      const cats = rule.categories || [];
      if (cats.includes('PET') || cats.includes('PARKING')) return 'DISALLOWED_CHARGE_CATEGORY';
      return 'DISALLOWED_CHARGE_CATEGORY';
    }
    case 'custom_keyword': return 'DISALLOWED_CHARGE_CATEGORY';
    default: return 'DISALLOWED_CHARGE_CATEGORY';
  }
}
