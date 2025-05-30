"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { VillaTable } from "./villa-table"
import { villaService } from "./villa-data-service"
import type { Villa, VillaFilters } from "@/types/villa"

interface VillaTableContainerProps {
  filter?: VillaFilters
}

export function VillaTableContainer({ filter }: VillaTableContainerProps) {
  const [villas, setVillas] = useState<Villa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVillas = async () => {
      try {
        setLoading(true)
        let data: Villa[]
        
        if (filter) {
          data = await villaService.filterVillas(filter)
        } else {
          data = await villaService.listVillas()
        }
        
        setVillas(data)
      } catch (error) {
        console.error("Villalar yüklenirken hata oluştu:", error)
        toast.error("Villalar yüklenemedi. Lütfen daha sonra tekrar deneyin.")
      } finally {
        setLoading(false)
      }
    }

    fetchVillas()
  }, [filter])

  if (loading) {
    return <p>Villalar yükleniyor...</p>
  }

  if (villas.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div>
          <p className="text-lg font-medium">Hiç villa bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            {filter?.status === "ACTIVE"
              ? "Aktif villa bulunmuyor. Yeni bir villa ekleyin veya mevcut villaları aktifleştirin."
              : filter?.status === "INACTIVE"
              ? "Pasif villa bulunmuyor."
              : filter?.isPromoted
              ? "Öne çıkarılmış villa bulunmuyor. Villaları öne çıkarmak için düzenleme menüsünden işlem yapabilirsiniz."
              : "Hiç villa bulunmuyor. Yeni bir villa ekleyin."}
          </p>
        </div>
      </div>
    )
  }

  return <VillaTable data={villas} />
} 