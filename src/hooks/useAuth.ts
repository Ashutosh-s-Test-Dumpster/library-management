import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { mockAuth } from '@/lib/mockAuth'

const useMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

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
    } catch (err) {
      console.error('Google auth error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Google authentication failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signInWithMock = async () => {
    setLoading(true)
    setError(null)

    try {
      const { user, session } = await mockAuth.signIn()
      
      // Trigger auth state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mock-auth-change', { 
          detail: { event: 'SIGNED_IN', session } 
        }))
      }

      return { success: true, data: { user, session } }
    } catch (err) {
      console.error('Mock auth error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Mock authentication failed'
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
      if (useMock) {
        await mockAuth.signOut()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mock-auth-change', { 
            detail: { event: 'SIGNED_OUT', session: null } 
          }))
        }
        return { success: true }
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Application not properly configured')
        return { success: false, error: 'Configuration error' }
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error('Signout error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    signInWithGoogle,
    signInWithMock,
    signOut,
    loading,
    error,
    setError,
  }
} 