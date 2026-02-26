import { PortfolioMatchStatus, PortfolioMatchMethod } from './portfolio';

export interface Guest {
  name: string;
  email?: string;
  phone?: string;
}

export type ChargeCategory = 'ROOM' | 'TAX' | 'PET' | 'PARKING' | 'OTHER_FEE' | 'ADJUSTMENT' | 'UNKNOWN';
export type LineItemType = 'Charge' | 'Tax' | 'Adjustment';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';
export type InvoiceFlag =
  | 'DUPLICATE_SUSPECTED'
  | 'OFFSETS_PRESENT'
  | 'OVER_MAX_NIGHTLY_RATE'
  | 'OVER_AUTHORIZED_NIGHTS'
  | 'OVER_MAX_RATE_PORTFOLIO'
  | 'ROOM_TYPE_MISMATCH'
  | 'DISALLOWED_CHARGE_CATEGORY'
  | 'TOTAL_ASSISTANCE_CAP_EXCEEDED';

export interface InvoiceFlagDetail {
  flag: InvoiceFlag;
  severity: 'critical' | 'review' | 'info';
  tooltip: string;
}

export interface InvoiceLineItem {
  id: string;
  date: string;
  type: LineItemType;
  reference: string;
  description: string;
  room?: string;
  guestName: string;
  amount: number;
  amountRaw?: string;
  category: ChargeCategory;
}

export interface OffsetPair {
  positive: InvoiceLineItem;
  negative: InvoiceLineItem;
}

export interface Invoice {
  id: string;
  hotelName: string;
  hotelId: string;
  invoiceNumber: string;
  roomNumber: string;
  disasterId: string;
  state: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: Guest[];
  numberOfGuests: number;
  bookingReference?: string;
  paymentMethod?: string;
  status: InvoiceStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Computed totals
  roomSubtotal: number;
  taxSubtotal: number;
  feesSubtotal: number;
  adjustmentsSubtotal: number;
  grossTotal: number;
  netTotal: number;
  ratePerNight: number;

  // Legacy fields
  roomRate: number;
  taxes: number;
  additionalCharges: number;
  totalAmount: number;

  // Flags
  flags: InvoiceFlag[];
  flagDetails?: InvoiceFlagDetail[];

  // Portfolio pairing
  portfolioId?: string | null;
  portfolioMatchStatus?: PortfolioMatchStatus;
  portfolioMatchMethod?: PortfolioMatchMethod;

  // Optional fields for matching
  clientId?: string;
  caseId?: string;
}

export interface InvoiceFormData {
  hotelName: string;
  invoiceNumber: string;
  roomNumber: string;
  disasterId: string;
  state: string;
  checkInDate: string;
  checkOutDate: string;
  guests: Guest[];
  numberOfGuests: number;
  roomRate: number;
  taxes: number;
  additionalCharges: number;
  notes?: string;
  paymentMethod?: string;
  bookingReference?: string;
}
