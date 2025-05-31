"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp, IconMap, IconHome, IconClipboardList, IconCurrencyLira } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export function SectionCards() {
  const [regionStats, setRegionStats] = useState({
    total: 0,
    active: 0,
    promoted: 0,
    mainRegions: 0,
    previous: 0,
    trend: 0
  })

  const [villaStats, setVillaStats] = useState({
    total: 0,
    active: 0,
    promoted: 0,
    previous: 0,
    trend: 0
  })

  const [reservationStats, setReservationStats] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    confirmed: 0,
    previousMonth: 0,
    trend: 0
  })

  const [revenueStats, setRevenueStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalRevenue: 0,
    completedRevenue: 0,
    trend: 0
  })

  // Para formatı için yardımcı fonksiyon
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      // Bölge istatistikleri
      const { data: regions, error: regionsError } = await supabase
        .from('Region')
        .select('id, isActive, isPromoted, isMainRegion')
      
      if (regionsError) {
        console.error('Bölge istatistikleri çekilirken hata oluştu:', regionsError)
        return
      }

      // Villa istatistikleri
      const { data: villas, error: villasError } = await supabase
        .from('Villa')
        .select('id, status, isPromoted, createdAt')
      
      if (villasError) {
        console.error('Villa istatistikleri çekilirken hata oluştu:', villasError)
        return
      }

      // Rezervasyon istatistikleri
      const { data: reservations, error: reservationsError } = await supabase
        .from('Reservation')
        .select('id, status, createdAt, totalAmount')
      
      if (reservationsError) {
        console.error('Rezervasyon istatistikleri çekilirken hata oluştu:', reservationsError)
        return
      }
      
      // Tarih hesaplamaları
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: previousRegionCount, error: previousRegionError } = await supabase
        .from('Region')
        .select('id', { count: 'exact', head: true })
        .lt('createdAt', thirtyDaysAgo.toISOString())

      const { count: previousVillaCount, error: previousVillaError } = await supabase
        .from('Villa')
        .select('id', { count: 'exact', head: true })
        .lt('createdAt', thirtyDaysAgo.toISOString())
      
      if (previousRegionError || previousVillaError) {
        console.error('Önceki sayılar çekilirken hata oluştu')
        return
      }
      
      // Bölge istatistikleri hesaplama
      const regionTotal = regions?.length || 0
      const regionActive = regions?.filter(r => r.isActive).length || 0
      const regionPromoted = regions?.filter(r => r.isPromoted).length || 0
      const regionMainRegions = regions?.filter(r => r.isMainRegion).length || 0
      const regionPrevious = previousRegionCount || 0
      
      let regionTrend = 0
      if (regionPrevious > 0) {
        regionTrend = ((regionTotal - regionPrevious) / regionPrevious) * 100
      } else if (regionTotal > 0) {
        regionTrend = 100
      }

      // Villa istatistikleri hesaplama
      const villaTotal = villas?.length || 0
      const villaActive = villas?.filter(v => v.status === 'ACTIVE').length || 0
      const villaPromoted = villas?.filter(v => v.isPromoted).length || 0
      const villaPrevious = previousVillaCount || 0
      
      let villaTrend = 0
      if (villaPrevious > 0) {
        villaTrend = ((villaTotal - villaPrevious) / villaPrevious) * 100
      } else if (villaTotal > 0) {
        villaTrend = 100
      }

      // Rezervasyon istatistikleri hesaplama
      const reservationTotal = reservations?.length || 0
      const thisMonthReservations = reservations?.filter(r => 
        new Date(r.createdAt || '') >= thisMonthStart
      ).length || 0
      const lastMonthReservations = reservations?.filter(r => {
        const createdDate = new Date(r.createdAt || '')
        return createdDate >= lastMonthStart && createdDate <= lastMonthEnd
      }).length || 0
      const pendingReservations = reservations?.filter(r => r.status === 'PENDING').length || 0
      const confirmedReservations = reservations?.filter(r => r.status === 'CONFIRMED').length || 0
      
      let reservationTrend = 0
      if (lastMonthReservations > 0) {
        reservationTrend = ((thisMonthReservations - lastMonthReservations) / lastMonthReservations) * 100
      } else if (thisMonthReservations > 0) {
        reservationTrend = 100
      }

      // Gelir istatistikleri hesaplama
      const thisMonthRevenue = reservations?.filter(r => 
        new Date(r.createdAt || '') >= thisMonthStart
      ).reduce((sum, r) => sum + (r.totalAmount || 0), 0) || 0

      const lastMonthRevenue = reservations?.filter(r => {
        const createdDate = new Date(r.createdAt || '')
        return createdDate >= lastMonthStart && createdDate <= lastMonthEnd
      }).reduce((sum, r) => sum + (r.totalAmount || 0), 0) || 0

      const totalRevenue = reservations?.reduce((sum, r) => sum + (r.totalAmount || 0), 0) || 0
      const completedRevenue = reservations?.filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0) || 0

      let revenueTrend = 0
      if (lastMonthRevenue > 0) {
        revenueTrend = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      } else if (thisMonthRevenue > 0) {
        revenueTrend = 100
      }
      
      setRegionStats({
        total: regionTotal,
        active: regionActive,
        promoted: regionPromoted,
        mainRegions: regionMainRegions,
        previous: regionPrevious,
        trend: regionTrend
      })

      setVillaStats({
        total: villaTotal,
        active: villaActive,
        promoted: villaPromoted,
        previous: villaPrevious,
        trend: villaTrend
      })

      setReservationStats({
        total: reservationTotal,
        thisMonth: thisMonthReservations,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        previousMonth: lastMonthReservations,
        trend: reservationTrend
      })

      setRevenueStats({
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        totalRevenue: totalRevenue,
        completedRevenue: completedRevenue,
        trend: revenueTrend
      })
    }
    
    fetchStats()
  }, [])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Bu Ayki Gelir</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(revenueStats.thisMonth)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCurrencyLira className="mr-1 h-3.5 w-3.5" />
              {revenueStats.trend >= 0 ? (
                <>
                  <IconTrendingUp className="mr-1 h-3.5 w-3.5" />
                  +%{revenueStats.trend.toFixed(1)}
                </>
              ) : (
                <>
                  <IconTrendingDown className="mr-1 h-3.5 w-3.5" />
                  %{revenueStats.trend.toFixed(1)}
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex w-full justify-between">
            <span>Geçen Ay: {formatCurrency(revenueStats.lastMonth)}</span>
            <span>Toplam: {formatCurrency(revenueStats.totalRevenue)}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            {revenueStats.trend > 0 ? (
              <span className="flex items-center text-green-600">
                Önceki aya göre %{revenueStats.trend.toFixed(1)} artış <IconTrendingUp className="size-4" />
              </span>
            ) : revenueStats.trend < 0 ? (
              <span className="flex items-center text-red-600">
                Önceki aya göre %{Math.abs(revenueStats.trend).toFixed(1)} düşüş <IconTrendingDown className="size-4" />
              </span>
            ) : (
              <span>Önceki ay ile aynı seviyede</span>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Yeni Rezervasyonlar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {reservationStats.thisMonth}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClipboardList className="mr-1 h-3.5 w-3.5" />
              {reservationStats.trend >= 0 ? (
                <>
                  <IconTrendingUp className="mr-1 h-3.5 w-3.5" />
                  +%{reservationStats.trend.toFixed(1)}
                </>
              ) : (
                <>
                  <IconTrendingDown className="mr-1 h-3.5 w-3.5" />
                  %{reservationStats.trend.toFixed(1)}
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex w-full justify-between">
            <span>Bekleyen: {reservationStats.pending}</span>
            <span>Onaylı: {reservationStats.confirmed}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            {reservationStats.trend > 0 ? (
              <span className="flex items-center text-green-600">
                Bu ay önceki aya göre %{reservationStats.trend.toFixed(1)} artış <IconTrendingUp className="size-4" />
              </span>
            ) : reservationStats.trend < 0 ? (
              <span className="flex items-center text-red-600">
                Bu ay önceki aya göre %{Math.abs(reservationStats.trend).toFixed(1)} düşüş <IconTrendingDown className="size-4" />
              </span>
            ) : (
              <span>Bu ay önceki ay ile aynı seviyede</span>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aktif Villalar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {villaStats.active}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconHome className="mr-1 h-3.5 w-3.5" />
              {villaStats.promoted} Öne Çıkan
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex w-full justify-between">
            <span>Toplam Villa: {villaStats.total}</span>
            <span>Aktif Oran: %{villaStats.total > 0 ? ((villaStats.active / villaStats.total) * 100).toFixed(1) : 0}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <span>Son 30 günde büyüme:</span>
            {villaStats.trend > 0 ? (
              <span className="flex items-center text-green-600">
                %{villaStats.trend.toFixed(1)} <IconTrendingUp className="size-4" />
              </span>
            ) : villaStats.trend < 0 ? (
              <span className="flex items-center text-red-600">
                %{Math.abs(villaStats.trend).toFixed(1)} <IconTrendingDown className="size-4" />
              </span>
            ) : (
              <span>%0 (değişim yok)</span>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Bölge İstatistikleri</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {regionStats.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconMap className="mr-1 h-3.5 w-3.5" />
              {regionStats.mainRegions} Ana Bölge
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex w-full justify-between">
            <span>Aktif: {regionStats.active}</span>
            <span>Öne Çıkan: {regionStats.promoted}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <span>Son 30 günde büyüme:</span>
            {regionStats.trend > 0 ? (
              <span className="flex items-center text-green-600">
                %{regionStats.trend.toFixed(1)} <IconTrendingUp className="size-4" />
              </span>
            ) : regionStats.trend < 0 ? (
              <span className="flex items-center text-red-600">
                %{Math.abs(regionStats.trend).toFixed(1)} <IconTrendingDown className="size-4" />
              </span>
            ) : (
              <span>%0 (değişim yok)</span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
