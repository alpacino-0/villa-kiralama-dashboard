'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Home, Users, Bed, Bath, Tag, Star, Wand2, Save, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';
import type { VillaSEOFormData } from '@/types/villaSEO';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Villa seçimi için tip tanımları
interface VillaSearchResult {
  id: string;
  title: string;
  description: string;
  slug: string;
  mainRegion: string;
  subRegion: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
}

interface VillaWithDetails extends VillaSearchResult {
  tags: string[];
  amenities: string[];
}

export default function AIContentComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VillaSearchResult[]>([]);
  const [selectedVilla, setSelectedVilla] = useState<VillaWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiGeneratedSEO, setAiGeneratedSEO] = useState<VillaSEOFormData | null>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [isSavingSEO, setIsSavingSEO] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [villaSearchOpen, setVillaSearchOpen] = useState(false);
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Villa arama fonksiyonu - useCallback ile optimize edildi
  const searchVillas = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Villa')
        .select('id, title, description, slug, mainRegion, subRegion, bedrooms, bathrooms, maxGuests')
        .or(`title.ilike.%${query}%, description.ilike.%${query}%, mainRegion.ilike.%${query}%, subRegion.ilike.%${query}%`)
        .eq('status', 'ACTIVE')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Villa arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Seçilen villa için detayları getir
  const getVillaDetails = async (villaId: string) => {
    setIsLoading(true);
    try {
      // Villa temel bilgileri
      const { data: villaData, error: villaError } = await supabase
        .from('Villa')
        .select('id, title, description, slug, mainRegion, subRegion, bedrooms, bathrooms, maxGuests')
        .eq('id', villaId)
        .single();

      if (villaError) throw villaError;

      // Villa etiketleri (Villa_Tag junction tablosu üzerinden iki sorgu ile)
      const { data: villaTagRelations, error: villaTagError } = await supabase
        .from('Villa_Tag')
        .select('tagId')
        .eq('villaId', villaId);

      if (villaTagError) throw villaTagError;

      let tags: string[] = [];
      if (villaTagRelations && villaTagRelations.length > 0) {
        const tagIds = villaTagRelations.map(relation => relation.tagId);
        const { data: tagNames, error: tagNamesError } = await supabase
          .from('VillaTag')
          .select('name')
          .in('id', tagIds);

        if (tagNamesError) throw tagNamesError;
        tags = tagNames?.map(tag => tag.name) || [];
      }

      // Villa olanakları (amenities)
      const { data: amenitiesData, error: amenitiesError } = await supabase
        .from('VillaAmenity')
        .select('name')
        .eq('villaId', villaId);

      if (amenitiesError) throw amenitiesError;

      const villaWithDetails: VillaWithDetails = {
        ...villaData,
        tags: tags,
        amenities: amenitiesData?.map((amenity: { name: string }) => amenity.name) || []
      };

      setSelectedVilla(villaWithDetails);
    } catch (error) {
      console.error('Villa detayları getirme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // OpenAI API ile SEO içeriği oluşturma
  const generateSEOContent = async (villa: VillaWithDetails) => {
    if (!villa) return;

    setIsGeneratingSEO(true);
    try {
      const prompt = `Villa Bilgileri:
Başlık: ${villa.title}
Açıklama: ${villa.description}
Lokasyon: ${villa.mainRegion}, ${villa.subRegion}
Yatak Odası: ${villa.bedrooms}
Banyo: ${villa.bathrooms}
Maksimum Misafir: ${villa.maxGuests}
Etiketler: ${villa.tags.join(', ')}
Olanaklar: ${villa.amenities.join(', ')}

Bu villa bilgilerine göre Türkçe SEO içeriği oluştur. Şu JSON formatında yanıt ver:

{
  "metaTitle": "Villanın en çekici özelliklerini villa adı:${villa.title} ile birlikte (örn: özel havuz, deniz manzarası) ve lokasyonunu vurgulayan, 50-60 karakter arasında, arama sonuçlarında dikkat çekecek bir başlık.",
  "metaDescription": "Villanın temel faydalarını, öne çıkan 2-3 özelliğini (etiket ve olanaklardan faydalanarak) ve konumunu özetleyen, kullanıcıyı tıklamaya teşvik edecek, 150-160 karakter arasında bir açıklama.", 
  "metaKeywords": "Genel 'villa kiralama' terimine ek olarak, ${villa.mainRegion.toLowerCase()}, ${villa.subRegion.toLowerCase()}", gibi bölgesel anahtar kelimeler ve villanın etiketlerinden (${villa.tags.join(', ')}) ve olanaklarından (${villa.amenities.join(', ')}) türetilebilecek en az 3-5 adet spesifik ve alakalı anahtar kelime listesi. Örneğin: 'deniz manzaralı villa', 'kalkanda kiralık villa', 'özel havuzlu tatil'. Toplamda 5-7 anahtar kelime idealdir.",
  "ogTitle": "Sosyal medya paylaşımları için, metaTitle'a benzer ancak belki biraz daha merak uyandırıcı veya davetkar, 50-60 karakter arası bir başlık.",
  "ogDescription": "Sosyal medya kullanıcılarının ilgisini çekecek, villanın cazibesini ve sunduğu deneyimi vurgulayan, 150-160 karakter arası bir açıklama. Meta description'dan biraz daha canlı bir dil kullanılabilir."

  Önemli Notlar:
- Tüm metinler Türkçe olmalıdır.
- Belirtilen karakter sınırlarına KESİNLİKLE uyulmalıdır.
- Oluşturulan içerik özgün, akıcı ve dilbilgisi kurallarına uygun olmalıdır.
- Villanın benzersiz satış noktalarını (USP) ve misafirlere sunacağı değeri ön plana çıkar.
}`;

      const response = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('SEO içeriği oluşturulamadı');
      }

      const data = await response.json();
      
      const seoData: VillaSEOFormData = {
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        metaKeywords: data.metaKeywords || '',
        ogTitle: data.ogTitle || '',
        ogDescription: data.ogDescription || '',
        ogImage: '', // Bu manuel olarak doldurulacak
        noIndex: false
      };

      setAiGeneratedSEO(seoData);
      
    } catch (error) {
      console.error('SEO içeriği oluşturma hatası:', error);
      setSaveMessage({
        type: 'error',
        text: 'SEO içeriği oluşturulurken hata oluştu. Lütfen tekrar deneyin.'
      });
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  // SEO verilerini VillaSEO tablosuna kaydetme
  const saveSEOToDatabase = async () => {
    if (!selectedVilla || !aiGeneratedSEO) return;

    setIsSavingSEO(true);
    setSaveMessage(null);

    try {
      // Önce bu villa için mevcut SEO kaydı var mı kontrol et
      const { data: existingSEO, error: checkError } = await supabase
        .from('VillaSEO')
        .select('id')
        .eq('villaId', selectedVilla.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Villa'nın cover image'ını al ve ogImage olarak kullan
      let ogImageUrl = aiGeneratedSEO.ogImage;
      if (!ogImageUrl) {
        const { data: coverImage } = await supabase
          .from('VillaImage')
          .select('imageUrl')
          .eq('villaId', selectedVilla.id)
          .eq('isCoverImage', true)
          .single();
        
        ogImageUrl = coverImage?.imageUrl || '';
      }

      const seoPayload = {
        villaId: selectedVilla.id,
        metaTitle: aiGeneratedSEO.metaTitle,
        metaDescription: aiGeneratedSEO.metaDescription,
        metaKeywords: aiGeneratedSEO.metaKeywords,
        ogTitle: aiGeneratedSEO.ogTitle,
        ogDescription: aiGeneratedSEO.ogDescription,
        ogImage: ogImageUrl,
        noIndex: aiGeneratedSEO.noIndex,
        updatedAt: new Date().toISOString()
      };

      if (existingSEO) {
        // Güncelle
        const { error: updateError } = await supabase
          .from('VillaSEO')
          .update(seoPayload)
          .eq('id', existingSEO.id);

        if (updateError) throw updateError;
        
        setSaveMessage({
          type: 'success',
          text: 'SEO bilgileri başarıyla güncellendi!'
        });
      } else {
        // Yeni kayıt oluştur
        const { error: insertError } = await supabase
          .from('VillaSEO')
          .insert([{
            ...seoPayload,
            createdAt: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
        
        setSaveMessage({
          type: 'success',
          text: 'SEO bilgileri başarıyla kaydedildi!'
        });
      }

      // 3 saniye sonra mesajı temizle
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('SEO kaydetme hatası:', error);
      setSaveMessage({
        type: 'error',
        text: 'SEO bilgileri kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
      });
    } finally {
      setIsSavingSEO(false);
    }
  };

  // Villa seçme handler'ı
  const handleVillaSelect = (villa: VillaSearchResult) => {
    getVillaDetails(villa.id);
    setVillaSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Arama inputu değişiklik handler'ı - searchVillas dependency'si eklendi
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchVillas(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchVillas]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Villa Ara ve Seç
        </label>
        <Popover open={villaSearchOpen} onOpenChange={setVillaSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={villaSearchOpen}
              className="w-full justify-between h-11"
              disabled={isLoading}
            >
              {selectedVilla ? (
                <span className="truncate">
                  {selectedVilla.title} <span className="text-muted-foreground">({selectedVilla.mainRegion})</span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {isLoading ? 'Villalar yükleniyor...' : 'Villa ara ve seç...'}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Villa ara... (başlık, açıklama veya lokasyon)" 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-11"
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {isLoading ? 'Aranıyor...' : 'Villa bulunamadı.'}
                </CommandEmpty>
                <CommandGroup>
                  {searchResults.map((villa) => (
                    <CommandItem
                      key={villa.id}
                      value={`${villa.title} ${villa.description} ${villa.mainRegion} ${villa.subRegion}`}
                      onSelect={() => handleVillaSelect(villa)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">{villa.title}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{villa.mainRegion}, {villa.subRegion}</span>
                          <span className="mx-1">•</span>
                          <Bed className="h-3 w-3" />
                          <span>{villa.bedrooms} yatak</span>
                          <span className="mx-1">•</span>
                          <Users className="h-3 w-3" />
                          <span>{villa.maxGuests} kişi</span>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedVilla?.id === villa.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Villa seçtiğinizde detaylı bilgiler görüntülenecek ve AI ile SEO içeriği oluşturabileceksiniz.
        </p>
      </div>

      {/* Selected Villa Details */}
      {selectedVilla && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Seçilen Villa</h3>
            <div className="flex gap-2">
              <button
                onClick={() => generateSEOContent(selectedVilla)}
                disabled={isGeneratingSEO}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingSEO ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGeneratingSEO ? 'SEO Oluşturuluyor...' : 'AI ile SEO Oluştur'}
              </button>
              <button
                onClick={() => setSelectedVilla(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Kapat</span>
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Villa Temel Bilgileri */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedVilla.title}</h4>
              <p className="text-gray-600 text-sm">{selectedVilla.description}</p>
            </div>

            {/* Villa Özellikleri */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{selectedVilla.mainRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{selectedVilla.subRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bed className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{selectedVilla.bedrooms} yatak odası</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bath className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{selectedVilla.bathrooms} banyo</span>
              </div>
            </div>

            {/* Etiketler */}
            {selectedVilla.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Etiketler</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVilla.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Olanaklar */}
            {selectedVilla.amenities.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Olanaklar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVilla.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Generated SEO Content */}
      {aiGeneratedSEO && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Tarafından Oluşturulan SEO İçeriği</h3>
            </div>
            <button
              onClick={saveSEOToDatabase}
              disabled={isSavingSEO || !selectedVilla}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingSEO ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingSEO ? 'Kaydediliyor...' : 'Veritabanına Kaydet'}
            </button>
          </div>

          {/* Kaydetme Mesajı */}
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              saveMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {saveMessage.text}
            </div>
          )}

          <div className="space-y-4">
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Başlık ({aiGeneratedSEO.metaTitle?.length || 0} karakter)
              </label>
              <input
                type="text"
                value={aiGeneratedSEO.metaTitle || ''}
                onChange={(e) => setAiGeneratedSEO(prev => prev ? {...prev, metaTitle: e.target.value} : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Meta başlık"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Açıklama ({aiGeneratedSEO.metaDescription?.length || 0} karakter)
              </label>
              <textarea
                value={aiGeneratedSEO.metaDescription || ''}
                onChange={(e) => setAiGeneratedSEO(prev => prev ? {...prev, metaDescription: e.target.value} : null)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Meta açıklama"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anahtar Kelimeler
              </label>
              <input
                type="text"
                value={aiGeneratedSEO.metaKeywords || ''}
                onChange={(e) => setAiGeneratedSEO(prev => prev ? {...prev, metaKeywords: e.target.value} : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Anahtar kelimeler (virgülle ayırın)"
              />
            </div>

            {/* OG Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Open Graph Başlık ({aiGeneratedSEO.ogTitle?.length || 0} karakter)
              </label>
              <input
                type="text"
                value={aiGeneratedSEO.ogTitle || ''}
                onChange={(e) => setAiGeneratedSEO(prev => prev ? {...prev, ogTitle: e.target.value} : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="OG başlık"
              />
            </div>

            {/* OG Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Open Graph Açıklama ({aiGeneratedSEO.ogDescription?.length || 0} karakter)
              </label>
              <textarea
                value={aiGeneratedSEO.ogDescription || ''}
                onChange={(e) => setAiGeneratedSEO(prev => prev ? {...prev, ogDescription: e.target.value} : null)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="OG açıklama"
              />
            </div>

            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              <strong>Not:</strong> OG Image otomatik olarak villa&apos;nın cover resmi kullanılacak. 
              İçeriği düzenleyebilir ve &quot;Veritabanına Kaydet&quot; butonuyla VillaSEO tablosuna kaydedebilirsiniz.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
