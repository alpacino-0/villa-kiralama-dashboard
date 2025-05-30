"use client"

import * as React from "react"
import { 
  IconCalendarStats,
  IconCurrency,
  IconUsers,
  IconTrendingUp,
  IconRefresh
} from "@tabler/icons-react"
import { ReservationTableContainer } from "./reservation-table-container"
import { reservationService } from "./reservation-data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ReservationStats, ReservationWithVilla } from "@/types/reservation"

// İstatistik kartı bileşeni
interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
              <IconTrendingUp className="size-3 mr-1" />
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Tutar formatlama fonksiyonu
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ReservationManager() {
  const [stats, setStats] = React.useState<ReservationStats | null>(null)
  const [upcomingReservations, setUpcomingReservations] = React.useState<ReservationWithVilla[]>([])
  const [isLoadingStats, setIsLoadingStats] = React.useState(true)
  const [isLoadingUpcoming, setIsLoadingUpcoming] = React.useState(true)

  // İstatistikleri yükle
  const loadStats = React.useCallback(async () => {
    try {
      setIsLoadingStats(true)
      const statsData = await reservationService.getReservationStats()
      setStats(statsData)
    } catch (error) {
      console.error("İstatistikler yüklenirken hata:", error)
      toast.error("İstatistikler yüklenirken bir hata oluştu")
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Yaklaşan rezervasyonları yükle
  const loadUpcomingReservations = React.useCallback(async () => {
    try {
      setIsLoadingUpcoming(true)
      const upcoming = await reservationService.getUpcomingReservations()
      setUpcomingReservations(upcoming)
    } catch (error) {
      console.error("Yaklaşan rezervasyonlar yüklenirken hata:", error)
      toast.error("Yaklaşan rezervasyonlar yüklenirken bir hata oluştu")
    } finally {
      setIsLoadingUpcoming(false)
    }
  }, [])

  // Verileri yükle
  const loadData = React.useCallback(async () => {
    await Promise.all([loadStats(), loadUpcomingReservations()])
  }, [loadStats, loadUpcomingReservations])

  // Component mount olduğunda verileri yükle
  React.useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rezervasyon Yönetimi</h1>
          <p className="text-muted-foreground">
            Villa rezervasyonlarını görüntüleyin, düzenleyin ve yönetin
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          className="gap-2"
          disabled={isLoadingStats || isLoadingUpcoming}
        >
          <IconRefresh className={`size-4 ${(isLoadingStats || isLoadingUpcoming) ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* İstatistik kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Rezervasyon"
          value={isLoadingStats ? "..." : (stats?.totalReservations || 0)}
          description="Tüm rezervasyonlar"
          icon={<IconCalendarStats className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Bekleyen Rezervasyonlar"
          value={isLoadingStats ? "..." : (stats?.pendingReservations || 0)}
          description="Onay bekleyenler"
          icon={<IconUsers className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Toplam Gelir"
          value={isLoadingStats ? "..." : formatCurrency(stats?.totalRevenue || 0)}
          description="Tamamlanan rezervasyonlar"
          icon={<IconCurrency className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Ortalama Rezervasyon"
          value={isLoadingStats ? "..." : formatCurrency(stats?.averageBookingValue || 0)}
          description="Rezervasyon başına"
          icon={<IconTrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Yaklaşan rezervasyonlar kartı */}
      {!isLoadingUpcoming && upcomingReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendarStats className="size-5" />
              Yaklaşan Rezervasyonlar (7 gün içinde)
            </CardTitle>
            <CardDescription>
              Check-in tarihi yaklaşan onaylanmış rezervasyonlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {reservation.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reservation.Villa?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Date(reservation.startDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {reservation.guestCount} misafir
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Onaylandı
                    </Badge>
                  </div>
                </div>
              ))}
              {upcomingReservations.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Ve {upcomingReservations.length - 5} rezervasyon daha...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ana rezervasyon tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Rezervasyonlar</CardTitle>
          <CardDescription>
            Villa rezervasyonlarını görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6">
            <ReservationTableContainer />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 