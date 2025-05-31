import { Database } from './supabase'

// Supabase VillaSEO table types
export type VillaSEO = Database['public']['Tables']['VillaSEO']['Row']
export type VillaSEOInsert = Database['public']['Tables']['VillaSEO']['Insert']
export type VillaSEOUpdate = Database['public']['Tables']['VillaSEO']['Update']

// Custom VillaSEO interfaces for better type safety and usage
export interface VillaSEOWithVilla extends VillaSEO {
  Villa?: {
    id: string
    title: string
    slug: string
  }
}

// VillaSEO form data interface for frontend forms
export interface VillaSEOFormData {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  noIndex: boolean
}

// VillaSEO creation payload
export interface CreateVillaSEOPayload extends VillaSEOFormData {
  villaId: string
}

// VillaSEO update payload
export interface UpdateVillaSEOPayload extends Partial<VillaSEOFormData> {
  id: string
}

// Meta tag helper interface
export interface MetaTags {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  noIndex?: boolean
}

// SEO validation interface
export interface SEOValidation {
  isValid: boolean
  errors: {
    metaTitle?: string[]
    metaDescription?: string[]
    metaKeywords?: string[]
    ogTitle?: string[]
    ogDescription?: string[]
  }
} 