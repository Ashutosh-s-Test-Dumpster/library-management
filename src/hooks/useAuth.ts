import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Application not properly configured. Please check environment variables.')
        return { success: false, error: 'Configuration error' }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { success: true, data }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google authentication failed'
      console.error('Google auth error:', err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Application not properly configured')
        return { success: false, error: 'Configuration error' }
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return { success: true }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      console.error('Signout error:', err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    signInWithGoogle,
    signOut,
    loading,
    error,
    setError,
  }
} 