import { Invoice, InvoiceLineItem } from '@/types/invoice';
import { normalizeCategory, calculateNights, computeInvoiceTotals } from '@/utils/financialControls';

function li(id: string, date: string, type: 'Charge' | 'Tax' | 'Adjustment', ref: string, desc: string, guest: string, amount: number, room?: string): InvoiceLineItem {
  return { id, date, type, reference: ref, description: desc, guestName: guest, amount, room, category: normalizeCategory(desc, type) };
}

function buildInvoice(base: Omit<Invoice, 'nights' | 'roomSubtotal' | 'taxSubtotal' | 'feesSubtotal' | 'adjustmentsSubtotal' | 'grossTotal' | 'netTotal' | 'ratePerNight' | 'flags' | 'roomRate' | 'taxes' | 'additionalCharges' | 'totalAmount'>): Invoice {
  const nights = calculateNights(base.checkInDate, base.checkOutDate);
  const totals = computeInvoiceTotals(base.lineItems, nights);
  return {
    ...base,
    nights,
    ...totals,
    totalAmount: totals.grossTotal,
    roomRate: totals.roomSubtotal,
    taxes: totals.taxSubtotal,
    additionalCharges: totals.feesSubtotal,
    flags: [],
  };
}

export const mockInvoices: Invoice[] = [
  buildInvoice({
    id: '1',
    hotelName: 'Grand Palace Hotel',
    hotelId: 'GPH001',
    invoiceNumber: 'INV-2024-001',
    roomNumber: '301',
    disasterId: '123-25',
    state: 'FL',
    checkInDate: '2024-12-01',
    checkOutDate: '2024-12-05',
    guests: [
      { name: 'John Smith', email: 'john.smith@email.com', phone: '+1 555-0101' },
      { name: 'Jane Smith', email: 'jane.smith@email.com' }
    ],
    numberOfGuests: 2,
    status: 'paid',
    submittedAt: '2024-12-05T10:30:00Z',
    createdAt: '2024-12-05T10:30:00Z',
    updatedAt: '2024-12-05T10:30:00Z',
    paymentMethod: 'Credit Card',
    bookingReference: 'BK-GPH-2024-1201',
    lineItems: [
      li('1-1', '2024-12-01', 'Charge', 'R301-1201', 'Room Rate - King Suite', 'John Smith', 112.50, '301'),
      li('1-2', '2024-12-02', 'Charge', 'R301-1202', 'Room Rate - King Suite', 'John Smith', 112.50, '301'),
      li('1-3', '2024-12-03', 'Charge', 'R301-1203', 'Room Rate - King Suite', 'John Smith', 112.50, '301'),
      li('1-4', '2024-12-04', 'Charge', 'R301-1204', 'Room Rate - King Suite', 'John Smith', 112.50, '301'),
      li('1-5', '2024-12-01', 'Tax', 'TAX-301', 'State Lodging Tax', 'John Smith', 45.00),
      li('1-6', '2024-12-01', 'Tax', 'TAX-301-OCC', 'Occupancy Tax', 'John Smith', 22.50),
      li('1-7', '2024-12-02', 'Charge', 'PET-301', 'Pet Fee', 'John Smith', 50.00, '301'),
      li('1-8', '2024-12-03', 'Charge', 'PKG-301', 'Parking Fee', 'John Smith', 75.00),
    ],
  }),
  buildInvoice({
    id: '2',
    hotelName: 'Oceanview Resort',
    hotelId: 'OVR002',
    invoiceNumber: 'INV-2024-002',
    roomNumber: '512',
    disasterId: '123-25',
    state: 'FL',
    checkInDate: '2024-12-03',
    checkOutDate: '2024-12-07',
    guests: [
      { name: 'Michael Johnson', email: 'm.johnson@email.com', phone: '+1 555-0202' }
    ],
    numberOfGuests: 1,
    status: 'pending',
    submittedAt: '2024-12-06T14:15:00Z',
    createdAt: '2024-12-06T14:15:00Z',
    updatedAt: '2024-12-06T14:15:00Z',
    bookingReference: 'BK-OVR-2024-1203',
    lineItems: [
      li('2-1', '2024-12-03', 'Charge', 'R512-1203', 'Room Rate - Ocean View', 'Michael Johnson', 80.00, '512'),
      li('2-2', '2024-12-04', 'Charge', 'R512-1204', 'Room Rate - Ocean View', 'Michael Johnson', 80.00, '512'),
      li('2-3', '2024-12-05', 'Charge', 'R512-1205', 'Room Rate - Ocean View', 'Michael Johnson', 80.00, '512'),
      li('2-4', '2024-12-06', 'Charge', 'R512-1206', 'Room Rate - Ocean View', 'Michael Johnson', 80.00, '512'),
      li('2-5', '2024-12-03', 'Tax', 'TAX-512', 'State Tourism Tax', 'Michael Johnson', 48.00),
      li('2-6', '2024-12-04', 'Charge', 'SVC-512', 'Internet Service Fee', 'Michael Johnson', 25.00),
      li('2-7', '2024-12-05', 'Charge', 'PARK-512', 'Parking Fee', 'Michael Johnson', 60.00),
    ],
  }),
  buildInvoice({
    id: '3',
    hotelName: 'Mountain Lodge',
    hotelId: 'MTL003',
    invoiceNumber: 'INV-2024-003',
    roomNumber: '205',
    disasterId: '456-24',
    state: 'TX',
    checkInDate: '2024-11-28',
    checkOutDate: '2024-12-02',
    guests: [
      { name: 'Sarah Williams', email: 's.williams@email.com' },
      { name: 'David Williams' },
      { name: 'Emma Williams' }
    ],
    numberOfGuests: 3,
    status: 'overdue',
    submittedAt: '2024-12-02T09:00:00Z',
    createdAt: '2024-12-02T09:00:00Z',
    updatedAt: '2024-12-02T09:00:00Z',
    notes: 'Family suite with extra bed',
    paymentMethod: 'Bank Transfer',
    bookingReference: 'BK-MTL-2024-1128',
    lineItems: [
      li('3-1', '2024-11-28', 'Charge', 'R205-1128', 'Room Rate - Family Suite', 'Sarah Williams', 145.00, '205'),
      li('3-2', '2024-11-29', 'Charge', 'R205-1129', 'Room Rate - Family Suite', 'Sarah Williams', 145.00, '205'),
      li('3-3', '2024-11-30', 'Charge', 'R205-1130', 'Room Rate - Family Suite', 'Sarah Williams', 145.00, '205'),
      li('3-4', '2024-12-01', 'Charge', 'R205-1201', 'Room Rate - Family Suite', 'Sarah Williams', 145.00, '205'),
      li('3-5', '2024-11-28', 'Tax', 'TAX-205', 'State Tax', 'Sarah Williams', 58.00),
      li('3-6', '2024-11-28', 'Tax', 'TAX-205-OCC', 'Occupancy Tax', 'Sarah Williams', 29.00),
      li('3-7', '2024-11-29', 'Charge', 'PET-205', 'Pet Fee', 'David Williams', 50.00),
      li('3-8', '2024-11-30', 'Charge', 'SVC-205', 'Laundry Service', 'Sarah Williams', 45.00),
      li('3-9', '2024-12-01', 'Charge', 'MB-205', 'Minibar', 'Emma Williams', 55.00),
      // Offset pair: charge then refund
      li('3-10', '2024-11-29', 'Charge', 'SPA-205', 'Resort Spa Service', 'Sarah Williams', 150.00),
      li('3-11', '2024-11-30', 'Adjustment', 'SPA-205', 'Resort Spa Service', 'Sarah Williams', -150.00),
    ],
  }),
  buildInvoice({
    id: '4',
    hotelName: 'City Center Inn',
    hotelId: 'CCI004',
    invoiceNumber: 'INV-2024-004',
    roomNumber: '108',
    disasterId: '456-24',
    state: 'TX',
    checkInDate: '2024-12-05',
    checkOutDate: '2024-12-06',
    guests: [
      { name: 'Robert Brown', email: 'r.brown@company.com', phone: '+1 555-0404' }
    ],
    numberOfGuests: 1,
    status: 'paid',
    submittedAt: '2024-12-06T08:00:00Z',
    createdAt: '2024-12-06T08:00:00Z',
    updatedAt: '2024-12-06T08:00:00Z',
    paymentMethod: 'Corporate Account',
    bookingReference: 'BK-CCI-2024-1205',
    lineItems: [
      li('4-1', '2024-12-05', 'Charge', 'R108-1205', 'Room Rate - Standard', 'Robert Brown', 150.00, '108'),
      li('4-2', '2024-12-05', 'Tax', 'TAX-108', 'State Lodging Tax', 'Robert Brown', 22.50),
    ],
  }),
  buildInvoice({
    id: '5',
    hotelName: 'Seaside Boutique Hotel',
    hotelId: 'SBH005',
    invoiceNumber: 'INV-2024-005',
    roomNumber: '401',
    disasterId: '789-25',
    state: 'CA',
    checkInDate: '2024-12-04',
    checkOutDate: '2024-12-08',
    guests: [
      { name: 'Emily Davis', email: 'emily.d@email.com' },
      { name: 'Chris Davis', phone: '+1 555-0505' }
    ],
    numberOfGuests: 2,
    status: 'pending',
    submittedAt: '2024-12-07T16:45:00Z',
    createdAt: '2024-12-07T16:45:00Z',
    updatedAt: '2024-12-07T16:45:00Z',
    notes: 'Honeymoon package with spa services',
    bookingReference: 'BK-SBH-2024-1204',
    lineItems: [
      li('5-1', '2024-12-04', 'Charge', 'R401-1204', 'Room Rate - Deluxe Suite', 'Emily Davis', 250.00, '401'),
      li('5-2', '2024-12-05', 'Charge', 'R401-1205', 'Room Rate - Deluxe Suite', 'Emily Davis', 250.00, '401'),
      li('5-3', '2024-12-06', 'Charge', 'R401-1206', 'Room Rate - Deluxe Suite', 'Emily Davis', 250.00, '401'),
      li('5-4', '2024-12-07', 'Charge', 'R401-1207', 'Room Rate - Deluxe Suite', 'Emily Davis', 250.00, '401'),
      li('5-5', '2024-12-04', 'Tax', 'TAX-401', 'State Tourism Tax', 'Emily Davis', 80.00),
      li('5-6', '2024-12-04', 'Tax', 'TAX-401-OCC', 'Occupancy Tax', 'Emily Davis', 28.00),
      li('5-7', '2024-12-05', 'Charge', 'SPA-401', 'Resort Spa Service', 'Emily Davis', 200.00),
      li('5-8', '2024-12-06', 'Charge', 'PARK-401', 'Parking Fee', 'Chris Davis', 100.00),
      li('5-9', '2024-12-07', 'Charge', 'MB-401', 'Minibar', 'Chris Davis', 50.00),
    ],
  }),
  // Duplicate of invoice 4 for testing duplicate detection
  buildInvoice({
    id: '6',
    hotelName: 'City Center Inn',
    hotelId: 'CCI004',
    invoiceNumber: 'INV-2024-006',
    roomNumber: '108',
    disasterId: '456-24',
    state: 'TX',
    checkInDate: '2024-12-05',
    checkOutDate: '2024-12-06',
    guests: [
      { name: 'Robert Brown', email: 'r.brown@company.com', phone: '+1 555-0404' }
    ],
    numberOfGuests: 1,
    status: 'paid',
    submittedAt: '2024-12-07T08:00:00Z',
    createdAt: '2024-12-07T08:00:00Z',
    updatedAt: '2024-12-07T08:00:00Z',
    paymentMethod: 'Corporate Account',
    bookingReference: 'BK-CCI-2024-1205-DUP',
    lineItems: [
      li('6-1', '2024-12-05', 'Charge', 'R108-1205', 'Room Rate - Standard', 'Robert Brown', 150.00, '108'),
      li('6-2', '2024-12-05', 'Tax', 'TAX-108', 'State Lodging Tax', 'Robert Brown', 22.50),
    ],
  }),
];
