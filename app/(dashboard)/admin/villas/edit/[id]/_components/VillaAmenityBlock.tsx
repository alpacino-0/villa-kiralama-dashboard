"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"

// Standart villa olanakları listesi
const AMENITY_OPTIONS = [
  { id: "pool", name: "Yüzme Havuzu" },
  { id: "wifi", name: "Wi-Fi" },
  { id: "ac", name: "Klima" },
  { id: "kitchen", name: "Tam Donanımlı Mutfak" },
  { id: "washer", name: "Çamaşır Makinesi" },
  { id: "bbq", name: "Barbekü" },
  { id: "parking", name: "Özel Otopark" },
  { id: "tv", name: "TV" },
  { id: "dishwasher", name: "Bulaşık Makinesi" },
  { id: "gardenfurniture", name: "Bahçe Mobilyası" },
  { id: "heatedpool", name: "Isıtmalı Havuz" },
  { id: "jacuzzi", name: "Jakuzi" },
  { id: "sauna", name: "Sauna" },
  { id: "gameconsole", name: "Oyun Konsolu" },
  { id: "childrensplayground", name: "Çocuk Oyun Alanı" },
  { id: "securitycamera", name: "Güvenlik Kamerası" }
]

export default function VillaAmenityBlock() {
  const params = useParams<{ id: string }>()
  const villaId = params.id
  
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [existingAmenities, setExistingAmenities] = useState<{id: string, name: string}[]>([])
  const [customAmenities, setCustomAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState<string>("")
  
  useEffect(() => {
    async function fetchVillaAmenities() {
      try {
        setLoading(true)
        setError(null)
        
        const supabase = createClient()
        const { data, error } = await supabase
          .from("VillaAmenity")
          .select("*")
          .eq("villaId", villaId)
          .range(0, 49) // İlk 50 sonucu al
        
        if (error) {
          throw new Error(`Villa olanakları getirilirken bir hata oluştu: ${error.message}`)
        }
        
        // Mevcut olanakları sakla
        setExistingAmenities(data || [])
        
        // Mevcut olanakları seçili olarak işaretle
        const currentAmenities = data?.map(amenity => amenity.name) || []
        setSelectedAmenities(currentAmenities)
        
        // Standart dışı özel olanakları ayır
        const standardAmenityNames = AMENITY_OPTIONS.map(opt => opt.name)
        const custom = currentAmenities.filter(name => !standardAmenityNames.includes(name))
        setCustomAmenities(custom)
      } catch (err) {
        console.error("Villa olanakları yüklenirken hata:", err)
        setError(err instanceof Error ? err.message : "Villa olanakları yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    
    if (villaId) {
      fetchVillaAmenities()
    }
  }, [villaId])
  
  const handleAmenityChange = (amenityName: string, checked: boolean) => {
    setSelectedAmenities(prev => {
      if (checked) {
        return [...prev, amenityName]
      }
      return prev.filter(item => item !== amenityName)
    })
  }
  
  const addCustomAmenity = () => {
    if (!newAmenity.trim()) {
      toast.error("Lütfen bir olanak adı giriniz")
      return
    }
    
    // Aynı isimde olanak zaten varsa ekleme
    if (selectedAmenities.includes(newAmenity.trim())) {
      toast.error("Bu olanak zaten eklenmiş")
      return
    }
    
    // Özel olanak listesine ekle
    setCustomAmenities(prev => [...prev, newAmenity.trim()])
    
    // Seçili olanaklar listesine de ekle
    setSelectedAmenities(prev => [...prev, newAmenity.trim()])
    
    // Input alanını temizle
    setNewAmenity("")
    
    toast.success("Özel olanak eklendi")
  }
  
  const removeCustomAmenity = (name: string) => {
    // Özel olanak listesinden kaldır
    setCustomAmenities(prev => prev.filter(item => item !== name))
    
    // Seçili olanaklar listesinden de kaldır
    setSelectedAmenities(prev => prev.filter(item => item !== name))
  }
  
  const saveAmenities = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const supabase = createClient()
      
      // Seçili olmayan olanakları silmek için
      const amenityNamesToDelete = existingAmenities
        .filter(existingAmenity => !selectedAmenities.includes(existingAmenity.name))
        .map(item => item.id)
      
      // Yeni eklenmesi gereken olanakları bul
      const existingNames = existingAmenities.map(item => item.name)
      const newAmenitiesToInsert = selectedAmenities
        .filter(name => !existingNames.includes(name))
        .map(name => ({
          villaId,
          name
        }))
      
      // Silme işlemini gerçekleştir (gerekirse)
      if (amenityNamesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("VillaAmenity")
          .delete()
          .in('id', amenityNamesToDelete)
        
        if (deleteError) {
          throw new Error(`Olanaklar silinirken hata oluştu: ${deleteError.message}`)
        }
      }
      
      // Yeni olanakları ekle (gerekirse)
      if (newAmenitiesToInsert.length > 0) {
        const { data, error: insertError } = await supabase
          .from("VillaAmenity")
          .insert(newAmenitiesToInsert)
          .select()
        
        if (insertError) {
          throw new Error(`Yeni olanaklar eklenirken hata oluştu: ${insertError.message}`)
        }
        
        // Eklenen olanakları mevcut olanlara ekle
        if (data) {
          setExistingAmenities(prev => [...prev, ...data])
        }
      }
      
      toast.success("Villa olanakları başarıyla güncellendi")
    } catch (err) {
      console.error("Olanaklar kaydedilirken hata:", err)
      setError(err instanceof Error ? err.message : "Olanaklar kaydedilemedi")
      toast.error("Villa olanakları güncellenirken bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3">Olanaklar yükleniyor...</span>
      </div>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Villa Olanakları</CardTitle>
        <CardDescription>
          Bu villada mevcut olan olanakları seçin. Bu olanaklar misafirlere gösterilecektir.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Özel Olanak Ekle</h3>
          <div className="flex gap-2">
            <Input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Örn: Deniz Manzarası"
              className="flex-1"
            />
            <Button 
              onClick={addCustomAmenity}
              type="button"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>
        </div>
        
        {customAmenities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Özel Olanaklar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAmenities.map((amenity, index) => (
                <div key={`custom-${index}`} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`custom-amenity-${index}`}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={(checked) => 
                        handleAmenityChange(amenity, checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`custom-amenity-${index}`}
                      className="cursor-pointer"
                    >
                      {amenity}
                    </Label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeCustomAmenity(amenity)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium mb-3">Standart Olanaklar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AMENITY_OPTIONS.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`amenity-${amenity.id}`}
                  checked={selectedAmenities.includes(amenity.name)}
                  onCheckedChange={(checked) => 
                    handleAmenityChange(amenity.name, checked === true)
                  }
                />
                <Label 
                  htmlFor={`amenity-${amenity.id}`}
                  className="cursor-pointer"
                >
                  {amenity.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          <span className="text-sm text-muted-foreground">
            Seçili olanaklar: {selectedAmenities.length} (Standart: {selectedAmenities.filter(name => 
              AMENITY_OPTIONS.some(opt => opt.name === name)
            ).length}, Özel: {customAmenities.length})
          </span>
        </div>
        <Button 
          onClick={saveAmenities} 
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <span className="animate-spin mr-2">◌</span>
              Kaydediliyor...
            </>
          ) : "Olanakları Kaydet"}
        </Button>
      </CardFooter>
    </Card>
  )
} 