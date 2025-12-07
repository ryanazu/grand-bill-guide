export interface Guest {
  name: string;
  email?: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  hotelName: string;
  hotelId: string;
  invoiceNumber: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guests: Guest[];
  numberOfGuests: number;
  roomRate: number;
  taxes: number;
  additionalCharges: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  submittedAt: string;
  notes?: string;
  paymentMethod?: string;
  bookingReference?: string;
}

export interface InvoiceFormData {
  hotelName: string;
  invoiceNumber: string;
  roomNumber: string;
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
