"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconEdit,
  IconTrash,
  IconPlus,
  IconDeviceFloppy,
  IconCircleX,
} from "@tabler/icons-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format, isAfter } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

// Şema tanımı - veritabanı yapısı ile uyumlu
export const schema = z.object({
  id: z.string(),
  villaId: z.string(),
  seasonName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  nightlyPrice: z.number(),
  weeklyPrice: z.number().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
})

// Veritabanı tiplerini kullanalım
type SeasonalPriceRow = z.infer<typeof schema>

// Sezonsal fiyat düzenleme/görüntüleme diyaloğu
function EditSeasonalPriceDialog({ 
  item, 
  onUpdated 
}: { 
  item: SeasonalPriceRow, 
  onUpdated: () => void 
}) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState<SeasonalPriceRow>({...item})
  
  // Supabase istemcisini oluştur
  const supabase = createClient()
  
  // Form değişikliklerini izle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: target.checked }))
    } else if (type === "number") {
      if (name === "nightlyPrice") {
        // Gecelik fiyat değiştiğinde haftalık fiyatı da güncelle (7 katı olarak)
        const numValue = value === "" ? 0 : Number(value)
        setFormData(prev => ({ 
          ...prev, 
          nightlyPrice: numValue,
          weeklyPrice: numValue * 7
        }) as SeasonalPriceRow)
      } else {
        setFormData(prev => ({ ...prev, [name]: value === "" ? null : Number(value) }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  // Form gönderme işlemi - Güncelleme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Tarih doğrulaması
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (isAfter(startDate, endDate)) {
        throw new Error("Başlangıç tarihi bitiş tarihinden sonra olamaz")
      }
      
      // SeasonalPrice kaydını güncelle
      const { error } = await supabase
        .from("SeasonalPrice")
        .update({
          seasonName: formData.seasonName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nightlyPrice: formData.nightlyPrice,
          weeklyPrice: formData.weeklyPrice,
          description: formData.description,
          isActive: formData.isActive
        })
        .eq("id", formData.id)
        .select()
      
      if (error) {
        // Benzersizlik hatası kontrolü
        if (error.code === '23505' && error.message.includes('seasonalprice_villaid_startdate_enddate_key')) {
          throw new Error("Bu tarih aralığında zaten bir fiyat tanımı var.")
        }
        throw error
      }
      
      toast.success("Sezon fiyatı başarıyla güncellendi")
      onUpdated() // Veri listesini yenile
      setOpen(false)
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      console.error("Güncelleme hatası:", error)
      toast.error(`Sezon fiyatı güncellenirken hata oluştu: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <IconEdit className="size-4" />
          <span className="sr-only">Düzenle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sezon Fiyatı Düzenle</DialogTitle>
          <DialogDescription>
            Sezon fiyat bilgilerini güncelleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seasonName" className="text-right">
                Sezon Adı
              </Label>
              <Input
                id="seasonName"
                name="seasonName"
                value={formData.seasonName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Başlangıç Tarihi
              </Label>
              <Input 
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate.split('T')[0]} // ISO tarihini yyyy-mm-dd formatına dönüştür
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Bitiş Tarihi
              </Label>
              <Input 
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate.split('T')[0]} // ISO tarihini yyyy-mm-dd formatına dönüştür
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nightlyPrice" className="text-right">
                Gecelik Fiyat
              </Label>
              <Input
                id="nightlyPrice"
                name="nightlyPrice"
                type="number"
                step="0.01"
                value={formData.nightlyPrice}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weeklyPrice" className="text-right">
                Haftalık Fiyat
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="weeklyPrice"
                  name="weeklyPrice"
                  type="number"
                  step="0.01"
                  value={formData.weeklyPrice ?? ""}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="İsteğe bağlı"
                />
                <p className="text-xs text-muted-foreground">
                  Gecelik fiyatın 7 katı otomatik olarak hesaplanır
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Aktif
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: !!checked }))
                  }
                />
                <Label
                  htmlFor="isActive"
                  className="font-normal"
                >
                  Sezon fiyatı aktif mi?
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <IconCircleX className="mr-2 size-4" />
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 size-4" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Sezon fiyatı silme diyaloğu
function DeleteSeasonalPriceDialog({
  id,
  name,
  onDeleted
}: {
  id: string;
  name: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Supabase istemcisini oluştur
  const supabase = createClient()
  
  // Silme işlemi
  const handleDelete = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from("SeasonalPrice")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      
      toast.success(`${name} sezon fiyatı başarıyla silindi`)
      onDeleted() // Veri listesini yenile
      setOpen(false)
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      console.error("Silme hatası:", error)
      toast.error(`Sezon fiyatı silinirken hata oluştu: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600">
          <IconTrash className="size-4" />
          <span className="sr-only">Sil</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sezon Fiyatı Sil</DialogTitle>
          <DialogDescription>
            &quot;{name}&quot; sezon fiyatını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-amber-600 text-sm">
            Bu sezon fiyatı ile ilişkili tüm takvim bilgileri de silinecektir.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            <IconCircleX className="mr-2 size-4" />
            İptal
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Siliniyor...
              </>
            ) : (
              <>
                <IconTrash className="mr-2 size-4" />
                Evet, Sil
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Yeni sezon fiyatı ekleme diyaloğu - düzenlenen kısım
function AddSeasonalPriceDialog({ defaultVillaId }: { defaultVillaId?: string }) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    villaId: defaultVillaId || "",
    seasonName: "",
    startDate: "",
    endDate: "",
    nightlyPrice: 0,
    weeklyPrice: null as number | null,
    description: "",
    isActive: true
  })

  // Villa arama ve seçim durumu
  const [villaSearch, setVillaSearch] = React.useState("")
  const [villas, setVillas] = React.useState<{ id: string, title: string }[]>([])
  const [isLoadingVillas, setIsLoadingVillas] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const villasPerPage = 20
  
  // Supabase istemcisini oluştur
  const supabase = createClient()

  // Form değişikliklerini izle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: target.checked }))
    } else if (type === "number") {
      if (name === "nightlyPrice") {
        // Gecelik fiyat değiştiğinde haftalık fiyatı da güncelle (7 katı olarak)
        const numValue = value === "" ? 0 : Number(value)
        setFormData(prev => ({ 
          ...prev, 
          nightlyPrice: numValue,
          weeklyPrice: numValue * 7
        }) as typeof formData)
      } else {
        setFormData(prev => ({ ...prev, [name]: value === "" ? null : Number(value) }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Villa arama fonksiyonu - villa ID sabitlenmişse gerek yok
  const searchVillas = React.useCallback(
    async (searchTerm: string, pageNum = 1, append = false) => {
      // Villa ID zaten belirtilmişse ve form için ayarlanmışsa, villa aramaya gerek yok
      if (defaultVillaId) {
        // Sadece mevcut villayı yükle
        setIsLoadingVillas(true);
        try {
          const { data, error } = await supabase
            .from("Villa")
            .select("id, title")
            .eq("id", defaultVillaId)
            .single();
            
          if (error) throw error;
          
          if (data) {
            const villaData = { id: data.id, title: data.title };
            setVillas([villaData]);
            setFormData(prev => ({ ...prev, villaId: data.id }));
          }
        } catch (error) {
          console.error("Villa bilgisi yüklenirken hata oluştu:", error);
        } finally {
          setIsLoadingVillas(false);
        }
        return;
      }
      
      // Eğer defaultVillaId yoksa normal villa arama işlemi yapılır
      setIsLoadingVillas(true)
      try {
        let query = supabase
          .from("Villa")
          .select("id, title")
          .eq("status", "ACTIVE")
          .order("title")
          .range((pageNum - 1) * villasPerPage, pageNum * villasPerPage - 1)
        
        // Arama terimi varsa filtre ekle
        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`)
        }
        
        const { data, error } = await query
        
        if (error) {
          throw error
        }
        
        // Sadeleştirilmiş veri formatı - bölge bilgisi yok
        const formattedData = data.map(villa => ({
          id: villa.id,
          title: villa.title
        }))
        
        // Sayfalama için son sayfa kontrolü
        setHasMore(formattedData.length === villasPerPage)
        
        // Append modunda varolan verilere ekle, değilse üzerine yaz
        if (append) {
          setVillas(prev => [...prev, ...formattedData])
        } else {
          setVillas(formattedData)
        }
        
        // İlk villa seçimini yap (sadece ilk yüklemede)
        if (pageNum === 1 && formattedData.length > 0 && !formData.villaId) {
          setFormData(prev => ({ ...prev, villaId: formattedData[0].id }))
        }
      } catch (error) {
        console.error("Villa arama hatası:", error)
        toast.error("Villalar yüklenirken bir hata oluştu")
      } finally {
        setIsLoadingVillas(false)
      }
    },
    [supabase, formData.villaId, defaultVillaId]
  )
  
  // Dialog açıldığında villaları yükle
  React.useEffect(() => {
    if (open) {
      setPage(1)
      const initialSearch = villaSearch || ""
      searchVillas(initialSearch, 1, false)
    }
  }, [open, searchVillas, villaSearch])
  
  // Arama değişikliklerinde gecikme (debounce) ile arama yap
  React.useEffect(() => {
    // Villa ID sabitlenmişse arama yapmaya gerek yok
    if (!open || defaultVillaId) return
    
    const handler = setTimeout(() => {
      setPage(1)
      searchVillas(villaSearch, 1, false)
    }, 300)
    
    return () => {
      clearTimeout(handler)
    }
  }, [villaSearch, open, searchVillas, defaultVillaId])
  
  // Sayfa yükleme fonksiyonu
  const loadMoreVillas = () => {
    if (isLoadingVillas || !hasMore) return
    
    const nextPage = page + 1
    setPage(nextPage)
    searchVillas(villaSearch, nextPage, true)
  }

  // Form gönderme işlemi - güncellenmiş hali
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Form doğrulaması
      if (!formData.villaId) {
        throw new Error("Lütfen bir villa seçin")
      }
      
      if (!formData.startDate || !formData.endDate) {
        throw new Error("Başlangıç ve bitiş tarihleri gereklidir")
      }
      
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (startDate > endDate) {
        throw new Error("Başlangıç tarihi bitiş tarihinden sonra olamaz")
      }

      // SeasonalPrice kaydı ekle - veritabanı yapısıyla uyumlu
      const { error } = await supabase
        .from("SeasonalPrice")
        .insert([
          {
            villaId: formData.villaId,
            seasonName: formData.seasonName,
            startDate: formData.startDate,
            endDate: formData.endDate,
            nightlyPrice: formData.nightlyPrice,
            weeklyPrice: formData.weeklyPrice,
            description: formData.description,
            isActive: formData.isActive
          }
        ])

      if (error) {
        // Benzersizlik hatası kontrolü
        if (error.code === '23505' && error.message.includes('seasonalprice_villaid_startdate_enddate_key')) {
          throw new Error("Bu tarih aralığında zaten bir fiyat tanımı var.")
        }
        throw error
      }

      toast.success("Sezon fiyatı başarıyla eklendi")
      setOpen(false)
      
      // Formu sıfırla
      setFormData({
        villaId: defaultVillaId || "",
        seasonName: "",
        startDate: "",
        endDate: "",
        nightlyPrice: 0,
        weeklyPrice: null,
        description: "",
        isActive: true
      })
      
      // Sayfa yenileme için olay fırlat
      window.dispatchEvent(new CustomEvent("refreshSeasonalPrices"))
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      console.error("Kayıt ekleme hatası:", errorMessage)
      toast.error(errorMessage || "Sezon fiyatı eklenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Seçili villanın adını bul
  const selectedVillaName = React.useMemo(() => {
    const selected = villas.find(v => v.id === formData.villaId)
    return selected ? selected.title : "Villa seçin"
  }, [villas, formData.villaId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="mr-2 size-4" />
          Yeni Sezon Fiyatı Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Sezon Fiyatı Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir sezon fiyatı oluşturmak için bilgileri doldurun
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Villa seçimi - sadece sabit bir villa ID yoksa göster */}
            {!defaultVillaId ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Villa
                </Label>
                <div className="col-span-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        disabled={isLoadingVillas && villas.length === 0}
                      >
                        <span className="truncate">
                          {isLoadingVillas && villas.length === 0 
                            ? "Villalar yükleniyor..." 
                            : selectedVillaName}
                        </span>
                        <IconChevronDown className="ml-2 size-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-auto p-0" align="start">
                      <div className="p-2 sticky top-0 bg-background border-b z-10">
                        <div className="relative">
                          <Input
                            placeholder="Villa ara..."
                            value={villaSearch}
                            onChange={(e) => setVillaSearch(e.target.value)}
                            className="pr-8"
                          />
                          {villaSearch && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setVillaSearch("")}
                            >
                              <IconCircleX className="size-4" />
                              <span className="sr-only">Temizle</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {isLoadingVillas && villas.length === 0 ? (
                        <div className="flex items-center justify-center p-4">
                          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : villas.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground">
                          Sonuç bulunamadı
                        </div>
                      ) : (
                        <>
                          {villas.map((villa) => (
                            <DropdownMenuItem
                              key={villa.id}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, villaId: villa.id }))
                              }}
                              className={`py-2 px-3 cursor-pointer ${formData.villaId === villa.id ? "bg-muted" : ""}`}
                            >
                              {villa.title}
                            </DropdownMenuItem>
                          ))}
                          
                          {hasMore && (
                            <div className="p-2 border-t">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={loadMoreVillas}
                                disabled={isLoadingVillas}
                              >
                                {isLoadingVillas ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Yükleniyor...
                                  </>
                                ) : (
                                  "Daha fazla göster"
                                )}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              // Villa ID sabitlenmişse sadece seçili villayı göster
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Villa
                </Label>
                <div className="col-span-3">
                  <div className="border rounded-md px-3 py-2 bg-muted">
                    {isLoadingVillas ? (
                      <span className="text-muted-foreground">Villa bilgisi yükleniyor...</span>
                    ) : villas.length > 0 ? (
                      <span>{villas[0].title}</span>
                    ) : (
                      <span className="text-muted-foreground">Villa bulunamadı</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seasonName" className="text-right">
                Sezon Adı
              </Label>
              <Input
                id="seasonName"
                name="seasonName"
                value={formData.seasonName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Başlangıç Tarihi
              </Label>
              <Input 
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Bitiş Tarihi
              </Label>
              <Input 
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nightlyPrice" className="text-right">
                Gecelik Fiyat
              </Label>
              <Input
                id="nightlyPrice"
                name="nightlyPrice"
                type="number"
                step="0.01"
                value={formData.nightlyPrice}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weeklyPrice" className="text-right">
                Haftalık Fiyat
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="weeklyPrice"
                  name="weeklyPrice"
                  type="number"
                  step="0.01"
                  value={formData.weeklyPrice ?? ""}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="İsteğe bağlı"
                />
                <p className="text-xs text-muted-foreground">
                  Gecelik fiyatın 7 katı otomatik olarak hesaplanır
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Aktif
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: !!checked }))
                  }
                />
                <Label
                  htmlFor="isActive"
                  className="font-normal"
                >
                  Sezon fiyatı aktif mi?
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <IconCircleX className="mr-2 size-4" />
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ekleniyor...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 size-4" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Sürükle kolu bileşeni
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Yeniden sıralamak için sürükle</span>
    </Button>
  )
}

// Sütun tanımlamaları güncellendi - düzenleme ve silme işlemleri
const columns = ({ onRefresh }: { onRefresh: () => void }): ColumnDef<SeasonalPriceRow>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tümünü seç"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Satırı seç"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "seasonName",
    header: "Sezon Adı",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.seasonName}</div>
    },
    enableHiding: false,
  },
  {
    accessorKey: "startDate",
    header: "Başlangıç Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.original.startDate)
      return (
        <div>
          {format(date, "dd MMM yyyy", { locale: tr })}
        </div>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: "Bitiş Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.original.endDate)
      return (
        <div>
          {format(date, "dd MMM yyyy", { locale: tr })}
        </div>
      )
    },
  },
  {
    accessorKey: "nightlyPrice",
    header: () => <div className="text-right">Gecelik Fiyat</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(row.original.nightlyPrice)}
      </div>
    ),
  },
  {
    accessorKey: "weeklyPrice",
    header: () => <div className="text-right">Haftalık Fiyat</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.weeklyPrice 
          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(row.original.weeklyPrice)
          : "-"}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Durum",
    cell: ({ row }) => (
      <Badge 
        variant={row.original.isActive ? "default" : "outline"} 
        className="px-2"
      >
        {row.original.isActive ? "Aktif" : "Pasif"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <div className="flex justify-center space-x-1">
        <EditSeasonalPriceDialog 
          item={row.original}
          onUpdated={onRefresh}
        />
        <DeleteSeasonalPriceDialog
          id={row.original.id}
          name={row.original.seasonName}
          onDeleted={onRefresh}
        />
      </div>
    ),
  },
]

function DraggableRow({ row }: { row: Row<SeasonalPriceRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function SeasonalPriceDataTable({
  data: initialData,
  villaid
}: {
  data: SeasonalPriceRow[]
  villaid?: string
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Veri yenileme
  const refreshData = React.useCallback(async () => {
    if (!villaid) return
    
    const supabase = createClient()
    try {
      const { data: pricesData, error } = await supabase
        .from("SeasonalPrice")
        .select("*")
        .eq("villaId", villaid)
        .order("startDate", { ascending: true })
        
      if (error) throw error
      
      setData(pricesData || [])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      toast.error(`Sezonsal fiyatlar yenilenemedi: ${errorMessage}`)
    }
  }, [villaid])
  
  // Veri yenileme olayını dinle
  React.useEffect(() => {
    const handleRefresh = () => {
      refreshData()
    }
    
    window.addEventListener("refreshSeasonalPrices", handleRefresh)
    
    return () => {
      window.removeEventListener("refreshSeasonalPrices", handleRefresh)
    }
  }, [refreshData])
  
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }: { id: string }) => id) || [],
    [data]
  )
  
  // Değiştirilmiş sütun tanımlarını kullan - onRefresh için refreshData işlevini ilet
  const tableColumns = React.useMemo(() => columns({ onRefresh: refreshData }), [refreshData])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((currentData: SeasonalPriceRow[]) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(currentData, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Sezon adı ile filtrele..."
            value={(table.getColumn("seasonName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("seasonName")?.setFilterValue(event.target.value)
            }
            className="max-w-xs"
          />
          <Select
            value={(table.getColumn("isActive")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn("isActive")?.setFilterValue(undefined)
              } else {
                table.getColumn("isActive")?.setFilterValue(value === "true")
              }
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sütunlar
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <AddSeasonalPriceDialog defaultVillaId={villaid} />
        </div>
      </div>
      
      <div className="rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Sonuç bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} satır seçildi.
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Sayfa başına</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Sayfa {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">İlk sayfaya git</span>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Önceki sayfaya git</span>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Sonraki sayfaya git</span>
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Son sayfaya git</span>
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
// Tablo hücresi detay görüntüleyici - şimdilik kullanılmıyor
/* eslint-disable @typescript-eslint/no-unused-vars */
function TableCellViewer({ item }: { item: SeasonalPriceRow }) { 
/* eslint-enable @typescript-eslint/no-unused-vars */
  const isMobile = useIsMobile()
  const [startDate, setStartDate] = React.useState<Date>(new Date(item.startDate))
  const [endDate, setEndDate] = React.useState<Date>(new Date(item.endDate))

  // Mobil cihazlar için çekmece, masaüstü için diyalog kutusu kullanma
  const ModalComponent = isMobile ? Drawer : Dialog
  const ModalTrigger = isMobile ? DrawerTrigger : DialogTrigger
  const ModalContent = isMobile ? DrawerContent : DialogContent
  const ModalHeader = isMobile ? DrawerHeader : DialogHeader
  const ModalFooter = isMobile ? DrawerFooter : DialogFooter
  const ModalTitle = isMobile ? DrawerTitle : DialogTitle
  const ModalDescription = isMobile ? DrawerDescription : DialogDescription
  const ModalClose = isMobile ? DrawerClose : Button

  return (
    <ModalComponent>
      <ModalTrigger asChild>
        <Button variant="link" className="text-foreground p-0 text-left">
          {item.seasonName}
        </Button>
      </ModalTrigger>
      <ModalContent className={isMobile ? "" : "sm:max-w-md"}>
        <ModalHeader>
          <ModalTitle>Sezon Fiyatı: {item.seasonName}</ModalTitle>
          <ModalDescription>
            Sezon fiyatı detaylarını görüntüle ve düzenle
          </ModalDescription>
        </ModalHeader>
        <div className="grid gap-4 py-4 px-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seasonName" className="text-right">
              Sezon Adı
            </Label>
            <Input
              id="seasonName"
              defaultValue={item.seasonName}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Başlangıç Tarihi
            </Label>
            <Input 
              id="startDate"
              type="date"
              defaultValue={format(startDate, "yyyy-MM-dd")}
              className="col-span-3"
              onChange={(e) => {
                if (e.target.value) {
                  setStartDate(new Date(e.target.value))
                }
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Bitiş Tarihi
            </Label>
            <Input 
              id="endDate"
              type="date"
              defaultValue={format(endDate, "yyyy-MM-dd")}
              className="col-span-3"
              onChange={(e) => {
                if (e.target.value) {
                  setEndDate(new Date(e.target.value))
                }
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nightlyPrice" className="text-right">
              Gecelik Fiyat
            </Label>
            <Input
              id="nightlyPrice"
              defaultValue={item.nightlyPrice.toString()}
              className="col-span-3"
              type="number"
              step="0.01"
              onChange={(e) => {
                const value = e.target.value === "" ? 0 : Number(e.target.value)
                // Gecelik fiyat değiştiğinde haftalık fiyatı güncelle
                const weeklyInput = document.getElementById("weeklyPrice") as HTMLInputElement
                if (weeklyInput) {
                  weeklyInput.value = (value * 7).toString()
                }
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weeklyPrice" className="text-right">
              Haftalık Fiyat
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="weeklyPrice"
                defaultValue={item.weeklyPrice?.toString() || ""}
                className="w-full"
                type="number"
                step="0.01"
                placeholder="İsteğe bağlı"
              />
              <p className="text-xs text-muted-foreground">
                Gecelik fiyatın 7 katı otomatik olarak hesaplanır
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Aktif
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="isActive"
                defaultChecked={item.isActive}
              />
              <Label
                htmlFor="isActive"
                className="font-normal"
              >
                Sezon fiyatı aktif mi?
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Açıklama
            </Label>
            <Textarea
              id="description"
              defaultValue={item.description || ""}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => toast.success("Değişiklikler kaydedildi!")}>
            Değişiklikleri Kaydet
          </Button>
          {isMobile ? (
            <ModalClose asChild>
              <Button variant="outline">İptal</Button>
            </ModalClose>
          ) : (
            <Button variant="outline">İptal</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </ModalComponent>
  )
}

