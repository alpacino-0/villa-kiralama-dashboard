'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateRangePicker from './DateRangePicker';
import { useParams } from 'next/navigation';

export default function CalendarBlock() {
  const params = useParams();
  const villaId = params.id as string;
  const today = new Date();
  
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);

  const handleDateSelect = (date: Date | undefined) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // İlk tarih seçimi veya yeni bir seçim başlatılıyor
      setSelectedStartDate(date);
      setSelectedEndDate(undefined);
    } else {
      // İkinci tarih seçimi
      setSelectedEndDate(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Takvim Yönetimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Takvimde bir tarih aralığı seçerek müsaitlik durumunu güncelleyebilirsiniz.
            İlk ve son tarihler giriş/çıkış olarak işaretlenecek, aradaki günler ise bloke edilecektir.
          </p>
          
          <DateRangePicker
            villaId={villaId}
            today={today}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onDateSelect={handleDateSelect}
            minStay={1}
          />
        </div>
      </CardContent>
    </Card>
  );
} 