import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [vendor,  setVendor]  = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) { console.error('fetchProfile:', error.message); return }
      setProfile(prof)
      if (prof?.role === 'vendor') {
        const { data: v } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', userId)
          .single()
        setVendor(v || null)
      } else {
        setVendor(null)
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setVendor(null)
      }
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [fetchProfile])

  const signUp = async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    if (error) throw error
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setVendor(null)
  }

  const isAdmin  = profile?.role === 'admin'
  const isVendor = profile?.role === 'vendor'
  const isClient = profile?.role === 'client'

  return (
    <AuthContext.Provider value={{
      user, profile, vendor, loading,
      signUp, signIn, signOut,
      isAdmin, isVendor, isClient,
      fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
