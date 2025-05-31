'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, Check, ChevronsUpDown, Image as ImageIcon } from 'lucide-react' 
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { VillaSEO, VillaSEOFormData } from '@/types'

interface Villa {
  id: string
  title: string
  slug: string
}

interface VillaCoverImage {
  id: string
  imageUrl: string
  title: string | null
  altText: string | null
}

interface VillaSEOFormProps {
  onSubmit: (data: VillaSEOFormData & { villaId: string }) => Promise<void>
  onCancel: () => void
  initialData?: VillaSEO
  villaId?: string
  villaTitle?: string
  loading?: boolean
}

export function VillaSEOForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  villaId = '',
  villaTitle = '',
  loading = false 
}: VillaSEOFormProps) {
  const [formData, setFormData] = useState<VillaSEOFormData>({
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    metaKeywords: initialData?.metaKeywords || '',
    ogTitle: initialData?.ogTitle || '',
    ogDescription: initialData?.ogDescription || '',
    ogImage: initialData?.ogImage || '',
    noIndex: initialData?.noIndex || false,
  })

  const [selectedVillaId, setSelectedVillaId] = useState<string>(villaId)
  const [villas, setVillas] = useState<Villa[]>([])
  const [villasLoading, setVillasLoading] = useState(false)
  const [villaSearchOpen, setVillaSearchOpen] = useState(false)
  const [villaSearch, setVillaSearch] = useState('')
  const [coverImageLoading, setCoverImageLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Villa listesini getir fonksiyonu
  const fetchVillas = useCallback(async () => {
    try {
      setVillasLoading(true)
      const { data, error } = await supabase
        .from('Villa')
        .select('id, title, slug')
        .eq('status', 'ACTIVE')
        .order('title')

      if (error) throw error
      setVillas(data || [])
    } catch (err) {
      console.error('Villa listesi getirilirken hata:', err)
    } finally {
      setVillasLoading(false)
    }
  }, [supabase])

  // Villa listesini getir (sadece düzenleme modunda değilse)
  useEffect(() => {
    if (!initialData) {
      fetchVillas()
    }
  }, [initialData, fetchVillas])

  // Villa'nın cover image'ını getir
  const fetchVillaCoverImage = async (villaId: string): Promise<VillaCoverImage | null> => {
    try {
      setCoverImageLoading(true)
      const { data, error } = await supabase
        .from('VillaImage')
        .select('id, imageUrl, title, altText')
        .eq('villaId', villaId)
        .eq('isCoverImage', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116: No rows found
      return data || null
    } catch (err) {
      console.error('Villa cover image getirilirken hata:', err)
      return null
    } finally {
      setCoverImageLoading(false)
    }
  }

  // Filtrelenmiş villa listesi (arama için)
  const filteredVillas = useMemo(() => {
    if (!villaSearch) return villas
    
    const search = villaSearch.toLowerCase()
    return villas.filter(villa => 
      villa.title.toLowerCase().includes(search) ||
      villa.slug.toLowerCase().includes(search)
    )
  }, [villas, villaSearch])

  // Seçilen villa bilgisi
  const selectedVilla = villas.find(villa => villa.id === selectedVillaId)

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedVillaId) {
      newErrors.villaId = 'Villa seçimi zorunludur'
    }

    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta başlık 60 karakteri geçmemelidir'
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta açıklama 160 karakteri geçmemelidir'
    }

    if (formData.ogTitle && formData.ogTitle.length > 60) {
      newErrors.ogTitle = 'OG başlık 60 karakteri geçmemelidir'
    }

    if (formData.ogDescription && formData.ogDescription.length > 160) {
      newErrors.ogDescription = 'OG açıklama 160 karakteri geçmemelidir'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    await onSubmit({ ...formData, villaId: selectedVillaId })
  }

  const handleInputChange = (field: keyof VillaSEOFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleVillaSelect = async (villaId: string) => {
    setSelectedVillaId(villaId)
    setVillaSearchOpen(false)
    setVillaSearch('')
    
    // Clear villa error
    if (errors.villaId) {
      setErrors(prev => ({ ...prev, villaId: '' }))
    }

    // OG Image alanı boşsa villa'nın cover image'ını otomatik doldur
    if (!formData.ogImage) {
      const coverImage = await fetchVillaCoverImage(villaId)
      if (coverImage?.imageUrl) {
        setFormData(prev => ({ 
          ...prev, 
          ogImage: coverImage.imageUrl 
        }))
      }
    }
  }

  // OG Image alanına villa cover image'ını manuel olarak yükleme
  const handleLoadCoverImage = async () => {
    if (!selectedVillaId) return
    
    const coverImage = await fetchVillaCoverImage(selectedVillaId)
    if (coverImage?.imageUrl) {
      setFormData(prev => ({ 
        ...prev, 
        ogImage: coverImage.imageUrl 
      }))
    }
  }

  return (
    <div className="space-y-8">
      {/* Form Header */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold">
          {initialData ? 'SEO Bilgilerini Düzenle' : 'SEO Bilgileri Ekle'}
        </h2>
        {villaTitle && (
          <p className="text-sm text-muted-foreground mt-1">
            Villa: {villaTitle}
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Villa Seçimi (sadece yeni ekleme modunda) */}
        {!initialData && (
          <div className="space-y-3">
            <Label htmlFor="villa" className="text-base font-medium">
              Villa Seçin *
            </Label>
            <Popover open={villaSearchOpen} onOpenChange={setVillaSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={villaSearchOpen}
                  className="w-full justify-between h-11"
                  disabled={villasLoading}
                >
                  {selectedVilla ? (
                    <span className="truncate">
                      {selectedVilla.title} <span className="text-muted-foreground">({selectedVilla.slug})</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {villasLoading ? 'Villalar yükleniyor...' : 'Villa seçin...'}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Villa ara (isim veya slug)..." 
                    value={villaSearch}
                    onValueChange={setVillaSearch}
                    className="h-11"
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>
                      {villasLoading ? 'Villalar yükleniyor...' : 'Villa bulunamadı.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredVillas.map((villa) => (
                        <CommandItem
                          key={villa.id}
                          value={`${villa.title} ${villa.slug}`}
                          onSelect={() => handleVillaSelect(villa.id)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{villa.title}</span>
                            <span className="text-xs text-muted-foreground">/{villa.slug}</span>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedVillaId === villa.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {!villasLoading && (
              <p className="text-xs text-muted-foreground">
                {villas.length} villa mevcut. Villa seçtiğinizde cover image otomatik yüklenecek.
              </p>
            )}
            {errors.villaId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.villaId}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* SEO Bilgileri Bölümü */}
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-lg font-medium">Meta Bilgileri</h3>
            <p className="text-sm text-muted-foreground">Arama motorları için temel SEO bilgileri</p>
          </div>

          {/* Meta Title */}
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="text-sm font-medium">Meta Başlık</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle || ''}
              onChange={(e) => handleInputChange('metaTitle', e.target.value)}
              placeholder="Arama sonuçlarında görünecek başlık"
              maxLength={70}
              className="h-11"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Önerilen: 50-60 karakter</span>
              <span className={cn(
                (formData.metaTitle || '').length > 60 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {(formData.metaTitle || '').length}/70
              </span>
            </div>
            {errors.metaTitle && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.metaTitle}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Açıklama</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription || ''}
              onChange={(e) => handleInputChange('metaDescription', e.target.value)}
              placeholder="Arama sonuçlarında başlık altında görünecek açıklama"
              rows={3}
              maxLength={170}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Önerilen: 150-160 karakter</span>
              <span className={cn(
                (formData.metaDescription || '').length > 160 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {(formData.metaDescription || '').length}/170
              </span>
            </div>
            {errors.metaDescription && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.metaDescription}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Meta Keywords */}
          <div className="space-y-2">
            <Label htmlFor="metaKeywords" className="text-sm font-medium">Meta Anahtar Kelimeler</Label>
            <Input
              id="metaKeywords"
              value={formData.metaKeywords || ''}
              onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
              placeholder="villa, kiralama, tatil, antalya (virgülle ayırın)"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Anahtar kelimeleri virgülle ayırın. Maksimum 5-10 kelime önerilir.
            </p>
          </div>
        </div>

        {/* Open Graph Bölümü */}
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-lg font-medium">Open Graph (Sosyal Medya)</h3>
            <p className="text-sm text-muted-foreground">Facebook, Twitter ve diğer sosyal medya platformları için</p>
          </div>

          {/* OG Title */}
          <div className="space-y-2">
            <Label htmlFor="ogTitle" className="text-sm font-medium">Open Graph Başlık</Label>
            <Input
              id="ogTitle"
              value={formData.ogTitle || ''}
              onChange={(e) => handleInputChange('ogTitle', e.target.value)}
              placeholder="Sosyal medya paylaşımlarında görünecek başlık"
              maxLength={70}
              className="h-11"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sosyal medya platformlarında görünür</span>
              <span className={cn(
                (formData.ogTitle || '').length > 60 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {(formData.ogTitle || '').length}/70
              </span>
            </div>
            {errors.ogTitle && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.ogTitle}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <Label htmlFor="ogDescription" className="text-sm font-medium">Open Graph Açıklama</Label>
            <Textarea
              id="ogDescription"
              value={formData.ogDescription || ''}
              onChange={(e) => handleInputChange('ogDescription', e.target.value)}
              placeholder="Sosyal medya paylaşımlarında görünecek açıklama"
              rows={3}
              maxLength={170}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sosyal medya platformlarında görünür</span>
              <span className={cn(
                (formData.ogDescription || '').length > 160 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {(formData.ogDescription || '').length}/170
              </span>
            </div>
            {errors.ogDescription && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.ogDescription}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ogImage" className="text-sm font-medium">Open Graph Resim URL</Label>
              {selectedVillaId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadCoverImage}
                  disabled={coverImageLoading}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-3 w-3" />
                  {coverImageLoading ? 'Yükleniyor...' : 'Villa Cover Resmi Yükle'}
                </Button>
              )}
            </div>
            <Input
              id="ogImage"
              value={formData.ogImage || ''}
              onChange={(e) => handleInputChange('ogImage', e.target.value)}
              placeholder="https://example.com/villa-image.jpg"
              type="url"
              className="h-11"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Sosyal medya paylaşımlarında görünecek resim URL&apos;si. Önerilen boyut: 1200x630px</p>
            </div>
          </div>
        </div>

        {/* Gelişmiş Ayarlar */}
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-lg font-medium">Gelişmiş Ayarlar</h3>
            <p className="text-sm text-muted-foreground">Özel SEO yapılandırmaları</p>
          </div>

          {/* No Index */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="noIndex" className="text-sm font-medium">Arama Motorlarından Gizle</Label>
              <p className="text-xs text-muted-foreground">
                Bu sayfa arama sonuçlarında görünmeyecek (noindex)
              </p>
            </div>
            <Switch
              id="noIndex"
              checked={formData.noIndex}
              onCheckedChange={(checked) => handleInputChange('noIndex', checked)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-6"
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !selectedVillaId}
            className="px-6"
          >
            {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Kaydet')}
          </Button>
        </div>
      </form>
    </div>
  )
} 