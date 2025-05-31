import type { Database } from './supabase';

export type VillaTagRelation = Database['public']['Tables']['Villa_Tag']['Row'];
export type NewVillaTagRelation = Database['public']['Tables']['Villa_Tag']['Insert'];
export type UpdateVillaTagRelation = Database['public']['Tables']['Villa_Tag']['Update']; 