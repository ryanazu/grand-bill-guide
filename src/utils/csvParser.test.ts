import { describe, it, expect } from 'vitest';
import { parseCSV } from '@/utils/csvParser';
import { mockInvoices } from '@/data/mockInvoices';

const sampleCSV = `Invoice #,Hotel Name,Hotel ID,Room,Check-in,Check-out,Guest Names,Guest Emails,Guest Phones,# Guests,Room Rate,Taxes,Additional,Total,Status,Payment,Booking Ref,Submitted,Notes
INV-2024-010,Riverside Inn,RVI010,204,2024-12-10,2024-12-14,Alice Monroe;Bob Monroe,alice@email.com;bob@email.com,+1 555-1010;+1 555-1011,2,380.00,57.00,45.00,482.00,paid,Credit Card,BK-RVI-2024-1210,2024-12-14T11:00:00Z,Anniversary trip
INV-2024-011,Skyline Tower Hotel,STH011,1802,2024-12-12,2024-12-15,Carlos Vega,carlos.v@email.com,+1 555-2020,1,600.00,90.00,150.00,840.00,pending,,BK-STH-2024-1212,2024-12-15T09:30:00Z,Executive suite
INV-2024-012,Lakeside Lodge,LSL012,7,2024-12-08,2024-12-11,Diana Park;Ethan Park;Lily Park,diana.p@email.com;;lily.p@email.com,+1 555-3030,,3,450.00,67.50,80.00,597.50,paid,Bank Transfer,BK-LSL-2024-1208,2024-12-11T14:00:00Z,Family cabin
INV-2024-001,Grand Palace Hotel,GPH001,301,2024-12-01,2024-12-05,John Smith;Jane Smith,john.smith@email.com;jane.smith@email.com,+1 555-0101,2,450.00,67.50,125.00,642.50,paid,Credit Card,BK-GPH-2024-1201,2024-12-05T10:30:00Z,Duplicate of existing
INV-2024-013,The Emerald Suites,TES013,510,2024-12-14,2024-12-18,Frank Osei,,,,280.00,42.00,0,322.00,overdue,,,2024-12-18T10:00:00Z,
INV-2024-014,,PLZ014,303,2024-12-15,,Grace Lin,grace@email.com,+1 555-5050,1,0,0,0,0,unknownstatus,Cash,,2024-12-16T08:00:00Z,Missing hotel name and checkout
INV-2024-015,Harbor View Hotel,HVH015,,,,Henry Adams;Irene Adams,henry@email.com;irene@email.com,+1 555-6060;+1 555-6061,2,520.00,78.00,200.00,798.00,pending,Credit Card,BK-HVH-2024-1220,2024-12-22T12:00:00Z,Missing room and dates
INV-2024-011,Skyline Tower Hotel,STH011,1802,2024-12-12,2024-12-15,Carlos Vega,carlos.v@email.com,+1 555-2020,1,600.00,90.00,150.00,840.00,pending,,BK-STH-2024-1212,2024-12-15T09:30:00Z,Duplicate within file`;

describe('CSV Parser', () => {
  it('parses correct number of rows', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    expect(result.invoices.length).toBe(8);
  });

  it('detects duplicate with existing data (INV-2024-001)', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const dup = result.invoices.find(i => i.invoice.invoiceNumber === 'INV-2024-001');
    expect(dup).toBeDefined();
    expect(dup!.issues.some(i => i.type === 'duplicate' && i.message === 'Invoice already exists')).toBe(true);
  });

  it('detects duplicate within file (second INV-2024-011)', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const dups = result.invoices.filter(i => i.invoice.invoiceNumber === 'INV-2024-011');
    expect(dups.length).toBe(2);
    expect(dups[1].issues.some(i => i.type === 'duplicate' && i.message === 'Duplicate in file')).toBe(true);
  });

  it('flags missing hotel name on row 6', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const row6 = result.invoices[5]; // INV-2024-014
    expect(row6.issues.some(i => i.field === 'hotelName' && i.type === 'missing')).toBe(true);
  });

  it('flags missing checkout date on row 6', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const row6 = result.invoices[5];
    expect(row6.issues.some(i => i.field === 'checkOutDate' && i.type === 'missing')).toBe(true);
  });

  it('flags missing room and dates on row 7', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const row7 = result.invoices[6]; // INV-2024-015
    expect(row7.issues.some(i => i.field === 'roomNumber' && i.type === 'missing')).toBe(true);
    expect(row7.issues.some(i => i.field === 'checkInDate' && i.type === 'missing')).toBe(true);
    expect(row7.issues.some(i => i.field === 'checkOutDate' && i.type === 'missing')).toBe(true);
  });

  it('flags invalid status on row 6', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const row6 = result.invoices[5];
    expect(row6.issues.some(i => i.field === 'status' && i.type === 'invalid')).toBe(true);
  });

  it('clean rows have no issues', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const clean = result.invoices.filter(i => i.issues.length === 0);
    expect(clean.length).toBe(3); // rows 1, 2, 3
  });

  it('parses multiple guests correctly', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    const row1 = result.invoices[0]; // Riverside Inn
    expect(row1.invoice.guests?.length).toBe(2);
    expect(row1.invoice.guests?.[0].name).toBe('Alice Monroe');
    expect(row1.invoice.guests?.[1].email).toBe('bob@email.com');
  });

  it('reports correct summary counts', () => {
    const result = parseCSV(sampleCSV, mockInvoices);
    expect(result.duplicates).toBe(2); // INV-2024-001 existing + INV-2024-011 in-file
    expect(result.missingFields).toBeGreaterThan(0);
  });
});
