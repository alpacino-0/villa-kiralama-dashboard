import type { Database } from "./supabase";

export type VillaAmenity = Database["public"]["Tables"]["VillaAmenity"]["Row"];
export type VillaAmenityInsert = Database["public"]["Tables"]["VillaAmenity"]["Insert"];
export type VillaAmenityUpdate = Database["public"]["Tables"]["VillaAmenity"]["Update"]; 