'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { 
  VillaSEO, 
  VillaSEOInsert, 
  VillaSEOUpdate,
  VillaSEOWithVilla
} from '@/types'

interface UseVillaSEOReturn {
  villaSEOs: VillaSEOWithVilla[]
  loading: boolean
  error: string | null
  fetchVillaSEOs: () => Promise<void>
  createVillaSEO: (data: VillaSEOInsert) => Promise<VillaSEO | null>
  updateVillaSEO: (id: string, data: VillaSEOUpdate) => Promise<VillaSEO | null>
  deleteVillaSEO: (id: string) => Promise<boolean>
  getVillaSEOByVillaId: (villaId: string) => Promise<VillaSEO | null>
}

export function useVillaSEO(): UseVillaSEOReturn {
  const [villaSEOs, setVillaSEOs] = useState<VillaSEOWithVilla[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Tüm VillaSEO verilerini getir (Villa bilgileri ile birlikte)
  const fetchVillaSEOs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('VillaSEO')
        .select(`
          *,
          Villa (
            id,
            title,
            slug
          )
        `)
        .order('createdAt', { ascending: false })

      if (error) throw error

      setVillaSEOs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Yeni VillaSEO oluştur
  const createVillaSEO = async (data: VillaSEOInsert): Promise<VillaSEO | null> => {
    try {
      setError(null)
      
      const { data: newVillaSEO, error } = await supabase
        .from('VillaSEO')
        .insert([data])
        .select()
        .single()

      if (error) throw error

      await fetchVillaSEOs() // Listeyi güncelle
      return newVillaSEO
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma hatası')
      return null
    }
  }

  // VillaSEO güncelle
  const updateVillaSEO = async (id: string, data: VillaSEOUpdate): Promise<VillaSEO | null> => {
    try {
      setError(null)
      
      const { data: updatedVillaSEO, error } = await supabase
        .from('VillaSEO')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchVillaSEOs() // Listeyi güncelle
      return updatedVillaSEO
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme hatası')
      return null
    }
  }

  // VillaSEO sil
  const deleteVillaSEO = async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('VillaSEO')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchVillaSEOs() // Listeyi güncelle
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme hatası')
      return false
    }
  }

  // Villa ID'ye göre SEO verisi getir
  const getVillaSEOByVillaId = async (villaId: string): Promise<VillaSEO | null> => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('VillaSEO')
        .select('*')
        .eq('villaId', villaId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116: No rows found

      return data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri getirme hatası')
      return null
    }
  }

  useEffect(() => {
    fetchVillaSEOs()
  }, [fetchVillaSEOs])

  return {
    villaSEOs,
    loading,
    error,
    fetchVillaSEOs,
    createVillaSEO,
    updateVillaSEO,
    deleteVillaSEO,
    getVillaSEOByVillaId,
  }
} 