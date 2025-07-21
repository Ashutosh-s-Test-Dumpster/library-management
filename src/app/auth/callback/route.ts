import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Check if we should use mock mode
  const useMock = 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

  if (useMock) {
    // In mock mode, just redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error

      // Wait for session to be established and verify user
      if (data.session && data.user) {
        // Additional wait to ensure session is fully synced
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify the session is actually established
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionCheck.session) {
          console.error('Session verification failed:', sessionError)
          return NextResponse.redirect(`${requestUrl.origin}/?error=session_failed`)
        }

        console.log('OAuth session successfully established:', {
          user: data.user.email,
          sessionId: data.session.access_token.substring(0, 20) + '...'
        })
      } else {
        throw new Error('No session or user data received')
      }
    } catch (error) {
      console.error('Error in OAuth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=auth_error`)
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
} 