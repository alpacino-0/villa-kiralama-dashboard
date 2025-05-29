import { Database } from './supabase'

// Tablo tanımı - Supabase ile uyumlu
export type Region = Database['public']['Tables']['Region']['Row']

// Insert işlemi için tip - zorunlu olmayan alanları isteğe bağlı yapar
export type RegionInsert = Database['public']['Tables']['Region']['Insert']

// Update işlemi için tip - tüm alanları isteğe bağlı yapar
export type RegionUpdate = Database['public']['Tables']['Region']['Update']

// Standalone tip tanımı (Supabase entegrasyonu olmadan kullanmak için)
export interface RegionData {
  id: string;
  name: string;
  isMainRegion: boolean;
  parentId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  isPromoted: boolean;
  slug: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
}

// Şema doğrulama için kullanılabilecek türler
export type RegionWithChildren = RegionData & {
  children?: RegionWithChildren[];
}

// Ana ve alt bölgeler için özel tipler
export type MainRegion = RegionData & {
  isMainRegion: true;
  parentId: null;
}

export type SubRegion = RegionData & {
  isMainRegion: false;
  parentId: string;
} 