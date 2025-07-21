// Mock authentication system
import type { Database } from './supabase'
import { mockDb } from './mockData'

type Profile = Database['public']['Tables']['profiles']['Row']

export const mockAuth = {
  // Sign in with mock user
  signIn: async (): Promise<{ user: Profile; session: { access_token: string } }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockUser: Profile = {
      id: 'mock-user-id-' + Date.now(),
      full_name: 'Mock User',
      email: 'mock@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockDb.setCurrentUser(mockUser)

    return {
      user: mockUser,
      session: {
        access_token: 'mock-access-token-' + Date.now()
      }
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    mockDb.clearCurrentUser()
  },

  // Get current user
  getCurrentUser: (): Profile | null => {
    return mockDb.getCurrentUser()
  }
}

