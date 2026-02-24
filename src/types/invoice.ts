export interface Guest {
  name: string;
  email?: string;
  phone?: string;
}

export type ChargeCategory = 'ROOM' | 'TAX' | 'PET' | 'PARKING' | 'OTHER_FEE' | 'ADJUSTMENT' | 'UNKNOWN';
export type LineItemType = 'Charge' | 'Tax' | 'Adjustment';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';
export type InvoiceFlag = 'DUPLICATE_SUSPECTED' | 'OFFSETS_PRESENT' | 'OVER_MAX_NIGHTLY_RATE';

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

  // Legacy fields (for backwards compat with old data)
  roomRate: number;
  taxes: number;
  additionalCharges: number;
  totalAmount: number;

  // Flags
  flags: InvoiceFlag[];
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
