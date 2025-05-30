'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { addDays, format, isAfter, isBefore, isEqual, startOfMonth, addMonths, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, EventType } from "@/types/calendarEvent";

// İç kullanım için takvim günü tipi
interface CalendarDay {
  date: Date;
  status: 'available' | 'booked' | 'noPrice';
  price?: number;
  currency?: string;
  eventType?: EventType | null;
}

interface DateRangePickerProps {
  today: Date;
  selectedStartDate: Date | undefined;
  selectedEndDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  minStay?: number;
  variant?: "default" | "sidebar" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  villaId: string;
}

export default function OfferDateRangePicker({
  today,
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
  minStay = 1,
  size = "md",
  className,
  disabled = false,
  villaId
}: DateRangePickerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  
  // CalendarEvent verilerini yönetmek için state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Takvim verilerini çek
  const fetchCalendarEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Eğer villaId yoksa boş dizi döndür
      if (!villaId) {
        setCalendarEvents([]);
        return;
      }

      // Supabase istemcisi oluştur
      const supabase = createClient();

      // Tarihleri belirle
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      
      const oneYearLater = addMonths(todayStart, 12);
      oneYearLater.setHours(23, 59, 59, 999);

      // ISO string formatına dönüştür
      const todayStr = todayStart.toISOString();
      const oneYearLaterStr = oneYearLater.toISOString();

      // Supabase sorgusu
      const { data, error } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('villaId', villaId)
        .gte('date', todayStr)
        .lte('date', oneYearLaterStr)
        .order('date', { ascending: true });

      if (error) {
        console.error('Takvim verileri yüklenirken hata:', error);
        setError('Takvim olayları alınamadı');
        return;
      }

      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Takvim verileri yüklenirken hata oluştu:', error);
      setError('Takvim olayları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [villaId, today]);

  // İlk yükleme sırasında takvim olaylarını getir
  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);
  
  // CalendarEvent[] formatından iç CalendarDay[] formatına dönüştür
  const calendarData: CalendarDay[] = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) return [];
    
    return calendarEvents.map(event => ({
      date: typeof event.date === 'string' ? parseISO(event.date) : new Date(event.date),
      status: event.status === 'AVAILABLE' ? 'available' : 'booked',
      price: event.price || undefined,
      eventType: event.eventType
    }));
  }, [calendarEvents]);
    
  // Tarih aralığı bilgisini ve metin bilgisini hesapla
  const totalDays = selectedStartDate && selectedEndDate
    ? Math.max(Math.floor((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)), 1)
    : 0;
  
  // Takvim günlerini oluştur
  useEffect(() => {
    const days: Date[] = [];
    
    // İki ay için günleri oluştur
    const firstMonth = currentMonth;
    const secondMonth = addMonths(currentMonth, 1);
    
    const generateDaysForMonth = (month: Date) => {
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(month.getFullYear(), month.getMonth(), i));
      }
    };
    
    generateDaysForMonth(firstMonth);
    generateDaysForMonth(secondMonth);
    
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Önceki aylara geç
  const goToPreviousMonths = () => {
    if (isBefore(addMonths(currentMonth, -1), startOfMonth(today))) return;
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  // Sonraki aylara geç
  const goToNextMonths = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Tarihin seçilebilir olup olmadığını kontrol et
  const isDateSelectable = (date: Date) => {
    // Bugünden önce olan tarihleri devre dışı bırak
    if (isBefore(date, today)) return false;
    
    return true;
  };
  
  // Tarihin seçili olup olmadığını kontrol et
  const isDateSelected = (date: Date) => {
    if (!selectedStartDate) return false;
    
    if (selectedEndDate) {
      return (
        isEqual(date, selectedStartDate) || 
        isEqual(date, selectedEndDate) || 
        (isAfter(date, selectedStartDate) && isBefore(date, selectedEndDate))
      );
    }
    
    return isEqual(date, selectedStartDate);
  };
  
  // Tarih seçimlerini yönet
  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date)) return;
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // İlk tarih seçimi veya her iki tarih de seçiliyse, giriş tarihini ayarla
      onDateSelect(date);
    } else {
      // Çıkış tarihi giriş tarihinden önce olamaz
      if (isBefore(date, selectedStartDate)) {
        onDateSelect(addDays(selectedStartDate, 1));
      } else {
        // Konaklama süresini hesapla
        const stayDuration = Math.floor((date.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Minimum konaklama süresinden az ise otomatik olarak minimum süreyi sağlayan tarihi seç
        if (stayDuration < minStay) {
          onDateSelect(addDays(selectedStartDate, minStay));
          return;
        }
        
        // Tarihi seç
        onDateSelect(date);
      }
    }
  };
  
  // Tarih formatter yardımcısı
  const formatDate = (date: Date) => {
    return format(date, 'd', { locale: tr });
  };
  
  // Ay adını formatla
  const formatMonth = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: tr });
  };
  
  // Takvimi oluştur
  const renderCalendar = () => {
    // Ay gruplarını oluştur
    const months: { [key: string]: Date[] } = {};
    
    for (const day of calendarDays) {
      const monthKey = format(day, 'yyyy-MM');
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);
    }
    
    const monthKeys = Object.keys(months).sort();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthKeys.map((monthKey) => {
          const days = months[monthKey];
          if (days.length === 0) return null;
          
          const firstDay = days[0];
          const monthName = formatMonth(firstDay);
          
          // Hafta günlerini hesapla
          const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
          
          // Ayın ilk gününün haftanın hangi günü olduğunu hesapla (0: Pazar, 1: Pazartesi, ...)
          let firstDayOfMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1).getDay();
          firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Pazartesi'yi 0 yap
          
          return (
            <div key={monthKey} className="w-full">
              <div className="font-semibold text-base text-center mb-3">{monthName}</div>
              
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map(day => (
                  <div key={day} className="text-xs text-center text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Boş günler için dolgu */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}-${monthKey}`} className="p-2" />
                ))}
                
                {/* Ayın günleri */}
                {days.map(day => {
                  const calendarDay = calendarData.find(item => isSameDay(item.date, day));
                  const isSelectable = isDateSelectable(day);
                  const isSelected = isDateSelected(day);
                  const isStartDate = selectedStartDate && isSameDay(day, selectedStartDate);
                  const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);
                  const isBooked = calendarDay?.status === 'booked';
                  const hasNoPrice = !calendarDay || calendarDay.price === undefined || calendarDay.price === null;
                  const isSpecialOffer = calendarDay?.eventType === 'SPECIAL_OFFER';
                  const hasSpecialPrice = isSpecialOffer && calendarDay?.price !== undefined && calendarDay?.price !== null;
                  
                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      disabled={!isSelectable}
                      className={cn(
                          "p-1 text-xs sm:text-sm rounded-md text-center w-full h-7 sm:h-9 relative",
                        "transition-colors",
                        isSelectable ? "hover:bg-muted" : "opacity-40 cursor-not-allowed",
                        isSelected ? "bg-primary text-primary-foreground" : "",
                        isStartDate ? "rounded-l-md" : "",
                        isEndDate ? "rounded-r-md" : "",
                        isSelected && !isStartDate && !isEndDate ? "bg-primary/20 text-primary" : "",
                        isBooked ? "bg-red-50 text-red-600" : "",
                        isSpecialOffer ? "bg-green-50 text-green-600" : "",
                        hasNoPrice ? "text-gray-500" : ""
                      )}
                      title={hasNoPrice ? "Bu tarihte fiyat bulunmuyor" : isSpecialOffer ? `Özel Teklif${hasSpecialPrice ? `: ${calendarDay?.price} TL` : ''}` : ""}
                    >
                      <span className="relative z-10">{formatDate(day)}</span>
                      
                      {/* Özel fiyat gösterimi */}
                      {hasSpecialPrice && (
                        <div className="text-[8px] leading-tight mt-0.5 font-semibold text-green-700">
                          {calendarDay?.price} TL
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Takvim lejandını oluştur
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap gap-2 text-xs mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 border rounded" />
          <span>Seçili</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border rounded" />
          <span>Dolu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-50 border rounded" />
          <span>Özel Teklif</span>
        </div>
      </div>
    );
  };
  
  // Hata durumunda uyarı göster
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedStartDate && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedStartDate && selectedEndDate ? (
              <>
                {format(selectedStartDate, 'dd MMMM', { locale: tr })} - {format(selectedEndDate, 'dd MMMM', { locale: tr })}
                <span className="ml-auto text-sm text-gray-500">
                  {totalDays} {totalDays === 1 ? 'gece' : 'gece'}
                </span>
              </>
            ) : (
              <span>Tarih Seçin</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 max-w-[90vw] sm:max-w-none" align="start">
          <div className="space-y-4">                 
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPreviousMonths}
                disabled={isBefore(addMonths(currentMonth, -1), startOfMonth(today)) || isLoading}
                className="h-7 w-7"
                aria-label="Önceki aylar"
                title="Önceki aylar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <title>Önceki aylar</title>
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextMonths}
                disabled={isLoading}
                className="h-7 w-7"
                aria-label="Sonraki aylar"
                title="Sonraki aylar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <title>Sonraki aylar</title>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Button>
            </div>     
            
            {renderError()}
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : calendarData.length === 0 ? (
              <Alert>
                <AlertDescription>Bu villa için takvim bilgisi bulunamadı.</AlertDescription>
              </Alert>
            ) : (
              <>
                {renderCalendar()}
                {renderLegend()}
    
                <div className="text-xs text-muted-foreground">
                  *Bu villa için minimum konaklama {minStay} gecedir.
                </div>
                
                {selectedStartDate && !selectedEndDate && (
                  <div className="text-sm text-muted-foreground text-center">
                    <CalendarIcon className="inline-block mr-1 h-3 w-3" />
                    Lütfen dönüş tarihini seçin
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 