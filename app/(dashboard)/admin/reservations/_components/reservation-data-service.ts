"use client"

import { createClient } from "@supabase/supabase-js"
import type { 
  ReservationRow, 
  ReservationUpdate,
  ReservationWithVilla,
  CreateReservationData,
  ReservationFilters,
  ReservationStats,
  ReservationStatus
} from "@/types/reservation"
import type { Database } from "@/types/supabase"

// Supabase istemcisini oluşturma
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * Rezervasyon veri servisi
 * Reservation tablosu için CRUD işlemlerini sağlar
 */
export const reservationService = {
  /**
   * Tüm rezervasyonları listeler
   * @returns Rezervasyon listesi
   */
  async listReservations(): Promise<ReservationWithVilla[]> {
    const { data, error } = await supabase
      .from("Reservation")
      .select(`
        *,
        Villa:villaId (
          id,
          title,
          slug,
          mainRegion,
          subRegion,
          maxGuests,
          bedrooms,
          bathrooms,
          checkInTime,
          checkOutTime,
          minimumStay
        )
      `)
      .order("createdAt", { ascending: false })

    if (error) {
      console.error("Rezervasyonlar alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationWithVilla[]
  },

  /**
   * Filtrelere göre rezervasyonları listeler
   * @param filters Rezervasyon filtreleri
   * @returns Filtrelenmiş rezervasyon listesi
   */
  async filterReservations(filters: ReservationFilters): Promise<ReservationWithVilla[]> {
    let query = supabase
      .from("Reservation")
      .select(`
        *,
        Villa:villaId (
          id,
          title,
          slug,
          mainRegion,
          subRegion,
          maxGuests,
          bedrooms,
          bathrooms,
          checkInTime,
          checkOutTime,
          minimumStay
        )
      `)

    // Filtreleri uygula
    if (filters.villaId) {
      query = query.eq("villaId", filters.villaId)
    }

    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.startDate) {
      query = query.gte("startDate", filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte("endDate", filters.endDate)
    }

    if (filters.customerEmail) {
      query = query.ilike("customerEmail", `%${filters.customerEmail}%`)
    }

    if (filters.bookingRef) {
      query = query.ilike("bookingRef", `%${filters.bookingRef}%`)
    }

    // Sonuçları sırala
    query = query.order("createdAt", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Rezervasyonlar filtrelenirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationWithVilla[]
  },

  /**
   * Bir rezervasyonu ID'ye göre getirir
   * @param id Rezervasyon ID
   * @returns Rezervasyon
   */
  async getReservation(id: string): Promise<ReservationWithVilla | null> {
    const { data, error } = await supabase
      .from("Reservation")
      .select(`
        *,
        Villa:villaId (
          id,
          title,
          slug,
          mainRegion,
          subRegion,
          maxGuests,
          bedrooms,
          bathrooms,
          checkInTime,
          checkOutTime,
          minimumStay
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Rezervasyon bulunamadı
        return null
      }

      console.error("Rezervasyon alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationWithVilla
  },

  /**
   * Booking referansına göre rezervasyon getirir
   * @param bookingRef Booking referansı
   * @returns Rezervasyon
   */
  async getReservationByBookingRef(bookingRef: string): Promise<ReservationWithVilla | null> {
    const { data, error } = await supabase
      .from("Reservation")
      .select(`
        *,
        Villa:villaId (
          id,
          title,
          slug,
          mainRegion,
          subRegion,
          maxGuests,
          bedrooms,
          bathrooms,
          checkInTime,
          checkOutTime,
          minimumStay
        )
      `)
      .eq("bookingRef", bookingRef)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Rezervasyon bulunamadı
        return null
      }

      console.error("Rezervasyon booking ref ile alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationWithVilla
  },

  /**
   * Yeni bir rezervasyon oluşturur
   * @param reservation Oluşturulacak rezervasyon
   * @returns Oluşturulan rezervasyon
   */
  async createReservation(reservation: CreateReservationData): Promise<{ id: string }> {
    // Booking referansının benzersiz olduğunu kontrol et
    const existingReservation = await this.getReservationByBookingRef(reservation.bookingRef)
    if (existingReservation) {
      throw new Error("Bu booking referansı zaten kullanılıyor")
    }

    const { data, error } = await supabase
      .from("Reservation")
      .insert([reservation])
      .select('id')
      .single()

    if (error) {
      console.error("Rezervasyon oluşturulurken hata oluştu:", error)
      throw new Error(error.message)
    }

    return { id: data.id }
  },

  /**
   * Bir rezervasyonu günceller
   * @param id Rezervasyon ID
   * @param updates Güncellenecek alanlar
   * @returns Güncellenen rezervasyon
   */
  async updateReservation(id: string, updates: ReservationUpdate): Promise<ReservationRow> {
    // Güncelleme zamanını ayarla
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("Reservation")
      .update(updatedData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Rezervasyon güncellenirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationRow
  },

  /**
   * Bir rezervasyonu siler
   * @param id Rezervasyon ID
   */
  async deleteReservation(id: string): Promise<void> {
    const { error } = await supabase
      .from("Reservation")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Rezervasyon silinirken hata oluştu:", error)
      throw new Error(error.message)
    }
  },

  /**
   * Rezervasyon durumunu günceller
   * @param id Rezervasyon ID
   * @param status Yeni durum
   * @param cancellationReason İptal nedeni (opsiyonel)
   */
  async updateReservationStatus(
    id: string, 
    status: ReservationStatus, 
    cancellationReason?: string
  ): Promise<void> {
    const updateData: ReservationUpdate = {
      status,
      updatedAt: new Date().toISOString(),
    }

    // Eğer iptal ediliyorsa, iptal tarihini ve nedenini ekle
    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date().toISOString()
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason
      }
    }

    const { error } = await supabase
      .from("Reservation")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Rezervasyon durumu güncellenirken hata oluştu:", error)
      throw new Error(error.message)
    }
  },

  /**
   * Rezervasyon istatistiklerini hesaplar
   * @returns Rezervasyon istatistikleri
   */
  async getReservationStats(): Promise<ReservationStats> {
    const { data, error } = await supabase
      .from("Reservation")
      .select("status, totalAmount")

    if (error) {
      console.error("Rezervasyon istatistikleri alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    const reservations = data as Pick<ReservationRow, 'status' | 'totalAmount'>[]

    const stats: ReservationStats = {
      totalReservations: reservations.length,
      pendingReservations: reservations.filter(r => r.status === 'PENDING').length,
      confirmedReservations: reservations.filter(r => r.status === 'CONFIRMED').length,
      completedReservations: reservations.filter(r => r.status === 'COMPLETED').length,
      cancelledReservations: reservations.filter(r => r.status === 'CANCELLED').length,
      totalRevenue: reservations
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.totalAmount, 0),
      averageBookingValue: 0
    }

    if (stats.totalReservations > 0) {
      const totalRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0)
      stats.averageBookingValue = totalRevenue / stats.totalReservations
    }

    return stats
  },

  /**
   * Villa için belirli tarih aralığında rezervasyon var mı kontrol eder
   * @param villaId Villa ID
   * @param startDate Başlangıç tarihi
   * @param endDate Bitiş tarihi
   * @param excludeReservationId Hariç tutulacak rezervasyon ID (güncelleme için)
   * @returns Boolean
   */
  async checkReservationConflict(
    villaId: string,
    startDate: string,
    endDate: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    let query = supabase
      .from("Reservation")
      .select("id")
      .eq("villaId", villaId)
      .neq("status", "CANCELLED")
      .or(`startDate.lte.${endDate},endDate.gte.${startDate}`)

    if (excludeReservationId) {
      query = query.neq("id", excludeReservationId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Rezervasyon çakışması kontrol edilirken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data.length > 0
  },

  /**
   * Yaklaşan rezervasyonları getirir (7 gün içinde)
   * @returns Yaklaşan rezervasyonlar
   */
  async getUpcomingReservations(): Promise<ReservationWithVilla[]> {
    const today = new Date()
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from("Reservation")
      .select(`
        *,
        Villa:villaId (
          id,
          title,
          slug,
          mainRegion,
          subRegion,
          maxGuests,
          bedrooms,
          bathrooms,
          checkInTime,
          checkOutTime,
          minimumStay
        )
      `)
      .eq("status", "CONFIRMED")
      .gte("startDate", today.toISOString())
      .lte("startDate", sevenDaysLater.toISOString())
      .order("startDate", { ascending: true })

    if (error) {
      console.error("Yaklaşan rezervasyonlar alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data as ReservationWithVilla[]
  },

  /**
   * Tüm villaları dropdown için getirir
   * @returns Villa listesi
   */
  async getVillasForDropdown(): Promise<Array<{ id: string; title: string }>> {
    const { data, error } = await supabase
      .from("Villa")
      .select("id, title")
      .eq("status", "ACTIVE")
      .order("title", { ascending: true })

    if (error) {
      console.error("Villalar dropdown için alınırken hata oluştu:", error)
      throw new Error(error.message)
    }

    return data
  }
} 