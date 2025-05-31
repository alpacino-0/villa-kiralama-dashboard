"use client"

import { createClient } from "@supabase/supabase-js"
import type { Villa, VillaFilters, VillaUpdate, VillaCreate } from "@/types/villa"
import type { Database } from "@/types/supabase"

// Supabase istemcisini oluşturma
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * Villa veri servisi
 * Villa tablosu için CRUD işlemlerini sağlar
 */
export const villaService = {
  /**
   * Tüm villaları listeler
   * @returns Villa listesi
   */
  async listVillas(): Promise<Villa[]> {
    const { data, error } = await supabase
      .from("Villa")
      .select("*")
      .order("createdAt", { ascending: false })

    if (error) {
      console.error("Villalar alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa[]
  },

  /**
   * Filtrelere göre villaları listeler
   * @param filters Villa filtreleri
   * @returns Filtrelenmiş villa listesi
   */
  async filterVillas(filters: VillaFilters): Promise<Villa[]> {
    let query = supabase.from("Villa").select("*")

    // Filtreleri uygula
    if (filters.regionId) {
      query = query.eq("regionId", filters.regionId)
    }

    if (filters.subRegionId) {
      query = query.eq("subRegionId", filters.subRegionId)
    }

    if (filters.minBedrooms) {
      query = query.gte("bedrooms", filters.minBedrooms)
    }

    if (filters.maxBedrooms) {
      query = query.lte("bedrooms", filters.maxBedrooms)
    }

    if (filters.minBathrooms) {
      query = query.gte("bathrooms", filters.minBathrooms)
    }

    if (filters.maxBathrooms) {
      query = query.lte("bathrooms", filters.maxBathrooms)
    }

    if (filters.minGuests) {
      query = query.gte("maxGuests", filters.minGuests)
    }

    if (filters.maxGuests) {
      query = query.lte("maxGuests", filters.maxGuests)
    }

    if (filters.minStay) {
      query = query.gte("minimumStay", filters.minStay)
    }

    // Tag filtreleme artık Villa_Tag junction tablosu üzerinden yapılıyor
    // Tag filtreleme için getVillasByTags() fonksiyonunu kullanın

    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.isPromoted !== undefined) {
      query = query.eq("isPromoted", filters.isPromoted)
    }

    // Sonuçları sırala
    query = query.order("createdAt", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Villalar filtrelenirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa[]
  },

  /**
   * Bir villayı ID'ye göre getirir
   * @param id Villa ID
   * @returns Villa
   */
  async getVilla(id: string): Promise<Villa | null> {
    const { data, error } = await supabase
      .from("Villa")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Villa bulunamadı
        return null
      }

      console.error("Villa alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa
  },

  /**
   * Bir villayı Slug'a göre getirir
   * @param slug Villa Slug
   * @returns Villa
   */
  async getVillaBySlug(slug: string): Promise<Villa | null> {
    const { data, error } = await supabase
      .from("Villa")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Villa bulunamadı
        return null
      }

      console.error("Villa Slug ile alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa
  },

  /**
   * Yeni bir villa oluşturur
   * @param villa Oluşturulacak villa
   * @returns Oluşturulan villa
   */
  async createVilla(villa: VillaCreate): Promise<{id: string}> {
    const { data, error } = await supabase
      .from("Villa")
      .insert([villa])
      .select('id')
      .single()

    if (error) {
      console.error("Villa oluşturulurken hata oluştu:", error)
      throw new Error(error.message)
    }

    return { id: data.id }
  },

  /**
   * Bir villayı günceller
   * @param id Villa ID
   * @param updates Güncellenecek alanlar
   * @returns Güncellenen villa
   */
  async updateVilla(id: string, updates: VillaUpdate): Promise<Villa> {
    // Güncelleme zamanını ayarla
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("Villa")
      .update(updatedData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Villa güncellenirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa
  },

  /**
   * Bir villayı siler
   * @param id Villa ID
   * @returns Başarılı mı?
   */
  async deleteVilla(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("Villa")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Villa silinirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return true
  },

  /**
   * Bir villanın promosyon durumunu değiştirir
   * @param id Villa ID
   * @param isPromoted Promosyon durumu
   * @returns Güncellenen villa
   */
  async togglePromotion(id: string, isPromoted: boolean): Promise<Villa> {
    const { data, error } = await supabase
      .from("Villa")
      .update({ isPromoted, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Villa promosyonu değiştirilirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa
  },

  /**
   * Bir villanın durumunu değiştirir
   * @param id Villa ID
   * @param status Yeni durum
   * @returns Güncellenen villa
   */
  async changeStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Villa> {
    const { data, error } = await supabase
      .from("Villa")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Villa durumu değiştirilirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as Villa
  },

  /**
   * Bir villanın öğesini diğer ilişkili tablolarla birlikte getirir
   * @param id Villa ID
   * @returns Detaylı villa bilgisi
   */
  async getVillaWithRelations(id: string): Promise<Villa | null> {
    // Villa bilgilerini ve ilişkili diğer tablolardan bilgileri getir
    const { data, error } = await supabase
      .from("Villa")
      .select(`
        *,
        Region!regionId (*),
        Region!subRegionId (*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Villa bulunamadı
        return null
      }

      console.error("Villa ilişkileri ile alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as unknown as Villa
  },

  /**
   * Tag'lere göre villaları listeler
   * @param tagIds Tag ID'leri
   * @returns Tag'li villa listesi
   */
  async getVillasByTags(tagIds: string[]): Promise<Villa[]> {
    if (!tagIds || tagIds.length === 0) {
      return await this.listVillas();
    }

    // Villa_Tag junction tablosu üzerinden tag'e sahip villa ID'lerini al
    const { data: villaTagData, error: villaTagError } = await supabase
      .from("Villa_Tag")
      .select("villaId")
      .in("tagId", tagIds);

    if (villaTagError) {
      console.error("Villa tag ilişkileri alınırken hata oluştu:", villaTagError);
      throw new Error(villaTagError.message);
    }

    if (!villaTagData || villaTagData.length === 0) {
      return [];
    }

    // Benzersiz villa ID'lerini al
    const villaIds = [...new Set(villaTagData.map(item => item.villaId))];

    // Villa'ları getir
    const { data, error } = await supabase
      .from("Villa")
      .select("*")
      .in("id", villaIds)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Tag'li villalar alınırken hata oluştu:", error);
      throw new Error(error.message);
    }

    return data as Villa[];
  },

  /**
   * Villa etiket ilişkilerini temizler
   * @param villaId Villa ID
   * @returns Başarılı mı?
   */
  async clearVillaTags(villaId: string): Promise<boolean> {
    const { error } = await supabase
      .from("Villa_Tag")
      .delete()
      .eq("villaId", villaId);

    if (error) {
      console.error("Villa etiketleri temizlenirken hata oluştu:", error);
      throw new Error(error.message);
    }

    return true;
  },

  /**
   * Bir villa'nın tag'lerini getirir
   * @param villaId Villa ID
   * @returns Villa'nın tag'leri
   */
  async getVillaTags(villaId: string): Promise<Array<{id: string, name: string}>> {
    // İki ayrı sorgu ile tag'leri al (tip güvenliği için)
    const { data: villaTagData, error: villaTagError } = await supabase
      .from("Villa_Tag")
      .select("tagId")
      .eq("villaId", villaId);

    if (villaTagError) {
      console.error("Villa tag ilişkileri alınırken hata oluştu:", villaTagError);
      throw new Error(villaTagError.message);
    }

    if (!villaTagData || villaTagData.length === 0) {
      return [];
    }

    const tagIds = villaTagData.map(item => item.tagId);

    const { data: tagData, error: tagError } = await supabase
      .from("VillaTag")
      .select("id, name")
      .in("id", tagIds);

    if (tagError) {
      console.error("Tag'ler alınırken hata oluştu:", tagError);
      throw new Error(tagError.message);
    }

    return tagData || [];
  },

  /**
   * Villa'ya tag'ler ekler
   * @param villaId Villa ID
   * @param tagIds Tag ID'leri
   * @returns Başarılı mı?
   */
  async addVillaTags(villaId: string, tagIds: string[]): Promise<boolean> {
    if (!tagIds || tagIds.length === 0) {
      return true;
    }

    const villaTagInserts = tagIds.map(tagId => ({
      villaId,
      tagId
    }));

    const { error } = await supabase
      .from("Villa_Tag")
      .insert(villaTagInserts);

    if (error) {
      console.error("Villa tag'leri eklenirken hata oluştu:", error);
      throw new Error(error.message);
    }

    return true;
  }
} 