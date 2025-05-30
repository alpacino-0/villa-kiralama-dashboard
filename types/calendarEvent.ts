import type { Database } from "./supabase";

// CalendarStatus enum tipi
export type CalendarStatus = Database["public"]["Enums"]["CalendarStatus"];

// EventType enum tipi
export type EventType = Database["public"]["Enums"]["EventType"];

// CalendarEvent tablosunun satır tipi
export type CalendarEvent = Database["public"]["Tables"]["CalendarEvent"]["Row"];

// CalendarEvent için giriş veri formatı
export type CalendarEventInsert = Database["public"]["Tables"]["CalendarEvent"]["Insert"];

// CalendarEvent için güncelleme veri formatı
export type CalendarEventUpdate = Database["public"]["Tables"]["CalendarEvent"]["Update"];

// Zod şeması için kullanılabilecek temel veri formatı
export interface ICalendarEvent {
  id: string;
  villaId: string;
  date: string;
  status: CalendarStatus;
  price: number | null;
  note: string | null;
  eventType: EventType | null;
} 