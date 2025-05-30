// Villa veri tipleri ve tanımlamaları
import type { Database } from './supabase';

// Villa durumu için enum
export enum VillaStatus {
  ACTIVE = 'ACTIVE',   // Villa aktif ve kiralanabilir
  INACTIVE = 'INACTIVE' // Villa geçici olarak kiralamaya kapalı
}

// Villa tipi tanımı
export interface Villa {
  id: string;
  title: string;
  description: string;
  slug: string;
  mainRegion: string;
  subRegion: string;
  regionId: string;
  subRegionId: string;
  deposit: number;
  cleaningFee: number | null;
  shortStayDayLimit: number | null;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  minimumStay: number;
  rules: string[];
  tags: string[];
  embedCode: string | null;
  status: VillaStatus;
  isPromoted: boolean;
  createdAt: string;
  updatedAt: string;
  advancePaymentRate: number;
  checkInNotes: string | null;
  checkOutNotes: string | null;
  cancellationNotes: string | null;
}

// Villa oluşturma için gerekli minimum bilgiler
export type VillaCreate = Omit<Villa, 'id' | 'createdAt' | 'updatedAt'>;

// Villa güncelleme için kısmi bilgiler
export type VillaUpdate = Partial<Omit<Villa, 'id' | 'createdAt' | 'updatedAt'>>;

// Supabase veritabanından Villa tipi 
export type VillaFromDB = Database['public']['Tables']['Villa']['Row'];

// Villa listesi için özet tip
export interface VillaSummary {
  id: string;
  title: string;
  slug: string;
  mainRegion: string;
  subRegion: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  status: VillaStatus;
  isPromoted: boolean;
}

// Villa arama filtreleri için tip
export interface VillaFilters {
  regionId?: string;
  subRegionId?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minGuests?: number;
  maxGuests?: number;
  minStay?: number;
  tags?: string[];
  status?: VillaStatus;
  isPromoted?: boolean;
} 