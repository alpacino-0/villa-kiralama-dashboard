// Mevsimsel fiyatlandırma (SeasonalPrice) tipleri ve tanımlamaları
import type { Database } from './supabase';

// Mevsimsel fiyat tanımı
export interface SeasonalPrice {
  id: string;
  villaId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  nightlyPrice: number;
  weeklyPrice: number | null;
  description: string | null;
  isActive: boolean;
}

// Mevsimsel fiyat oluşturma için gerekli bilgiler
export type SeasonalPriceCreate = Omit<SeasonalPrice, 'id'>;

// Mevsimsel fiyat güncelleme için kısmi bilgiler
export type SeasonalPriceUpdate = Partial<Omit<SeasonalPrice, 'id'>>;

// Supabase veritabanından Mevsimsel fiyat tipi
export type SeasonalPriceFromDB = Database['public']['Tables']['SeasonalPrice']['Row']; 