"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { VillaForm } from "./_components/villa-edit-form"
import { villaService } from "@/app/(dashboard)/admin/villas/_components/villa-data-service"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SeasonalPriceDataTable } from "./_components/SeasonalPrice-data-table"
import VillaCalendar from "./_components/VillaCalendar"
import VillaAmenityBlock from "./_components/VillaAmenityBlock"
import type { Villa as VillaType } from "@/types/villa"
import type { schema as seasonalPriceSchema } from "./_components/SeasonalPrice-data-table"
import VillaImageUploader from "./_components/VillaImageUploader"

interface Region {
  id: string;
  name: string;
  isMainRegion: boolean;
  parentId: string | null;
}

// Sezonsal fiyat tipi için doğru tip tanımı
type SeasonalPrice = typeof seasonalPriceSchema._type;

export default function EditVillaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const villaId = resolvedParams.id;
  
  const [villa, setVilla] = useState<VillaType | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const villaData = await villaService.getVilla(villaId)
        
        const supabase = createClient()
        const { data: regionsData } = await supabase
          .from("Region")
          .select("id, name, isMainRegion, parentId")
          .order("name")
          
        // Sezonsal fiyatları da yükle
        const { data: pricesData } = await supabase
          .from("SeasonalPrice")
          .select("*")
          .eq("villaId", villaId)
          .order("startDate", { ascending: true })
        
        setVilla(villaData)
        setRegions(regionsData || [])
        setSeasonalPrices(pricesData || [])
      } catch (err) {
        console.error("Veri yüklenirken hata oluştu:", err)
        setError("Villa verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.")
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [villaId])
  
  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p>Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    );
  }
  
  if (!villa) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-amber-500 py-8">Villa bulunamadı.</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Villa Düzenle</h1>
          <p className="text-muted-foreground text-gray-500">
            Villa bilgilerini güncelleyin.
          </p>
        </div>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="details">Villa Detayları</TabsTrigger>
            <TabsTrigger value="images">Resim Galerisi</TabsTrigger>
            <TabsTrigger value="seasonal-prices">Sezonsal Fiyatlar</TabsTrigger>
            <TabsTrigger value="calendar">Müsaitlik Takvimi</TabsTrigger>
            <TabsTrigger value="amenities">Villa Olanakları</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <VillaForm regions={regions} villa={villa} />
          </TabsContent>
          
          <TabsContent value="images">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-6">Villa Resim Galerisi</h3>
              <VillaImageUploader villaId={villaId} />
            </div>
          </TabsContent>
          
          <TabsContent value="seasonal-prices">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-6">Sezonsal Fiyat Yönetimi</h3>
              <SeasonalPriceDataTable data={seasonalPrices} villaid={villaId} />
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-6">Müsaitlik Takvimi</h3>
              <VillaCalendar villaId={villaId} minimumStay={villa.minimumStay || 1} />
            </div>
          </TabsContent>
          
          <TabsContent value="amenities">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-6">Villa Olanakları</h3>
              <VillaAmenityBlock />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
