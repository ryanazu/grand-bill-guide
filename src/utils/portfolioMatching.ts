import { Invoice, InvoiceFlag, InvoiceFlagDetail, ChargeCategory } from '@/types/invoice';
import { ClientPortfolio, PortfolioMatchStatus, PortfolioMatchMethod } from '@/types/portfolio';
import { calculateNights } from './financialControls';

// ─── Fuzzy name matching ────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  // Check if one contains the other (handles "John Smith" vs "John A. Smith")
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check last name match + first initial
  const partsA = na.split(' ');
  const partsB = nb.split(' ');
  if (partsA.length >= 2 && partsB.length >= 2) {
    const lastA = partsA[partsA.length - 1];
    const lastB = partsB[partsB.length - 1];
    if (lastA === lastB && partsA[0][0] === partsB[0][0]) return true;
  }
  return false;
}

// ─── Date overlap check ─────────────────────────────────────────────────────

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd).getTime();
  return a0 < b1 && b0 < a1;
}

// ─── Auto-matching ──────────────────────────────────────────────────────────

export interface MatchResult {
  portfolioId: string;
  status: PortfolioMatchStatus;
  method: PortfolioMatchMethod;
}

export function findBestMatch(invoice: Invoice, portfolios: ClientPortfolio[]): MatchResult | null {
  // Filter to same disaster/state
  const candidates = portfolios.filter(p =>
    p.disasterId === invoice.disasterId && p.state === invoice.state
  );

  for (const p of candidates) {
    // Priority 1: DIRECT_ID
    if (invoice.clientId && p.clientId && invoice.clientId === p.clientId) {
      return { portfolioId: p.portfolioId, status: 'MATCHED', method: 'DIRECT_ID' };
    }
    if (invoice.caseId && p.caseId && invoice.caseId === p.caseId) {
      return { portfolioId: p.portfolioId, status: 'MATCHED', method: 'DIRECT_ID' };
    }
  }

  for (const p of candidates) {
    // Priority 2: BOOKING_REFERENCE
    if (invoice.bookingReference && p.bookingReference && invoice.bookingReference === p.bookingReference) {
      return { portfolioId: p.portfolioId, status: 'MATCHED', method: 'BOOKING_REFERENCE' };
    }
  }

  for (const p of candidates) {
    // Priority 3: NAME + DATE + HOTEL fallback
    const primaryGuest = invoice.guests[0]?.name;
    const anyGuestMatch = invoice.guests.some(g => namesMatch(g.name, p.primaryGuestName));
    if (!anyGuestMatch) continue;

    const overlap = datesOverlap(
      invoice.checkInDate, invoice.checkOutDate,
      p.authorizedCheckInDate, p.authorizedCheckOutDate
    );
    if (!overlap) continue;

    // If portfolio specifies hotel, check match
    if (p.authorizedHotelName) {
      const hotelMatch = invoice.hotelName.toLowerCase().includes(p.authorizedHotelName.toLowerCase()) ||
        p.authorizedHotelName.toLowerCase().includes(invoice.hotelName.toLowerCase());
      if (!hotelMatch) continue;
    }

    return { portfolioId: p.portfolioId, status: 'POSSIBLE_MATCH', method: 'NAME_DATE_HOTEL' };
  }

  return null;
}

// ─── Portfolio comparison flags ─────────────────────────────────────────────

export function computePortfolioFlags(invoice: Invoice, portfolio: ClientPortfolio, globalMaxRate: number): InvoiceFlagDetail[] {
  const details: InvoiceFlagDetail[] = [];

  // 1) OVER_AUTHORIZED_NIGHTS
  if (invoice.nights > portfolio.authorizedNights) {
    details.push({
      flag: 'OVER_AUTHORIZED_NIGHTS',
      severity: 'review',
      tooltip: `Authorized: ${portfolio.authorizedNights} nights, billed: ${invoice.nights}`,
    });
  }

  // 2) OVER_MAX_RATE (portfolio override)
  const effectiveMaxRate = portfolio.maxRatePerNight ?? globalMaxRate;
  if (invoice.ratePerNight > effectiveMaxRate && invoice.ratePerNight > 0) {
    details.push({
      flag: 'OVER_MAX_RATE_PORTFOLIO',
      severity: 'critical',
      tooltip: `Rate: $${invoice.ratePerNight.toFixed(0)} > $${effectiveMaxRate} (portfolio limit)`,
    });
  }

  // 3) DISALLOWED_CHARGE_CATEGORY
  if (portfolio.allowedChargeCategories && portfolio.allowedChargeCategories.length > 0) {
    const allowed = new Set(portfolio.allowedChargeCategories);
    const disallowed = new Set<ChargeCategory>();
    for (const li of invoice.lineItems) {
      if (li.amount > 0 && !allowed.has(li.category) && li.category !== 'UNKNOWN') {
        disallowed.add(li.category);
      }
    }
    if (disallowed.size > 0) {
      details.push({
        flag: 'DISALLOWED_CHARGE_CATEGORY',
        severity: 'review',
        tooltip: `Disallowed: ${[...disallowed].join(', ')}`,
      });
    }
  }

  // 4) TOTAL_ASSISTANCE_CAP_EXCEEDED
  if (portfolio.totalAssistanceCap && invoice.netTotal > portfolio.totalAssistanceCap) {
    details.push({
      flag: 'TOTAL_ASSISTANCE_CAP_EXCEEDED',
      severity: 'critical',
      tooltip: `Net $${invoice.netTotal.toFixed(0)} exceeds cap $${portfolio.totalAssistanceCap}`,
    });
  }

  return details;
}

// ─── Apply portfolio matching to all invoices ───────────────────────────────

export function applyPortfolioMatching(
  invoices: Invoice[],
  portfolios: ClientPortfolio[],
  globalMaxRate: number
): Invoice[] {
  return invoices.map(inv => {
    // If already manually matched, keep it
    if (inv.portfolioId && inv.portfolioMatchMethod === 'MANUAL') {
      const portfolio = portfolios.find(p => p.portfolioId === inv.portfolioId);
      if (portfolio) {
        const pfFlags = computePortfolioFlags(inv, portfolio, globalMaxRate);
        const existingBase = (inv.flagDetails || []).filter(d =>
          !(['OVER_AUTHORIZED_NIGHTS', 'OVER_MAX_RATE_PORTFOLIO', 'DISALLOWED_CHARGE_CATEGORY', 'TOTAL_ASSISTANCE_CAP_EXCEEDED'] as InvoiceFlag[]).includes(d.flag)
        );
        const allDetails = [...existingBase, ...pfFlags];
        const newFlags = [...new Set([...inv.flags.filter(f => !(['OVER_AUTHORIZED_NIGHTS', 'OVER_MAX_RATE_PORTFOLIO', 'DISALLOWED_CHARGE_CATEGORY', 'TOTAL_ASSISTANCE_CAP_EXCEEDED'] as InvoiceFlag[]).includes(f)), ...pfFlags.map(d => d.flag)])];
        return { ...inv, flags: newFlags, flagDetails: allDetails };
      }
      return inv;
    }

    const match = findBestMatch(inv, portfolios);
    if (!match) {
      return { ...inv, portfolioId: null, portfolioMatchStatus: 'UNMATCHED' as const };
    }

    const portfolio = portfolios.find(p => p.portfolioId === match.portfolioId)!;
    const pfFlags = computePortfolioFlags(inv, portfolio, globalMaxRate);

    const existingBase = (inv.flagDetails || []).filter(d =>
      !(['OVER_AUTHORIZED_NIGHTS', 'OVER_MAX_RATE_PORTFOLIO', 'DISALLOWED_CHARGE_CATEGORY', 'TOTAL_ASSISTANCE_CAP_EXCEEDED'] as InvoiceFlag[]).includes(d.flag)
    );
    const allDetails = [...existingBase, ...pfFlags];
    const portfolioFlagNames = pfFlags.map(d => d.flag);
    const existingFlags = inv.flags.filter(f =>
      !(['OVER_AUTHORIZED_NIGHTS', 'OVER_MAX_RATE_PORTFOLIO', 'DISALLOWED_CHARGE_CATEGORY', 'TOTAL_ASSISTANCE_CAP_EXCEEDED'] as InvoiceFlag[]).includes(f)
    );

    return {
      ...inv,
      portfolioId: match.portfolioId,
      portfolioMatchStatus: match.status,
      portfolioMatchMethod: match.method,
      flags: [...new Set([...existingFlags, ...portfolioFlagNames])],
      flagDetails: allDetails,
    };
  });
}
