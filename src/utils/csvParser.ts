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
  'description': 'description',
  'category': 'description',
  'date': 'lineDate',
  'data': 'lineDate',
  'transaction date': 'lineDate',
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

  // Helper: extract numeric prefix from invoice number (e.g. "123Charge" → "123", "456Tax" → "456")
  function extractGroupKey(invoiceNumber: string): string {
    const match = invoiceNumber.match(/^(\d+)/);
    return match ? match[1] : invoiceNumber;
  }

  // Helper: extract type suffix from invoice number (e.g. "123Charge" → "Charge", "456Tax" → "Tax")
  function extractTypeSuffix(invoiceNumber: string): string {
    const match = invoiceNumber.match(/^(\d+)(.+)$/);
    return match ? match[2].trim() : '';
  }

  // Determine if invoice numbers contain embedded type info (numeric prefix + word suffix)
  const hasEmbeddedType = !hasLineType && rawRows.some(({ row }) => {
    const inv = row.invoiceNumber || '';
    return /^\d+[a-zA-Z]/.test(inv);
  });

  // Aggregate rows by group key
  type AggregatedRow = { row: ParsedRow; indices: number[]; lineItems: { type: string; amount: number; description: string; date: string; guest: string; room: string }[]; dates: string[] };
  let aggregatedRows: AggregatedRow[];

  // Helper: map description text to a ChargeCategory
  function descriptionToCategory(desc: string): import('@/types/invoice').ChargeCategory {
    const d = desc.toLowerCase();
    if (d.includes('tax')) return 'TAX';
    if (d.includes('pet')) return 'PET';
    if (d.includes('parking')) return 'PARKING';
    if (d.includes('room') || d.includes('accommodation') || d.includes('lodging')) return 'ROOM';
    if (d.includes('adjust') || d.includes('credit') || d.includes('refund')) return 'ADJUSTMENT';
    if (d.includes('fee') || d.includes('service') || d.includes('resort')) return 'OTHER_FEE';
    return 'UNKNOWN';
  }

  if (hasLineType || hasEmbeddedType) {
    const groups = new Map<string, AggregatedRow>();
    for (const { row, index } of rawRows) {
      const rawInv = row.invoiceNumber || '';

      // Determine grouping key and line type
      let groupKey: string;
      let lineType: string;

      if (hasEmbeddedType) {
        groupKey = extractGroupKey(rawInv).toLowerCase();
        lineType = extractTypeSuffix(rawInv).toLowerCase();
      } else {
        groupKey = rawInv.toLowerCase() || `row-${index}`;
        lineType = (row.lineType || '').toLowerCase().trim();
      }

      // Use description column if available, falling back to lineType / suffix
      const description = row.description || lineType || 'Charge';

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { row: { ...row, invoiceNumber: hasEmbeddedType ? extractGroupKey(rawInv) : rawInv }, indices: [index], lineItems: [], dates: [] });
      } else {
        const group = groups.get(groupKey)!;
        group.indices.push(index);
        // Merge: fill in any missing non-amount fields from subsequent rows
        for (const [k, v] of Object.entries(row)) {
          if (k === 'lineType' || k === 'roomRate' || k === 'invoiceNumber' || k === 'description' || k === 'lineDate') continue;
          if (!group.row[k] && v) group.row[k] = v;
        }
      }

      const amount = parseFloat(row.roomRate) || 0;
      const group = groups.get(groupKey)!;

      // Collect dates for min/max calculation
      if (row.lineDate) {
        group.dates.push(row.lineDate);
      }

      // Determine category from description
      const category = descriptionToCategory(description);
      const isTax = category === 'TAX';

      // Store as a line item for proper breakdown
      group.lineItems.push({
        type: lineType,
        amount,
        description,
        date: row.lineDate || row.checkInDate || '',
        guest: row.guestNames || '',
        room: row.roomNumber || '',
      });

      if (isTax) {
        group.row._taxTotal = String((parseFloat(group.row._taxTotal || '0')) + amount);
      } else {
        group.row._chargeTotal = String((parseFloat(group.row._chargeTotal || '0')) + amount);
      }
    }

    // Finalize aggregated rows — derive check-in/check-out from date range
    aggregatedRows = Array.from(groups.values()).map(g => {
      g.row.roomRate = g.row._chargeTotal || '0';
      g.row.taxes = g.row._taxTotal || '0';
      delete g.row._chargeTotal;
      delete g.row._taxTotal;
      delete g.row.lineType;

      // Derive check-in / check-out from collected dates
      if (g.dates.length > 0) {
        const parsedDates = g.dates
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());
        if (parsedDates.length > 0) {
          if (!g.row.checkInDate) {
            g.row.checkInDate = parsedDates[0].toISOString().split('T')[0];
          }
          if (!g.row.checkOutDate) {
            g.row.checkOutDate = parsedDates[parsedDates.length - 1].toISOString().split('T')[0];
          }
        }
      }

      return g;
    });
  } else {
    aggregatedRows = rawRows.map(r => ({ row: r.row, indices: [r.index], lineItems: [], dates: [] }));
  }

  const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber.toLowerCase()));
  const seenNumbers = new Set<string>();

  const invoices: ParsedInvoice[] = [];
  let totalIssues = 0;
  let duplicates = 0;
  let missingFields = 0;

  for (const { row, indices, lineItems: aggregatedLineItems } of aggregatedRows) {
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

    // Build line items from aggregated data
    const builtLineItems: import('@/types/invoice').InvoiceLineItem[] = aggregatedLineItems.length > 0
      ? aggregatedLineItems.map((li, idx) => {
          const isTax = li.type.includes('tax');
          const liType: import('@/types/invoice').LineItemType = isTax ? 'Tax' : 'Charge';
          const desc = li.type
            ? li.type.charAt(0).toUpperCase() + li.type.slice(1)
            : 'Charge';
          return {
            id: `import-li-${Date.now()}-${rowDisplay}-${idx}`,
            date: li.date || row.checkInDate || new Date().toISOString().split('T')[0],
            type: liType,
            reference: `${row.invoiceNumber || 'IMP'}-${idx + 1}`,
            description: desc,
            guestName: li.guest || guests[0]?.name || '',
            amount: li.amount,
            room: li.room || row.roomNumber || '',
            category: isTax ? 'TAX' as const : 'ROOM' as const,
          };
        })
      : [];

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
      lineItems: builtLineItems,
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
