"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp, IconMap } from "@tabler/icons-react"

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
  
  useEffect(() => {
    const fetchRegionStats = async () => {
      const supabase = createClient()
      
      // Mevcut toplam bölge sayısı
      const { data: regions, error: regionsError } = await supabase
        .from('Region')
        .select('id, isActive, isPromoted, isMainRegion')
      
      if (regionsError) {
        console.error('Bölge istatistikleri çekilirken hata oluştu:', regionsError)
        return
      }
      
      // Son 30 günden önceki bölge sayısını al (büyüme oranı için)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: previousCount, error: previousError } = await supabase
        .from('Region')
        .select('id', { count: 'exact', head: true })
        .lt('createdAt', thirtyDaysAgo.toISOString())
      
      if (previousError) {
        console.error('Önceki bölge sayısı çekilirken hata oluştu:', previousError)
        return
      }
      
      const total = regions?.length || 0
      const active = regions?.filter(r => r.isActive).length || 0
      const promoted = regions?.filter(r => r.isPromoted).length || 0
      const mainRegions = regions?.filter(r => r.isMainRegion).length || 0
      const previous = previousCount || 0
      
      // Büyüme oranı hesapla
      let trend = 0
      if (previous > 0) {
        trend = ((total - previous) / previous) * 100
      } else if (total > 0) {
        trend = 100 // Önceden bölge yoksa ve şimdi varsa %100 büyüme
      }
      
      setRegionStats({
        total,
        active,
        promoted,
        mainRegions,
        previous,
        trend
      })
    }
    
    fetchRegionStats()
  }, [])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Toplam Gelir</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₺35.650,00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Bu ay yükselişte <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Son 6 aydaki ziyaretçi sayısı
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Yeni Müşteriler</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1.234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Bu dönemde %20 düşüş <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Müşteri kazanımı dikkat gerektiriyor
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aktif Hesaplar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45.678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Güçlü kullanıcı elde tutma <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Etkileşim hedefleri aşıldı</div>
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
