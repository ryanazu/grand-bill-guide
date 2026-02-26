import { ClientPortfolio } from '@/types/portfolio';
import { calculateNights } from '@/utils/financialControls';

function buildPortfolio(base: Omit<ClientPortfolio, 'authorizedNights'>): ClientPortfolio {
  return {
    ...base,
    authorizedNights: calculateNights(base.authorizedCheckInDate, base.authorizedCheckOutDate),
  };
}

export const mockPortfolios: ClientPortfolio[] = [
  buildPortfolio({
    portfolioId: 'PF-001',
    disasterId: '123-25',
    state: 'FL',
    clientId: 'RC-2024-1001',
    primaryGuestName: 'John Smith',
    householdSize: 2,
    bookingReference: 'BK-GPH-2024-1201',
    authorizedHotelName: 'Grand Palace Hotel',
    authorizedCheckInDate: '2024-12-01',
    authorizedCheckOutDate: '2024-12-05',
    authorizedRoomType: 'DOUBLE',
    maxRatePerNight: 150,
    allowedChargeCategories: ['ROOM', 'TAX', 'PARKING'],
    totalAssistanceCap: 1000,
    assistanceType: 'lodging',
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-11-28T10:00:00Z',
  }),
  buildPortfolio({
    portfolioId: 'PF-002',
    disasterId: '123-25',
    state: 'FL',
    primaryGuestName: 'Michael Johnson',
    bookingReference: 'BK-OVR-2024-1203',
    authorizedCheckInDate: '2024-12-03',
    authorizedCheckOutDate: '2024-12-07',
    maxRatePerNight: 100,
    allowedChargeCategories: ['ROOM', 'TAX'],
    assistanceType: 'lodging',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  }),
  buildPortfolio({
    portfolioId: 'PF-003',
    disasterId: '456-24',
    state: 'TX',
    clientId: 'RC-2024-2003',
    caseId: 'CASE-TX-001',
    primaryGuestName: 'Sarah Williams',
    householdSize: 3,
    bookingReference: 'BK-MTL-2024-1128',
    authorizedHotelName: 'Mountain Lodge',
    authorizedCheckInDate: '2024-11-28',
    authorizedCheckOutDate: '2024-12-01', // only 3 nights authorized, invoice has 4
    authorizedRoomType: 'DOUBLE',
    maxRatePerNight: 160,
    allowedChargeCategories: ['ROOM', 'TAX', 'PET'],
    totalAssistanceCap: 800,
    assistanceType: 'lodging',
    createdAt: '2024-11-25T10:00:00Z',
    updatedAt: '2024-11-25T10:00:00Z',
  }),
  buildPortfolio({
    portfolioId: 'PF-004',
    disasterId: '789-25',
    state: 'CA',
    primaryGuestName: 'Emily Davis',
    authorizedCheckInDate: '2024-12-04',
    authorizedCheckOutDate: '2024-12-07', // 3 nights authorized, invoice has 4
    maxRatePerNight: 200,
    allowedChargeCategories: ['ROOM', 'TAX'],
    totalAssistanceCap: 1500,
    assistanceType: 'lodging',
    createdAt: '2024-12-02T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  }),
];
