import { Database } from './supabase';

// Customer tablosu için tip tanımları
export type Customer = Database['public']['Tables']['Customer']['Row'];
export type CustomerInsert = Database['public']['Tables']['Customer']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['Customer']['Update'];

// Customer status enum tipi
export type CustomerStatus = Database['public']['Enums']['CustomerStatus'];

// Customer status değerleri
export const CUSTOMER_STATUS = {
  NEW: 'NEW' as const,
  CONTACTED: 'CONTACTED' as const,
  INTERESTED: 'INTERESTED' as const,
  BOOKED: 'BOOKED' as const,
  CLOSED: 'CLOSED' as const,
  LOST: 'LOST' as const,
} as const;

// Customer status için label mapping
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  NEW: 'Yeni',
  CONTACTED: 'İletişime Geçildi',
  INTERESTED: 'İlgileniyor',
  BOOKED: 'Rezervasyon Yaptı',
  CLOSED: 'Kapandı',
  LOST: 'Kaybedildi',
};

// Customer status için renk mapping (Tailwind CSS sınıfları)
export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  INTERESTED: 'bg-purple-100 text-purple-800',
  BOOKED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
};

// Customer form validasyonu için interface
export interface CustomerFormData {
  fullname: string;
  email: string;
  phone?: string;
  identityNumber?: string;
  interestedVillaId?: string;
  note?: string;
  status: CustomerStatus;
}

// Customer listesi için extended interface (villa bilgileri dahil)
export interface CustomerWithVilla extends Customer {
  interestedVilla?: {
    id: string;
    title: string;
    mainRegion: string;
    subRegion: string;
  } | null;
}

// Customer arama filtreleri
export interface CustomerFilters {
  status?: CustomerStatus;
  villaId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Customer istatistikleri
export interface CustomerStats {
  total: number;
  byStatus: Record<CustomerStatus, number>;
  newThisMonth: number;
  conversionRate: number;
} 