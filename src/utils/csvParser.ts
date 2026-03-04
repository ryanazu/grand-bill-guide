import { Invoice, Guest } from '@/types/invoice';

interface ParsedRow {
  [key: string]: string;
}

interface ValidationIssue {
  row: number;
  field: string;
  type: 'missing' | 'duplicate' | 'invalid';
  message: string;
}

export interface ParsedInvoice {
  invoice: Partial<Invoice>;
  rowIndex: number;
  issues: ValidationIssue[];
}

export interface ParseResult {
  invoices: ParsedInvoice[];
  totalIssues: number;
  duplicates: number;
  missingFields: number;
}

const REQUIRED_FIELDS = ['invoiceNumber', 'hotelName', 'roomNumber', 'checkInDate', 'checkOutDate', 'roomRate'];

const COLUMN_MAP: Record<string, string> = {
  'invoice #': 'invoiceNumber',
  'invoice number': 'invoiceNumber',
  'invoicenumber': 'invoiceNumber',
  'inv #': 'invoiceNumber',
  'hotel name': 'hotelName',
  'hotelname': 'hotelName',
  'hotel': 'hotelName',
  'hotel id': 'hotelId',
  'hotelid': 'hotelId',
  'room': 'roomNumber',
  'room number': 'roomNumber',
  'roomnumber': 'roomNumber',
  'room #': 'roomNumber',
  'check-in': 'checkInDate',
  'checkin': 'checkInDate',
  'check in': 'checkInDate',
  'check-in date': 'checkInDate',
  'checkindate': 'checkInDate',
  'check_in': 'checkInDate',
  'check-out': 'checkOutDate',
  'checkout': 'checkOutDate',
  'check out': 'checkOutDate',
  'check-out date': 'checkOutDate',
  'checkoutdate': 'checkOutDate',
  'check_out': 'checkOutDate',
  'type': 'lineType',
  'guest names': 'guestNames',
  'guest name': 'guestNames',
  'guests': 'guestNames',
  'guest emails': 'guestEmails',
  'guest email': 'guestEmails',
  'emails': 'guestEmails',
  'guest phones': 'guestPhones',
  'guest phone': 'guestPhones',
  'phones': 'guestPhones',
  '# guests': 'numberOfGuests',
  'num guests': 'numberOfGuests',
  'number of guests': 'numberOfGuests',
  'room rate': 'roomRate',
  'roomrate': 'roomRate',
  'rate': 'roomRate',
  'taxes': 'taxes',
  'tax': 'taxes',
  'additional': 'additionalCharges',
  'additional charges': 'additionalCharges',
  'extras': 'additionalCharges',
  'total': 'totalAmount',
  'total amount': 'totalAmount',
  'totalamount': 'totalAmount',
  'status': 'status',
  'payment': 'paymentMethod',
  'payment method': 'paymentMethod',
  'booking ref': 'bookingReference',
  'booking reference': 'bookingReference',
  'reference': 'bookingReference',
  'submitted': 'submittedAt',
  'submitted at': 'submittedAt',
  'notes': 'notes',
  'disaster id': 'disasterId',
  'disaster': 'disasterId',
  'disasterid': 'disasterId',
  'state': 'state',
};

function mapColumnName(header: string): string | null {
  const normalized = header.trim().toLowerCase().replace(/['"]/g, '');
  return COLUMN_MAP[normalized] || null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseGuests(names: string, emails?: string, phones?: string): Guest[] {
  const nameList = names ? names.split(';').map(n => n.trim()).filter(Boolean) : [];
  const emailList = emails ? emails.split(';').map(e => e.trim()).filter(Boolean) : [];
  const phoneList = phones ? phones.split(';').map(p => p.trim()).filter(Boolean) : [];

  if (nameList.length === 0) return [];

  return nameList.map((name, i) => ({
    name,
    email: emailList[i] || undefined,
    phone: phoneList[i] || undefined,
  }));
}

export function parseCSV(content: string, existingInvoices: Invoice[]): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { invoices: [], totalIssues: 1, duplicates: 0, missingFields: 0 };
  }

  const headers = parseCSVLine(lines[0]);
  const mappedHeaders = headers.map(mapColumnName);

  const hasLineType = mappedHeaders.includes('lineType');

  // Parse all rows into raw data
  const rawRows: { row: ParsedRow; index: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: ParsedRow = {};
    mappedHeaders.forEach((mapped, idx) => {
      if (mapped && values[idx]) {
        row[mapped] = values[idx].replace(/^["']|["']$/g, '');
      }
    });
    rawRows.push({ row, index: i });
  }

  // If file has a "Type" column (Charge/Tax), aggregate rows by invoice number
  type AggregatedRow = { row: ParsedRow; indices: number[] };
  let aggregatedRows: AggregatedRow[];

  if (hasLineType) {
    const groups = new Map<string, AggregatedRow>();
    for (const { row, index } of rawRows) {
      const key = row.invoiceNumber?.toLowerCase() || `row-${index}`;
      if (!groups.has(key)) {
        // Start with the first row's data as base
        groups.set(key, { row: { ...row }, indices: [index] });
      } else {
        const group = groups.get(key)!;
        group.indices.push(index);
        // Merge: fill in any missing fields from subsequent rows
        for (const [k, v] of Object.entries(row)) {
          if (k === 'lineType' || k === 'roomRate') continue; // handle separately
          if (!group.row[k] && v) group.row[k] = v;
        }
      }

      const lineType = (row.lineType || '').toLowerCase().trim();
      const amount = parseFloat(row.roomRate) || 0;
      const group = groups.get(key)!;

      if (lineType === 'tax') {
        group.row._taxTotal = String((parseFloat(group.row._taxTotal || '0')) + amount);
      } else {
        // "Charge" or any other type → roomRate
        group.row._chargeTotal = String((parseFloat(group.row._chargeTotal || '0')) + amount);
      }
    }

    // Finalize aggregated rows
    aggregatedRows = Array.from(groups.values()).map(g => {
      g.row.roomRate = g.row._chargeTotal || '0';
      g.row.taxes = g.row._taxTotal || '0';
      delete g.row._chargeTotal;
      delete g.row._taxTotal;
      delete g.row.lineType;
      return g;
    });
  } else {
    aggregatedRows = rawRows.map(r => ({ row: r.row, indices: [r.index] }));
  }

  const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber.toLowerCase()));
  const seenNumbers = new Set<string>();

  const invoices: ParsedInvoice[] = [];
  let totalIssues = 0;
  let duplicates = 0;
  let missingFields = 0;

  for (const { row, indices } of aggregatedRows) {
    const issues: ValidationIssue[] = [];
    const rowDisplay = indices[0];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field].trim() === '') {
        issues.push({ row: rowDisplay, field, type: 'missing', message: `Missing ${field}` });
        missingFields++;
      }
    }

    // Check duplicates
    const invNum = row.invoiceNumber?.toLowerCase();
    if (invNum) {
      if (existingNumbers.has(invNum)) {
        issues.push({ row: rowDisplay, field: 'invoiceNumber', type: 'duplicate', message: 'Invoice already exists' });
        duplicates++;
      } else if (seenNumbers.has(invNum)) {
        issues.push({ row: rowDisplay, field: 'invoiceNumber', type: 'duplicate', message: 'Duplicate in file' });
        duplicates++;
      }
      seenNumbers.add(invNum);
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'overdue'];
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      issues.push({ row: rowDisplay, field: 'status', type: 'invalid', message: `Invalid status: ${row.status}` });
    }

    const guests = parseGuests(row.guestNames || '', row.guestEmails, row.guestPhones);
    const roomRate = parseFloat(row.roomRate) || 0;
    const taxes = parseFloat(row.taxes) || 0;
    const additionalCharges = parseFloat(row.additionalCharges) || 0;
    const totalAmount = row.totalAmount ? parseFloat(row.totalAmount) : roomRate + taxes + additionalCharges;

    const invoice: Partial<Invoice> = {
      id: `import-${Date.now()}-${rowDisplay}`,
      invoiceNumber: row.invoiceNumber || '',
      hotelName: row.hotelName || '',
      hotelId: row.hotelId || '',
      roomNumber: row.roomNumber || '',
      disasterId: row.disasterId || '',
      state: row.state || '',
      checkInDate: row.checkInDate || '',
      checkOutDate: row.checkOutDate || '',
      guests: guests.length > 0 ? guests : [{ name: '' }],
      numberOfGuests: parseInt(row.numberOfGuests) || guests.length || 1,
      roomRate,
      taxes,
      additionalCharges,
      totalAmount,
      status: (validStatuses.includes(row.status?.toLowerCase()) ? row.status.toLowerCase() : 'pending') as Invoice['status'],
      submittedAt: row.submittedAt || new Date().toISOString(),
      notes: row.notes,
      paymentMethod: row.paymentMethod,
      bookingReference: row.bookingReference,
    };

    totalIssues += issues.length;
    invoices.push({ invoice, rowIndex: rowDisplay, issues });
  }

  return { invoices, totalIssues, duplicates, missingFields };
}

// Mock PDF parser - extracts text-like data from PDF
export function parsePDFMock(filename: string): ParseResult {
  // In a real app, you'd use a PDF parsing library or backend service
  // This mock generates sample data to demonstrate the flow
  const mockInvoice: ParsedInvoice = {
    invoice: {
      id: `import-pdf-${Date.now()}`,
      invoiceNumber: `PDF-${filename.replace(/\.[^/.]+$/, '').slice(0, 10)}`,
      hotelName: '',
      hotelId: '',
      roomNumber: '',
      checkInDate: '',
      checkOutDate: '',
      guests: [{ name: '' }],
      numberOfGuests: 1,
      roomRate: 0,
      taxes: 0,
      additionalCharges: 0,
      totalAmount: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    },
    rowIndex: 1,
    issues: [
      { row: 1, field: 'hotelName', type: 'missing', message: 'Missing hotelName' },
      { row: 1, field: 'roomNumber', type: 'missing', message: 'Missing roomNumber' },
      { row: 1, field: 'checkInDate', type: 'missing', message: 'Missing checkInDate' },
      { row: 1, field: 'checkOutDate', type: 'missing', message: 'Missing checkOutDate' },
      { row: 1, field: 'roomRate', type: 'missing', message: 'Missing roomRate' },
    ],
  };

  return {
    invoices: [mockInvoice],
    totalIssues: 5,
    duplicates: 0,
    missingFields: 5,
  };
}
