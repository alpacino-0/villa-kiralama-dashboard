"use client"

import * as React from "react"
import { ReservationTable } from "./reservation-table"
import { reservationService } from "./reservation-data-service"
import { toast } from "sonner"
import type { ReservationWithVilla } from "@/types/reservation"

export function ReservationTableContainer() {
  const [data, setData] = React.useState<ReservationWithVilla[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Verileri yükle
  const loadReservations = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const reservations = await reservationService.listReservations()
      setData(reservations)
    } catch (err) {
      console.error("Rezervasyonlar yüklenirken hata:", err)
      setError("Rezervasyonlar yüklenirken bir hata oluştu")
      toast.error("Rezervasyonlar yüklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Component mount olduğunda verileri yükle
  React.useEffect(() => {
    loadReservations()
  }, [loadReservations])

  // Yenile fonksiyonu
  const refresh = React.useCallback(() => {
    loadReservations()
  }, [loadReservations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Rezervasyonlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <button
            onClick={refresh}
            className="text-sm text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      </div>
    )
  }

  return <ReservationTable data={data} />
} 