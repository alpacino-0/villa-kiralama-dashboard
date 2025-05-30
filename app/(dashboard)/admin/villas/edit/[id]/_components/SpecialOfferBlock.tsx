'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import OfferDateRangePicker from "./OfferDateRangePicker";
import { createClient } from "@/lib/supabase/client";

export default function SpecialOfferBlock() {
  const today = new Date();
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [isDiscountActive, setIsDiscountActive] = useState<boolean>(false);
  
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
  
  // Tarih aralığını güncelle - "SPECIAL_OFFER" olarak işaretle ve isteğe bağlı fiyat güncellemesi yap
  const updateCalendarEvents = async (eventTypeValue: 'SPECIAL_OFFER' | null) => {
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
      
      // Güncelleme objesini başlat
      const updateData: { eventType: 'SPECIAL_OFFER' | null, price?: number | null } = {
        eventType: eventTypeValue
      };
      
      // Eğer discount fiyatı girilmişse ve özel teklif ekleniyorsa, price'ı da güncelle
      if (isDiscountActive && eventTypeValue === 'SPECIAL_OFFER' && discountPrice.trim() !== "") {
        const priceValue = Number.parseFloat(discountPrice);
        if (!Number.isNaN(priceValue) && priceValue >= 0) {
          updateData.price = priceValue;
        } else {
          toast.error("Geçerli bir fiyat değeri giriniz");
          setIsUpdating(false);
          return;
        }
      }
      
      // Supabase güncelleme sorgusu (belirtilen villa ve tarih aralığı için)
      const { data, error } = await supabase
        .from('CalendarEvent')
        .update(updateData)
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
      if (eventTypeValue === 'SPECIAL_OFFER') {
        const priceInfo = isDiscountActive && updateData.price !== undefined ? 
          ` (${updateData.price} TL indirimli fiyat ile)` : "";
        toast.success(`${updatedCount} tarih başarıyla "Özel Teklif" olarak işaretlendi${priceInfo}.`);
        console.log(`${updatedCount} tarih SPECIAL_OFFER olarak güncellendi:`, data);
      } else {
        toast.success(`${updatedCount} tarihten "Özel Teklif" işareti kaldırıldı.`);
        console.log(`${updatedCount} tarihten SPECIAL_OFFER işareti kaldırıldı:`, data);
      }
      
      // Tarihleri temizle
      clearSelectedDates();
      setDiscountPrice("");
      
    } catch (error: unknown) {
      console.error('Takvim güncellenirken beklenmeyen hata:', error);
      setError(`İşlem sırasında hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      toast.error(`İşlem sırasında hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Özel teklif olarak işaretle
  const markAsSpecialOffer = () => updateCalendarEvents('SPECIAL_OFFER');
  
  // Özel teklif işaretini kaldır
  const clearSpecialOffer = () => updateCalendarEvents(null);
  
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
        <CardTitle>Özel Teklif İşaretleme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seçilen tarih aralığı için özel teklif ayarları. Özel teklif işaretli günler takvimde yeşil renkle gösterilir ve misafirlerinize özel indirimler sunabilirsiniz.
        </p>
        
        <OfferDateRangePicker
          today={today}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          onDateSelect={handleDateSelect}
          villaId={villaId}
          className="mt-2"
        />
        
        <div className="flex items-start space-x-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="apply-discount" 
              checked={isDiscountActive}
              onCheckedChange={(checked) => setIsDiscountActive(checked === true)}
            />
            <Label htmlFor="apply-discount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              İndirimli fiyat uygula
            </Label>
          </div>
          
          {isDiscountActive && (
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="İndirimli fiyat (TL)"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">TL</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Seçilen tüm tarihlere bu fiyat uygulanacaktır.
              </p>
            </div>
          )}
        </div>
        
        {renderError()}
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            onClick={clearSelectedDates}
            variant="outline"
            disabled={(!selectedStartDate && !selectedEndDate) || isUpdating}
            size="sm"
          >
            Seçimi Temizle
          </Button>
          
          <Button
            onClick={markAsSpecialOffer}
            disabled={!selectedStartDate || !selectedEndDate || isUpdating}
            className="ml-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              "Özel Teklif Olarak İşaretle"
            )}
          </Button>
          
          <Button
            onClick={clearSpecialOffer}
            disabled={!selectedStartDate || !selectedEndDate || isUpdating}
            variant="destructive"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              "Özel Teklif İşaretini Kaldır"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 