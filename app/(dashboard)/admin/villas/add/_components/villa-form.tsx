"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { VillaStatus, type VillaCreate } from "@/types/villa"
import { villaService } from "../../_components/villa-data-service"
import { createClient } from "@/lib/supabase/client"
import { VillaTag } from "@/types/villatag"

// Form şeması - optional ve default tanımlarını çıkar
const villaFormSchema = z.object({
  title: z.string().min(3, {
    message: "Villa başlığı en az 3 karakter olmalıdır",
  }),
  description: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır",
  }),
  slug: z.string().min(3, {
    message: "Slug en az 3 karakter olmalıdır",
  }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug sadece küçük harfler, rakamlar ve tire içerebilir",
  }),
  mainRegion: z.string(),
  subRegion: z.string(),
  regionId: z.string().uuid({
    message: "Geçerli bir bölge ID'si seçiniz",
  }),
  subRegionId: z.string().uuid({
    message: "Geçerli bir alt bölge ID'si seçiniz",
  }),
  deposit: z.coerce.number().positive({
    message: "Depozito pozitif bir sayı olmalıdır",
  }),
  cleaningFee: z.coerce.number().nullable(),
  shortStayDayLimit: z.coerce.number().int().nullable(),
  bedrooms: z.coerce.number().int().positive({
    message: "Yatak odası sayısı pozitif bir tam sayı olmalıdır",
  }),
  bathrooms: z.coerce.number().int().positive({
    message: "Banyo sayısı pozitif bir tam sayı olmalıdır",
  }),
  maxGuests: z.coerce.number().int().positive({
    message: "Maksimum misafir sayısı pozitif bir tam sayı olmalıdır",
  }),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  minimumStay: z.coerce.number().int().positive({
    message: "Minimum konaklama süresi pozitif bir tam sayı olmalıdır",
  }),
  rules: z.array(z.string()),
  tags: z.array(z.string()),
  embedCode: z.string().nullable(),
  status: z.enum([VillaStatus.ACTIVE, VillaStatus.INACTIVE]),
  isPromoted: z.boolean(),
  advancePaymentRate: z.coerce.number().min(0).max(100, {
    message: "Ön ödeme oranı 0-100 arasında olmalıdır",
  }),
  checkInNotes: z.string().nullable(),
  checkOutNotes: z.string().nullable(),
  cancellationNotes: z.string().nullable(),
})

type VillaFormValues = z.infer<typeof villaFormSchema>

// Varsayılan form değerleri - Partial kaldır ve tam tip ver
const defaultValues: VillaFormValues = {
  title: "",
  description: "",
  slug: "",
  mainRegion: "",
  subRegion: "",
  regionId: "",
  subRegionId: "",
  deposit: 0,
  cleaningFee: 0,
  shortStayDayLimit: null,
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  checkInTime: "16:00",
  checkOutTime: "10:00",
  minimumStay: 3,
  rules: [],
  tags: [],
  embedCode: null,
  status: VillaStatus.ACTIVE,
  isPromoted: false,
  advancePaymentRate: 20,
  checkInNotes: null,
  checkOutNotes: null,
  cancellationNotes: null,
}

// Hazır kural listesi
const predefinedRules = [
  "Sigara İçilmez",
  "Evcil Hayvan Giremez",
  "Parti Düzenlenemez",
  "Çocuklara Uygun (2-12)",
  "Bebeklere Uygun (0-2)"
]

interface VillaFormProps {
  regions: Array<{ id: string; name: string; isMainRegion: boolean; parentId: string | null }>;
}

export function VillaForm({ regions }: VillaFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMainRegion, setSelectedMainRegion] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<VillaTag[]>([])

  // Etiketleri yükle
  useEffect(() => {
    const loadTags = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('VillaTag')
        .select('*')
        .order('name')
      
      if (error) {
        console.error("Etiketler yüklenirken hata oluştu:", error)
        return
      }
      
      setAvailableTags(data as VillaTag[])
    }
    
    loadTags()
  }, [])

  // Ana bölgeler ve alt bölgeler
  const mainRegions = regions.filter(r => r.isMainRegion)
  const subRegions = selectedMainRegion 
    ? regions.filter(r => !r.isMainRegion && r.parentId === selectedMainRegion)
    : []

  // Form tanımlaması
  const form = useForm<VillaFormValues>({
    resolver: zodResolver(villaFormSchema),
    defaultValues,
  })

  // Ana bölge değiştiğinde alt bölge alanını sıfırla
  const handleMainRegionChange = (regionId: string) => {
    setSelectedMainRegion(regionId)
    
    const region = regions.find(r => r.id === regionId)
    if (region) {
      form.setValue("regionId", regionId)
      form.setValue("mainRegion", region.name)
      form.setValue("subRegionId", "")
      form.setValue("subRegion", "")
    }
  }

  // Alt bölge değiştiğinde alt bölge adını ayarla
  const handleSubRegionChange = (regionId: string) => {
    const region = regions.find(r => r.id === regionId)
    if (region) {
      form.setValue("subRegionId", regionId)
      form.setValue("subRegion", region.name)
    }
  }

  // Form gönderme işlemi
  async function onSubmit(data: VillaFormValues) {
    try {
      setIsSubmitting(true)
      
      const result = await villaService.createVilla(data as VillaCreate)
      
      // Seçilen etiketleri kaydet
      if (result.id && data.tags.length > 0) {
        const supabase = createClient()
        
        // Her bir etiket için villaId ile bağlantı kur
        for (const tagId of data.tags) {
          await supabase
            .from('VillaTag')
            .update({ villaId: result.id })
            .eq('id', tagId)
        }
      }
      
      toast.success("Villa başarıyla eklendi!")
      
      // Başarılı olursa villa listesine yönlendir
      router.push("/admin/villas")
    } catch (error) {
      console.error("Villa ekleme hatası:", error)
      toast.error("Villa eklenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Temel Bilgiler</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Villa Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Villa adı giriniz" {...field} />
                  </FormControl>
                  <FormDescription>
                    Villanın tam adını giriniz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="villa-adi" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL için kullanılacak benzersiz slug. Sadece küçük harfler, rakamlar ve tire kullanabilirsiniz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Villa hakkında detaylı açıklama" 
                    className="min-h-32"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Villa hakkında detaylı bilgi veriniz.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Bölge Bilgileri</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="regionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ana Bölge</FormLabel>
                  <Select 
                    onValueChange={(value) => handleMainRegionChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ana bölge seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mainRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Villanın bulunduğu ana bölgeyi seçiniz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subRegionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Bölge</FormLabel>
                  <Select 
                    onValueChange={(value) => handleSubRegionChange(value)}
                    defaultValue={field.value}
                    disabled={!selectedMainRegion}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Alt bölge seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Villanın bulunduğu alt bölgeyi seçiniz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Kapasite Bilgileri</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yatak Odası Sayısı</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banyo Sayısı</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxGuests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimum Misafir Sayısı</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Konaklama Koşulları</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="checkInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giriş Saati</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Çıkış Saati</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="minimumStay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Konaklama (gün)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depozito (₺)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cleaningFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temizlik Ücreti (₺) (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      {...field} 
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number.parseFloat(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shortStayDayLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kısa Konaklama Limiti (gün) (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      {...field} 
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number.parseInt(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Bu gün sayısından daha az konaklamalarda kısa konaklama ücreti uygulanır.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="advancePaymentRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ön Ödeme Oranı (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" {...field} />
                </FormControl>
                <FormDescription>
                  Rezervasyon onayı için gerekli ön ödeme oranı (% olarak).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Notlar</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="checkInNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giriş Notları (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Giriş işlemleri ile ilgili bilgiler" 
                      className="min-h-20"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkOutNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Çıkış Notları (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Çıkış işlemleri ile ilgili bilgiler" 
                      className="min-h-20"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="cancellationNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İptal Koşulları (Opsiyonel)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Rezervasyon iptali ile ilgili bilgiler" 
                    className="min-h-20"
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="embedCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Embed Kodu (Opsiyonel)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Harita veya diğer embed kodları" 
                    className="min-h-20"
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Google Maps veya benzeri bir embed kodu ekleyebilirsiniz.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Kurallar ve Etiketler</h2>
          <Separator />
          
          <FormField
            control={form.control}
            name="rules"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Villa Kuralları</FormLabel>
                  <FormDescription>
                    Villa için geçerli olan kuralları seçiniz.
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predefinedRules.map((rule) => (
                    <FormField
                      key={rule}
                      control={form.control}
                      name="rules"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={rule}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(rule)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, rule]
                                    : field.value?.filter(
                                        (value) => value !== rule
                                      );
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {rule}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Villa Etiketleri</FormLabel>
                  <FormDescription>
                    Villa için uygun etiketleri seçiniz.
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTags.map((tag) => (
                    <FormField
                      key={tag.id}
                      control={form.control}
                      name="tags"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={tag.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tag.id)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, tag.id]
                                    : field.value?.filter(
                                        (value) => value !== tag.id
                                      );
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {tag.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Durum</h2>
          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Villa Durumu</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={VillaStatus.ACTIVE}>Aktif</SelectItem>
                      <SelectItem value={VillaStatus.INACTIVE}>Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Aktif villalar sitede gösterilir, pasif villalar gizlenir.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPromoted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Öne Çıkar</FormLabel>
                    <FormDescription>
                      Bu villa sitede öne çıkarılacaktır.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/villas")}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Villa Ekle"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 