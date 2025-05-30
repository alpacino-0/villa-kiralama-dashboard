export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Region: {
        Row: {
          id: string
          name: string
          isMainRegion: boolean
          parentId: string | null
          description: string | null
          createdAt: string
          updatedAt: string
          imageUrl: string | null
          isPromoted: boolean
          slug: string | null
          isActive: boolean
          metaTitle: string | null
          metaDesc: string | null
        }
        Insert: {
          id?: string
          name: string
          isMainRegion?: boolean
          parentId?: string | null
          description?: string | null
          createdAt?: string
          updatedAt?: string
          imageUrl?: string | null
          isPromoted?: boolean
          slug?: string | null
          isActive?: boolean
          metaTitle?: string | null
          metaDesc?: string | null
        }
        Update: {
          id?: string
          name?: string
          isMainRegion?: boolean
          parentId?: string | null
          description?: string | null
          createdAt?: string
          updatedAt?: string
          imageUrl?: string | null
          isPromoted?: boolean
          slug?: string | null
          isActive?: boolean
          metaTitle?: string | null
          metaDesc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_parentid_fkey"
            columns: ["parentId"]
            referencedRelation: "Region"
            referencedColumns: ["id"]
          }
        ]
      },
      Villa: {
        Row: {
          id: string
          title: string
          description: string
          slug: string
          mainRegion: string
          subRegion: string
          regionId: string
          subRegionId: string
          deposit: number
          cleaningFee: number | null
          shortStayDayLimit: number | null
          bedrooms: number
          bathrooms: number
          maxGuests: number
          checkInTime: string
          checkOutTime: string
          minimumStay: number
          rules: string[]
          tags: string[]
          embedCode: string | null
          status: "ACTIVE" | "INACTIVE"
          isPromoted: boolean
          createdAt: string
          updatedAt: string
          advancePaymentRate: number
          checkInNotes: string | null
          checkOutNotes: string | null
          cancellationNotes: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          slug: string
          mainRegion: string
          subRegion: string
          regionId: string
          subRegionId: string
          deposit: number
          cleaningFee?: number | null
          shortStayDayLimit?: number | null
          bedrooms: number
          bathrooms: number
          maxGuests: number
          checkInTime?: string
          checkOutTime?: string
          minimumStay?: number
          rules: string[]
          tags: string[]
          embedCode?: string | null
          status?: "ACTIVE" | "INACTIVE"
          isPromoted?: boolean
          createdAt?: string
          updatedAt?: string
          advancePaymentRate?: number
          checkInNotes?: string | null
          checkOutNotes?: string | null
          cancellationNotes?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          slug?: string
          mainRegion?: string
          subRegion?: string
          regionId?: string
          subRegionId?: string
          deposit?: number
          cleaningFee?: number | null
          shortStayDayLimit?: number | null
          bedrooms?: number
          bathrooms?: number
          maxGuests?: number
          checkInTime?: string
          checkOutTime?: string
          minimumStay?: number
          rules?: string[]
          tags?: string[]
          embedCode?: string | null
          status?: "ACTIVE" | "INACTIVE"
          isPromoted?: boolean
          createdAt?: string
          updatedAt?: string
          advancePaymentRate?: number
          checkInNotes?: string | null
          checkOutNotes?: string | null
          cancellationNotes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "villa_regionid_fkey"
            columns: ["regionId"]
            referencedRelation: "Region"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "villa_subregionid_fkey"
            columns: ["subRegionId"]
            referencedRelation: "Region"
            referencedColumns: ["id"]
          }
        ]
      },
      VillaImage: {
        Row: {
          id: string
          villaId: string
          imageUrl: string
          title: string | null
          altText: string | null
          order: number
          isCoverImage: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          villaId: string
          imageUrl: string
          title?: string | null
          altText?: string | null
          order?: number
          isCoverImage?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          villaId?: string
          imageUrl?: string
          title?: string | null
          altText?: string | null
          order?: number
          isCoverImage?: boolean
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "villaimage_villaid_fkey"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      },
      VillaTag: {
        Row: {
          id: string
          villaId: string | null
          name: string
          createdAt: string
        }
        Insert: {
          id?: string
          villaId?: string | null
          name: string
          createdAt?: string
        }
        Update: {
          id?: string
          villaId?: string | null
          name?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "villatag_villaid_fkey"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      },
      VillaAmenity: {
        Row: {
          id: string
          villaId: string
          name: string
          createdAt: string
        }
        Insert: {
          id?: string
          villaId: string
          name: string
          createdAt?: string
        }
        Update: {
          id?: string
          villaId?: string
          name?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "villaamenity_villaid_fkey"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      },
      SeasonalPrice: {
        Row: {
          id: string
          villaId: string
          seasonName: string
          startDate: string
          endDate: string
          nightlyPrice: number
          weeklyPrice: number | null
          description: string | null
          isActive: boolean
        }
        Insert: {
          id?: string
          villaId: string
          seasonName: string
          startDate: string
          endDate: string
          nightlyPrice: number
          weeklyPrice?: number | null
          description?: string | null
          isActive?: boolean
        }
        Update: {
          id?: string
          villaId?: string
          seasonName?: string
          startDate?: string
          endDate?: string
          nightlyPrice?: number
          weeklyPrice?: number | null
          description?: string | null
          isActive?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seasonalprice_villaid_fkey"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      },
      CalendarEvent: {
        Row: {
          id: string
          villaId: string
          date: string
          status: Database["public"]["Enums"]["CalendarStatus"]
          price: number | null
          note: string | null
          eventType: Database["public"]["Enums"]["EventType"] | null
        }
        Insert: {
          id?: string
          villaId: string
          date: string
          status?: Database["public"]["Enums"]["CalendarStatus"]
          price?: number | null
          note?: string | null
          eventType?: Database["public"]["Enums"]["EventType"] | null
        }
        Update: {
          id?: string
          villaId?: string
          date?: string
          status?: Database["public"]["Enums"]["CalendarStatus"]
          price?: number | null
          note?: string | null
          eventType?: Database["public"]["Enums"]["EventType"] | null
        }
        Relationships: [
          {
            foreignKeyName: "calendarevent_villaid_fkey"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      },
      Reservation: {
        Row: {
          id: string
          bookingRef: string
          villaId: string
          startDate: string
          endDate: string
          guestCount: number
          totalAmount: number
          advanceAmount: number
          remainingAmount: number
          paymentType: Database["public"]["Enums"]["PaymentType"]
          status: Database["public"]["Enums"]["ReservationStatus"]
          paymentMethod: string
          customerName: string
          customerEmail: string
          customerPhone: string
          customerNotes: string | null
          cancellationReason: string | null
          cancelledAt: string | null
          createdAt: string | null
          updatedAt: string | null
        }
        Insert: {
          id?: string
          bookingRef: string
          villaId: string
          startDate: string
          endDate: string
          guestCount: number
          totalAmount: number
          advanceAmount: number
          remainingAmount: number
          paymentType?: Database["public"]["Enums"]["PaymentType"]
          status?: Database["public"]["Enums"]["ReservationStatus"]
          paymentMethod?: string
          customerName: string
          customerEmail: string
          customerPhone: string
          customerNotes?: string | null
          cancellationReason?: string | null
          cancelledAt?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          bookingRef?: string
          villaId?: string
          startDate?: string
          endDate?: string
          guestCount?: number
          totalAmount?: number
          advanceAmount?: number
          remainingAmount?: number
          paymentType?: Database["public"]["Enums"]["PaymentType"]
          status?: Database["public"]["Enums"]["ReservationStatus"]
          paymentMethod?: string
          customerName?: string
          customerEmail?: string
          customerPhone?: string
          customerNotes?: string | null
          cancellationReason?: string | null
          cancelledAt?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reservation_villa"
            columns: ["villaId"]
            referencedRelation: "Villa"
            referencedColumns: ["id"]
          }
        ]
      }
      // Diğer tablolarınızı buraya ekleyebilirsiniz
    },
    Enums: {
      VillaStatus: "ACTIVE" | "INACTIVE",
      CalendarStatus: "AVAILABLE" | "PENDING" | "RESERVED" | "BLOCKED",
      EventType: "CHECKIN" | "CHECKOUT" | "SPECIAL_OFFER",
      PaymentType: "FULL_PAYMENT" | "SPLIT_PAYMENT",
      ReservationStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
    }
  }
} 