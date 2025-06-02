import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LoginFormData, SignupFormData, SignupStep1Data } from '@/lib/validations'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEmailExists = async (email: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      
      // Check in auth.users via RPC or profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return !!data // Returns true if email exists
    } catch (err: any) {
      console.error('Error checking email:', err)
      return false
    }
  }

  const checkFullNameExists = async (fullName: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('full_name', fullName)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return !!data // Returns true if full name exists
    } catch (err: any) {
      console.error('Error checking full name:', err)
      return false
    }
  }

  const verifyStep1Data = async (data: SignupStep1Data) => {
    setLoading(true)
    setError(null)

    try {
      const [emailExists, nameExists] = await Promise.all([
        checkEmailExists(data.email),
        checkFullNameExists(data.fullName)
      ])

      if (emailExists) {
        setError('This email address is already registered')
        return { success: false, error: 'Email already exists' }
      }

      if (nameExists) {
        setError('This name is already taken, please choose a different one')
        return { success: false, error: 'Name already exists' }
      }

      return { success: true }
    } catch (err: any) {
      setError('Error verifying information. Please try again.')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { success: true, data }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: SignupFormData) => {
    setLoading(true)
    setError(null)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      // Create profile if user was created successfully
      if (authData.user) {
        // Wait a bit to ensure auth context is established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
          }, {
            onConflict: 'id'
          })

        // Don't throw error if profile creation fails - it might already exist from trigger
        if (profileError) {
          console.warn('Profile creation warning:', profileError.message)
        }
      }

      return { success: true, data: authData }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      return { success: true, data: authData }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    verifyStep1Data,
    loading,
    error,
    setError,
  }
} 