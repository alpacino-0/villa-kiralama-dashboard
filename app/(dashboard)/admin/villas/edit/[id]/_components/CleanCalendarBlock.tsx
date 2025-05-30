'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import CleanDateRangePicker from "./CleanDateRangePicker";
import { createClient } from "@/lib/supabase/client";

export default function CleanCalendarBlock() {
  const today = new Date();
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tarih seçimi işleyicisi
  const handleDateSelect = (date: Date | undefined) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // İlk tarih seçilirse ya da her iki tarih de seçili ise, başlangıç tarihini ayarla
      setSelectedStartDate(date);
      setSelectedEndDate(undefined);
    } else {
      // İkinci tarih seçilirse, bitiş tarihini ayarla
      setSelectedEndDate(date);
    }
  };
  
  // Tarihleri temizle
  const clearSelectedDates = () => {
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  };
  
  // Tüm günleri "AVAILABLE" olarak güncelle
  const updateToAvailable = async () => {
    if (!villaId || !selectedStartDate || !selectedEndDate) {
      toast.error("Lütfen tarih aralığı seçiniz");
      return;
    }
    
    try {
      setIsUpdating(true);
      setError(null);
      
      // Supabase istemcisi oluştur
      const supabase = createClient();
      
      // Tarihleri ayarla (zaman dilimini sıfırla, tam gün alarak)
      const startDateISO = new Date(selectedStartDate);
      startDateISO.setHours(0, 0, 0, 0);
      
      const endDateISO = new Date(selectedEndDate);
      endDateISO.setHours(23, 59, 59, 999);
      
      // Supabase güncelleme sorgusu (belirtilen villa ve tarih aralığı için)
      const { data, error } = await supabase
        .from('CalendarEvent')
        .update({
          status: 'AVAILABLE',
          eventType: null
        })
        .eq('villaId', villaId)
        .gte('date', startDateISO.toISOString())
        .lte('date', endDateISO.toISOString())
        .select();
      
      if (error) {
        console.error('Takvim güncellenirken hata oluştu:', error);
        setError(`Takvim güncellenirken hata: ${error.message}`);
        toast.error(`Takvim güncellenirken hata: ${error.message}`);
        return;
      }
      
      // Başarılı mesajı göster
      const updatedCount = data?.length || 0;
      toast.success(`${updatedCount} tarih başarıyla güncellendi.`);
      
      // Tarihleri temizle
      clearSelectedDates();
      
    } catch (error: unknown) {
      console.error('Takvim güncellenirken beklenmeyen hata:', error);
      setError(`İşlem sırasında hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      toast.error(`İşlem sırasında hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Hata mesajını göster
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temizleme İşlemi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seçilen tarih aralığındaki tüm günleri &quot;Müsait&quot; olarak işaretler. Bu işlemi yapmadan önce lütfen seçtiğiniz tarihleri dikkatle kontrol edin.
        </p>
        
        <CleanDateRangePicker
          today={today}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          onDateSelect={handleDateSelect}
          villaId={villaId}
          className="mt-2"
        />
        
        {renderError()}
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={clearSelectedDates}
            variant="outline"
            disabled={(!selectedStartDate && !selectedEndDate) || isUpdating}
          >
            Temizle
          </Button>
          
          <Button
            onClick={updateToAvailable}
            disabled={!selectedStartDate || !selectedEndDate || isUpdating}
            className="ml-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              "Seçili Tarihleri Güncelle"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 