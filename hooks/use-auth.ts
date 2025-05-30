'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/profiles'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false
  })

  useEffect(() => {
    const supabase = createClient()

    // Kullanıcı ve profil bilgilerini al
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setState({
            user: null,
            profile: null,
            loading: false,
            isAdmin: false
          })
          return
        }

        // Profil bilgilerini al
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profil bilgisi alınırken hata:', profileError)
          setState({
            user,
            profile: null,
            loading: false,
            isAdmin: false
          })
          return
        }

        setState({
          user,
          profile: profile as Profile,
          loading: false,
          isAdmin: profile?.role === 'ADMIN'
        })
      } catch (error) {
        console.error('Auth hatası:', error)
        setState({
          user: null,
          profile: null,
          loading: false,
          isAdmin: false
        })
      }
    }

    // İlk yükleme
    getUser()

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setState({
            user: null,
            profile: null,
            loading: false,
            isAdmin: false
          })
        } else {
          // Yeni kullanıcı bilgilerini al
          getUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return state
} 