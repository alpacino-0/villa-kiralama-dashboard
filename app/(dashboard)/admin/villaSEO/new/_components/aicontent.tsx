'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Home, Users, Bed, Bath, Tag, Star } from 'lucide-react';
import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';

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
  const [contentPrompt, setContentPrompt] = useState('');
  
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
      generateContentPrompt(villaWithDetails);
    } catch (error) {
      console.error('Villa detayları getirme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // İçerik prompt'ı oluştur
  const generateContentPrompt = (villa: VillaWithDetails) => {
    const prompt = `
Villa Bilgileri:
- Başlık: ${villa.title}
- Açıklama: ${villa.description}
- Lokasyon: ${villa.mainRegion}, ${villa.subRegion}
- Yatak Odası: ${villa.bedrooms}
- Banyo: ${villa.bathrooms}
- Maksimum Misafir: ${villa.maxGuests}
- Etiketler: ${villa.tags.join(', ')}
- Olanaklar: ${villa.amenities.join(', ')}

Bu villa için SEO dostu içerik oluşturun.
    `.trim();
    
    setContentPrompt(prompt);
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
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Villa ara... (başlık, açıklama veya lokasyon)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Aranıyor...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((villa) => (
                <button
                  key={villa.id}
                  onClick={() => {
                    getVillaDetails(villa.id);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">{villa.title}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{villa.mainRegion}, {villa.subRegion}</span>
                    <span className="mx-2">•</span>
                    <Bed className="h-3 w-3" />
                    <span>{villa.bedrooms} yatak odası</span>
                    <span className="mx-2">•</span>
                    <Users className="h-3 w-3" />
                    <span>{villa.maxGuests} kişi</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">Villa bulunamadı</div>
            )}
          </div>
        )}
      </div>

      {/* Selected Villa Details */}
      {selectedVilla && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Seçilen Villa</h3>
            <button
              onClick={() => setSelectedVilla(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Kapat</span>
              ✕
            </button>
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

      {/* Generated Content Prompt */}
      {contentPrompt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI İçerik Prompt&apos;ı</h3>
          <textarea
            value={contentPrompt}
            onChange={(e) => setContentPrompt(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="AI için içerik prompt'ı buraya gelecek..."
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(contentPrompt);
                // Toast notification burada gösterilebilir
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Prompt&apos;ı Kopyala
            </button>
            <button
              onClick={() => setContentPrompt('')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
