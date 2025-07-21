// Import mockSupabase synchronously (it's safe and doesn't make network requests)
import { mockSupabase } from './mockSupabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if MOCK_MODE is explicitly enabled
const mockModeEnabled = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

// STRICT: Default to mock mode unless explicitly disabled AND Supabase is properly configured
// Use mock if:
// 1. MOCK_MODE is explicitly enabled (highest priority)
// 2. Supabase URL or key are missing
// 3. URL/key are the string "undefined" (common when env vars aren't set properly)
// 4. URL doesn't start with https:// (invalid format)
// 5. URL doesn't contain .supabase.co (not a Supabase URL)
// 6. URL is too short (likely invalid)
const shouldUseMock = 
  mockModeEnabled ||
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'undefined' ||
  supabaseAnonKey === 'undefined' ||
  typeof supabaseUrl !== 'string' ||
  typeof supabaseAnonKey !== 'string' ||
  !supabaseUrl.startsWith('https://') ||
  !supabaseUrl.includes('.supabase.co') ||
  supabaseUrl.length < 20 ||
  supabaseAnonKey.length < 20

// Log for debugging (can be removed in production)
if (typeof window !== 'undefined') {
  console.log('[Supabase] Mock mode:', shouldUseMock, {
    mockModeEnabled,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlFormat: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co')
  })
}

// NEVER create real Supabase client if we should use mock
// This prevents any network requests from being made
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let realSupabase: any = null

// Only attempt to create real Supabase client if we're NOT in mock mode
if (!shouldUseMock && supabaseUrl && supabaseAnonKey) {
  // Use dynamic import to prevent module-level initialization
  // This ensures @supabase/supabase-js is only loaded if we're not in mock mode
  import('@supabase/supabase-js').then(({ createClient }) => {
    try {
      realSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storage: typeof window !== 'undefined' ? {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          } : undefined
        }
      })
    } catch (error) {
      console.warn('Failed to create Supabase client, using mock mode:', error)
    }
  }).catch((error) => {
    console.warn('Failed to import Supabase client, using mock mode:', error)
  })
}

// Always use mock if we should use mock
// If not in mock mode, use realSupabase if available, otherwise fall back to mock
/* eslint-disable @typescript-eslint/no-explicit-any */
export const supabase = shouldUseMock 
  ? (mockSupabase as any)
  : (realSupabase || mockSupabase as any)
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      libraries: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      book_management: {
        Row: {
          id: number
          b_code: number
          b_name: string
          b_author: string
          b_price: number
          library_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          b_code: number
          b_name: string
          b_author: string
          b_price: number
          library_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          b_code?: number
          b_name?: string
          b_author?: string
          b_price?: number
          library_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      member_management: {
        Row: {
          id: number
          m_code: number
          m_name: string
          m_phone: string
          library_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          m_code: number
          m_name: string
          m_phone: string
          library_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          m_code?: number
          m_name?: string
          m_phone?: string
          library_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      issue_management: {
        Row: {
          id: number
          ib_code: number
          im_code: number
          i_date_of_iss: string
          i_date_of_ret: string | null
          library_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          ib_code: number
          im_code: number
          i_date_of_iss: string
          i_date_of_ret?: string | null
          library_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          ib_code?: number
          im_code?: number
          i_date_of_iss?: string
          i_date_of_ret?: string | null
          library_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 