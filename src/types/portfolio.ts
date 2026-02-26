import { ChargeCategory } from './invoice';

export type RoomType = 'SINGLE' | 'DOUBLE' | 'OTHER' | 'UNKNOWN';
export type PortfolioMatchStatus = 'MATCHED' | 'UNMATCHED' | 'POSSIBLE_MATCH';
export type PortfolioMatchMethod = 'DIRECT_ID' | 'BOOKING_REFERENCE' | 'NAME_DATE_HOTEL' | 'MANUAL';

export interface ClientPortfolio {
  // Identifiers
  portfolioId: string;
  disasterId: string;
  state: string;
  clientId?: string;
  caseId?: string;
  bookingReference?: string;

  // Client info
  primaryGuestName: string;
  householdSize?: number;
  notes?: string;

  // Authorized lodging rules
  authorizedHotelName?: string;
  authorizedCheckInDate: string;
  authorizedCheckOutDate: string;
  authorizedNights: number; // computed
  authorizedRoomType?: RoomType;
  maxRatePerNight?: number;
  allowedChargeCategories?: ChargeCategory[];
  totalAssistanceCap?: number;

  // Financial assistance summary
  assistanceType?: string;
  assistanceAmountAuthorized?: number;
  assistanceAmountDisbursed?: number;

  createdAt: string;
  updatedAt: string;
}

export interface PortfolioFormData {
  disasterId: string;
  state: string;
  primaryGuestName: string;
  authorizedCheckInDate: string;
  authorizedCheckOutDate: string;
  clientId?: string;
  caseId?: string;
  bookingReference?: string;
  authorizedHotelName?: string;
  authorizedRoomType?: RoomType;
  maxRatePerNight?: number;
  allowedChargeCategories?: ChargeCategory[];
  totalAssistanceCap?: number;
  householdSize?: number;
  notes?: string;
}
