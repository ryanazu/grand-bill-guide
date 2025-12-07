import { Invoice } from '@/types/invoice';

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    hotelName: 'Grand Palace Hotel',
    hotelId: 'GPH001',
    invoiceNumber: 'INV-2024-001',
    roomNumber: '301',
    checkInDate: '2024-12-01',
    checkOutDate: '2024-12-05',
    guests: [
      { name: 'John Smith', email: 'john.smith@email.com', phone: '+1 555-0101' },
      { name: 'Jane Smith', email: 'jane.smith@email.com' }
    ],
    numberOfGuests: 2,
    roomRate: 450.00,
    taxes: 67.50,
    additionalCharges: 125.00,
    totalAmount: 642.50,
    status: 'paid',
    submittedAt: '2024-12-05T10:30:00Z',
    paymentMethod: 'Credit Card',
    bookingReference: 'BK-GPH-2024-1201'
  },
  {
    id: '2',
    hotelName: 'Oceanview Resort',
    hotelId: 'OVR002',
    invoiceNumber: 'INV-2024-002',
    roomNumber: '512',
    checkInDate: '2024-12-03',
    checkOutDate: '2024-12-07',
    guests: [
      { name: 'Michael Johnson', email: 'm.johnson@email.com', phone: '+1 555-0202' }
    ],
    numberOfGuests: 1,
    roomRate: 320.00,
    taxes: 48.00,
    additionalCharges: 85.00,
    totalAmount: 453.00,
    status: 'pending',
    submittedAt: '2024-12-06T14:15:00Z',
    bookingReference: 'BK-OVR-2024-1203'
  },
  {
    id: '3',
    hotelName: 'Mountain Lodge',
    hotelId: 'MTL003',
    invoiceNumber: 'INV-2024-003',
    roomNumber: '205',
    checkInDate: '2024-11-28',
    checkOutDate: '2024-12-02',
    guests: [
      { name: 'Sarah Williams', email: 's.williams@email.com' },
      { name: 'David Williams' },
      { name: 'Emma Williams' }
    ],
    numberOfGuests: 3,
    roomRate: 580.00,
    taxes: 87.00,
    additionalCharges: 200.00,
    totalAmount: 867.00,
    status: 'overdue',
    submittedAt: '2024-12-02T09:00:00Z',
    notes: 'Family suite with extra bed',
    paymentMethod: 'Bank Transfer',
    bookingReference: 'BK-MTL-2024-1128'
  },
  {
    id: '4',
    hotelName: 'City Center Inn',
    hotelId: 'CCI004',
    invoiceNumber: 'INV-2024-004',
    roomNumber: '108',
    checkInDate: '2024-12-05',
    checkOutDate: '2024-12-06',
    guests: [
      { name: 'Robert Brown', email: 'r.brown@company.com', phone: '+1 555-0404' }
    ],
    numberOfGuests: 1,
    roomRate: 150.00,
    taxes: 22.50,
    additionalCharges: 0,
    totalAmount: 172.50,
    status: 'paid',
    submittedAt: '2024-12-06T08:00:00Z',
    paymentMethod: 'Corporate Account',
    bookingReference: 'BK-CCI-2024-1205'
  },
  {
    id: '5',
    hotelName: 'Seaside Boutique Hotel',
    hotelId: 'SBH005',
    invoiceNumber: 'INV-2024-005',
    roomNumber: '401',
    checkInDate: '2024-12-04',
    checkOutDate: '2024-12-08',
    guests: [
      { name: 'Emily Davis', email: 'emily.d@email.com' },
      { name: 'Chris Davis', phone: '+1 555-0505' }
    ],
    numberOfGuests: 2,
    roomRate: 720.00,
    taxes: 108.00,
    additionalCharges: 350.00,
    totalAmount: 1178.00,
    status: 'pending',
    submittedAt: '2024-12-07T16:45:00Z',
    notes: 'Honeymoon package with spa services',
    bookingReference: 'BK-SBH-2024-1204'
  }
];
