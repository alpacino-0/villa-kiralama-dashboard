import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface VillaOption {
  id: string;
  title: string;
  mainRegion: string;
  subRegion: string;
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useVillas() {
  const [villaOptions, setVillaOptions] = useState<VillaOption[]>([]);
  const [filteredVillas, setFilteredVillas] = useState<VillaOption[]>([]);
  const [villaSearchTerm, setVillaSearchTerm] = useState('');

  // Villa seçeneklerini yükle
  const loadVillaOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Villa')
        .select('id, title, mainRegion, subRegion')
        .eq('status', 'ACTIVE')
        .order('title');

      if (error) throw error;
      setVillaOptions(data || []);
    } catch (error) {
      console.error('Villa seçenekleri yüklenirken hata:', error);
    }
  }, []);

  // Villa filtreleme fonksiyonu
  const filterVillas = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredVillas(villaOptions);
      return;
    }
    
    const filtered = villaOptions.filter(villa =>
      villa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      villa.mainRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      villa.subRegion.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVillas(filtered);
  }, [villaOptions]);

  // Villa seçenekleri değiştiğinde filtrelenmiş listeyi güncelle
  useEffect(() => {
    setFilteredVillas(villaOptions);
  }, [villaOptions]);

  // Villa arama debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterVillas(villaSearchTerm);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [villaSearchTerm, filterVillas]);

  // Component mount - ilk yükleme
  useEffect(() => {
    loadVillaOptions();
  }, [loadVillaOptions]);

  return {
    villaOptions,
    filteredVillas,
    villaSearchTerm,
    setVillaSearchTerm,
    loadVillaOptions,
    filterVillas
  };
} 