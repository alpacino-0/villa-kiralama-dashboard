'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { addMonths, format, isSameDay, isBefore, isAfter, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, EventType } from "@/types/calendarEvent";
import CalendarBlock from "./CalendarBlock";
import CleanCalendarBlock from "./CleanCalendarBlock";
import SpecialOfferBlock from "./SpecialOfferBlock";

interface VillaCalendarProps {
  villaId: string;
  minimumStay?: number;
}

// İç kullanım için takvim günü tipi
interface CalendarDay {
  date: Date;
  status: 'available' | 'booked';
  price?: number;
  currency?: string;
  eventType?: EventType | null;
}

export default function VillaCalendar({ villaId, minimumStay = 1 }: VillaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // useMemo ile tarih değişkenlerini hesapla - böylece her render'da yeniden oluşturulmaz
  const today = useMemo(() => new Date(), []);
  // 12 aylık bir aralık kullan (bir yıl)
  const twelveMonthsLater = useMemo(() => addMonths(today, 12), [today]);

  // Takvim verilerini yükle
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!villaId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // Bugünün başlangıcı (UTC)
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        // 12 ay sonrasının sonu (UTC)
        const twelveMonthsEnd = endOfMonth(twelveMonthsLater);
        twelveMonthsEnd.setHours(23, 59, 59, 999);
        
        // ISO string formatındaki tarihler
        const todayStr = todayStart.toISOString();
        const twelveMonthsEndStr = twelveMonthsEnd.toISOString();
        
        console.log("Tarih aralığı:", todayStr, "ile", twelveMonthsEndStr);
        
        // CalendarEvent tablosundan veriler çekilir
        const { data, error } = await supabase
          .from('CalendarEvent')
          .select('*')
          .eq('villaId', villaId)
          .gte('date', todayStr)
          .lte('date', twelveMonthsEndStr)
          .order('date', { ascending: true });
        
        if (error) {
          console.error('Takvim verileri yüklenirken hata:', error);
          setError('Takvim bilgileri getirilirken bir hata oluştu.');
          return;
        }
        
        if (data) {
          console.log(`Toplam ${data.length} takvim etkinliği yüklendi.`);
          // Tüm aylar için etkinlik sayısını kontrol edelim
          const monthlyEvents = Array(12).fill(0);
          for (const event of data) {
            const eventDate = new Date(event.date);
            const month = eventDate.getMonth();
            monthlyEvents[month]++;
          }
          
          // Her ay için etkinlik sayısını logla
          monthlyEvents.forEach((count, index) => {
            const monthName = new Date(today.getFullYear(), index).toLocaleString('tr-TR', { month: 'long' });
            console.log(`${monthName}: ${count} etkinlik`);
          });
        }
        
        setCalendarEvents(data || []);
      } catch (err) {
        console.error('Takvim verileri yüklenirken hata oluştu:', err);
        setError('Beklenmeyen bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarEvents();
  }, [villaId, today, twelveMonthsLater]);
  
  // CalendarEvent[] formatından iç CalendarDay[] formatına dönüştür
  const calendarData: CalendarDay[] = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) return [];
    
    return calendarEvents.map((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      
      return {
        date: eventDate,
        status: event.status === 'AVAILABLE' ? 'available' : 'booked',
        price: event.price || undefined,
        eventType: event.eventType
      };
    });
  }, [calendarEvents]);
  
  // Mevcut ay için takvimde gösterilen günlerin tarih verisi olup olmadığını loglama
  useEffect(() => {
    const currentMonthNum = currentMonth.getMonth() + 1;
    const currentMonthStr = format(currentMonth, 'MMMM', { locale: tr });
    
    console.log(`Şu an görüntülenen ay: ${currentMonthStr} ${currentMonth.getFullYear()}`);
    
    const daysInCurrentMonth = calendarData.filter(day => {
      const dayMonth = day.date.getMonth() + 1;
      return dayMonth === currentMonthNum;
    });
    
    console.log(`${currentMonthStr} ayında ${daysInCurrentMonth.length} tarih verisi mevcut.`);
  }, [currentMonth, calendarData]);
  
  // Takvimi önceki aya çevir
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prev.getMonth() - 1);
      return prevMonth;
    });
  };
  
  // Takvimi sonraki aya çevir
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + 1);
      return nextMonth;
    });
  };
  
  // Özel takvim oluştur
  const renderCalendar = () => {
    // Takvimde gösterilecek ayın ilk ve son günleri
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Takvimin ilk günü (ayın ilk gününün haftanın hangi günü olduğuna göre)
    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());
    
    // Takvimin son günü (son haftayı tamamlayacak şekilde)
    const endDay = new Date(lastDayOfMonth);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));
    
    // Haftanın günleri
    const weekDays = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    
    // Takvim günlerini oluştur
    const calendarDays = [];
    const startDate = new Date(startDay);
    
    while (startDate <= endDay) {
      calendarDays.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return (
      <div className="calendar">
        {/* Ay başlığı ve gezinme butonları */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <button 
            type="button"
            onClick={prevMonth} 
            disabled={isBefore(new Date(currentMonth.getFullYear(), currentMonth.getMonth()), today)}
            className="p-1 sm:p-2 text-gray-500 disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
            aria-label="Önceki ay"
          >
            «
          </button>
          <h3 className="text-base sm:text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </h3>
          <button 
            type="button"
            onClick={nextMonth} 
            disabled={isAfter(new Date(currentMonth.getFullYear(), currentMonth.getMonth()), twelveMonthsLater)}
            className="p-1 sm:p-2 text-gray-500 disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
            aria-label="Sonraki ay"
          >
            »
          </button>
        </div>
        
        {/* Hafta başlıkları */}
        <div className="grid grid-cols-7 mb-1 sm:mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Günler */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const calendarDay = calendarData.find(item => isSameDay(item.date, date));
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isBooked = calendarDay?.status === 'booked';
            const isDisabled = isBefore(date, today);
            const isSpecialOffer = calendarDay?.eventType === 'SPECIAL_OFFER';
            const isCheckIn = calendarDay?.eventType === 'CHECKIN';
            const isCheckOut = calendarDay?.eventType === 'CHECKOUT';
            
            return (
              <div 
                key={`calendar-day-${date.toISOString()}-${index}`}
                className={`
                  p-1 text-center relative h-10 sm:h-14 flex flex-col justify-center items-center
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isBooked ? 'bg-red-50 text-red-800' : ''}
                  ${isSpecialOffer ? 'bg-green-50' : ''}
                  rounded-md
                `}
              >
                {isCheckIn && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-full h-full">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" role="presentation">
                        <title>Giriş Günü</title>
                        <polygon points="100,100 2,100 100,2" fill="rgba(254, 242, 242)" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {isCheckOut && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-0 top-0 w-full h-full">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" role="presentation">
                        <title>Çıkış Günü</title>
                        <polygon points="0,0 98,0 0,98" fill="rgba(254, 242, 242)" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <span className="text-xs sm:text-sm relative z-10">{date.getDate()}</span>
                
                {/* Fiyat gösterimi */}
                {calendarDay?.price && (
                  <span className={`text-[9px] sm:text-[10px] font-semibold ${isBooked ? 'text-red-700' : 'text-green-700'} relative z-10`}>
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(calendarDay.price)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Takvim bilgilendirme mesajı
  const renderCalendarInfo = () => {
    return (
      <Alert className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Müsaitlik Takvimi</AlertTitle>
        <AlertDescription className="text-sm">
          <p>{minimumStay === 1 ? 'Minimum konaklama süresi 1 gece' : `Minimum konaklama süresi ${minimumStay} gece`}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 border border-gray-200 rounded-sm mr-1" />
              <span className="text-xs">Müsait</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-50 border border-red-100 rounded-sm mr-1" />
              <span className="text-xs">Dolu</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 rounded-sm mr-1" />
              <span className="text-xs">Özel Teklif</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-3 h-3 border rounded-sm mr-1 bg-white overflow-hidden">
                <div className="absolute right-0 bottom-0 w-full h-full">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" role="presentation">
                    <title>Giriş Göstergesi</title>
                    <polygon points="100,100 2,100 100,2" fill="rgba(254, 242, 242)" />
                  </svg>
                </div>
              </div>
              <span className="text-xs">Giriş</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-3 h-3 border rounded-sm mr-1 bg-white overflow-hidden">
                <div className="absolute left-0 top-0 w-full h-full">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" role="presentation">
                    <title>Çıkış Göstergesi</title>
                    <polygon points="0,0 98,0 0,98" fill="rgba(254, 242, 242)" />
                  </svg>
                </div>
              </div>
              <span className="text-xs">Çıkış</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b">
        <CardTitle className="text-lg font-semibold">Müsaitlik Takvimi (12 Aylık)</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Takvim bilgileri yükleniyor...</span>
          </div>
        ) : error ? (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {renderCalendar()}
            {renderCalendarInfo()}
            
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-base font-medium mb-3">Tarih Aralığı İşlemleri</h3>
              <div className="grid grid-cols-1 gap-4">
                <CalendarBlock />
                <CleanCalendarBlock />
                <SpecialOfferBlock />
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Tarih aralığı seçerek villanın doluluğunu toplu şekilde güncelleyebilirsiniz. İlk ve son tarihler giriş/çıkış olarak işaretlenecek, aradaki tarihlerin durumu &quot;BLOCKED&quot; olarak ayarlanacaktır.</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 