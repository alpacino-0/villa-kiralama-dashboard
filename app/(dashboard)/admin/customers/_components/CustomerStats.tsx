import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerStats as CustomerStatsType } from '@/types/customer';

interface CustomerStatsProps {
  stats: CustomerStatsType | null;
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Bu ay yeni: {stats.newThisMonth}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rezervasyon Yapan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.byStatus.BOOKED}</div>
          <p className="text-xs text-muted-foreground">Dönüşüm: %{stats.conversionRate}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">İlgileniyor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.byStatus.INTERESTED}</div>
          <p className="text-xs text-muted-foreground">Potansiyel müşteri</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Yeni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.byStatus.NEW}</div>
          <p className="text-xs text-muted-foreground">İşlem bekliyor</p>
        </CardContent>
      </Card>
    </div>
  );
} 