import type { Database } from './supabase';

export type VillaTag = Database['public']['Tables']['VillaTag']['Row'];
export type NewVillaTag = Database['public']['Tables']['VillaTag']['Insert'];
export type UpdateVillaTag = Database['public']['Tables']['VillaTag']['Update']; 