import type { Database } from './supabase'

// Supabase ile uyumlu tablo tipi 
export type VillaImage = Database['public']['Tables']['VillaImage']['Row']

// Yeni bir VillaImage eklemek için kullanılacak tip
export type VillaImageInsert = Database['public']['Tables']['VillaImage']['Insert']

// VillaImage güncellemek için kullanılacak tip
export type VillaImageUpdate = Database['public']['Tables']['VillaImage']['Update']

// Standalone tip tanımı (Supabase entegrasyonu olmadan kullanmak için)
export interface VillaImageData {
  id: string
  villaId: string
  imageUrl: string
  title: string | null
  altText: string | null
  order: number
  isCoverImage: boolean
  createdAt: string
}

// Villa ile ilişkili resim listesini getirmek için kullanılabilecek genişletilmiş tip
export interface VillaImageWithVillaData extends VillaImageData {
  villa?: {
    title: string
    slug: string
  }
} 