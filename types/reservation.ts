import { Database } from './supabase'

// Temel Reservation türü (database'den gelen)
export type ReservationRow = Database['public']['Tables']['Reservation']['Row']
export type ReservationInsert = Database['public']['Tables']['Reservation']['Insert']
export type ReservationUpdate = Database['public']['Tables']['Reservation']['Update']

// Enum türleri
export type PaymentType = Database['public']['Enums']['PaymentType']
export type ReservationStatus = Database['public']['Enums']['ReservationStatus']

// Genişletilmiş Reservation türü (ilişkili verilerle)
export type ReservationWithVilla = ReservationRow & {
  Villa?: {
    id: string
    title: string
    slug: string
    mainRegion: string
    subRegion: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    checkInTime: string
    checkOutTime: string
    minimumStay: number
  }
}

// Form verisi için tür
export type ReservationFormData = {
  bookingRef: string
  villaId: string
  startDate: string
  endDate: string
  guestCount: number
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  paymentType: PaymentType
  paymentMethod: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes?: string
}

// Rezervasyon oluşturma için tür
export type CreateReservationData = Omit<ReservationInsert, 'id' | 'createdAt' | 'updatedAt'>

// Rezervasyon güncelleme için tür
export type UpdateReservationData = Partial<ReservationUpdate>

// Rezervasyon filtreleme için tür
export type ReservationFilters = {
  villaId?: string
  status?: ReservationStatus
  startDate?: string
  endDate?: string
  customerEmail?: string
  bookingRef?: string
}

// Rezervasyon istatistikleri için tür
export type ReservationStats = {
  totalReservations: number
  pendingReservations: number
  confirmedReservations: number
  completedReservations: number
  cancelledReservations: number
  totalRevenue: number
  averageBookingValue: number
}

// Rezervasyon detayı için tür
export type ReservationDetail = ReservationWithVilla & {
  duration: number // kaç gece
  isExpired: boolean // tarihi geçmiş mi
  canCancel: boolean // iptal edilebilir mi
  daysUntilCheckIn: number // giriş tarihine kaç gün kaldı
  formattedAmount: string // formatlanmış tutar
}

// Rezervasyon takvim verisi için tür
export type ReservationCalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  status: ReservationStatus
  customerName: string
  guestCount: number
  villaTitle: string
}

// Ödeme durumu için tür
export type PaymentStatus = {
  isPaid: boolean
  paidAmount: number
  remainingAmount: number
  paymentPercentage: number
  nextPaymentDate?: string
}

// Rezervasyon doğrulama hataları için tür
export type ReservationValidationError = {
  field: string
  message: string
}

// Rezervasyon arama sonucu için tür
export type ReservationSearchResult = {
  reservations: ReservationWithVilla[]
  totalCount: number
  hasMore: boolean
} 