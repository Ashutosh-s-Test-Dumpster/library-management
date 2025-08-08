import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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