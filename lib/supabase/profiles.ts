import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/types/profiles"

/**
 * Kullanıcının profil bilgilerini ve rolünü alır
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Profil bilgisi alınırken hata:', error)
      return null
    }
    
    return data as Profile
  } catch (error) {
    console.error('getUserProfile hatası:', error)
    return null
  }
}

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.role === 'ADMIN'
}

/**
 * Mevcut oturumdaki kullanıcının profil bilgilerini alır
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }
    
    return await getUserProfile(user.id)
  } catch (error) {
    console.error('getCurrentUserProfile hatası:', error)
    return null
  }
}

/**
 * Mevcut kullanıcının admin olup olmadığını kontrol eder
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return false
    }
    
    return await isUserAdmin(user.id)
  } catch (error) {
    console.error('isCurrentUserAdmin hatası:', error)
    return false
  }
} 