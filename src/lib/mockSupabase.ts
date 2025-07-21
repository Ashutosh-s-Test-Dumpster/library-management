// Mock Supabase client that mimics the real Supabase API
/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockDb } from './mockData'
import type { Database } from './supabase'

type TableName = keyof Database['public']['Tables']
type Table<T extends TableName> = Database['public']['Tables'][T]['Row']
type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert']
type Update<T extends TableName> = Database['public']['Tables'][T]['Update']

class MockQueryBuilder<T extends TableName> {
  private table: T
  private filters: Array<{ column: string; operator: string; value: any }> = []
  private orderBy?: { column: string; ascending: boolean }
  private limitCount?: number
  private isSingle = false
  private isMaybeSingle = false
  private isCount = false
  private isHead = false
  private libraryId?: string

  constructor(table: T) {
    this.table = table
  }

  select(columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    if (options?.count === 'exact' || options?.head) {
      this.isCount = true
    }
    if (options?.head) {
      this.isHead = true
    }
    return this
  }

  eq(column: string, value: any) {
    if (column === 'library_id') {
      this.libraryId = value
    }
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  is(column: string, _value: null) {
    this.filters.push({ column, operator: 'is', value: null })
    return this
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isSingle = true
    this.isMaybeSingle = true
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value })
    return this
  }

  async then<TResult>(
    onfulfilled?: (value: { data: any; count?: number; error: null } | { data: null; error: any }) => TResult
  ): Promise<TResult> {
    try {
      let data: any
      let count: number | undefined

      if (this.isCount) {
        // For count queries, get items WITHOUT limit to get accurate count
        const itemsBeforeLimit = this.getFilteredItemsWithoutLimit()
        const itemCount = itemsBeforeLimit.length
        
        // When head: true, return count in count property, data should be null
        // When count: 'exact' without head, return count in count property with data
        if (this.isHead) {
          // head: true case - return count property, null data
          count = itemCount
          data = null
        } else {
          // Regular count query with data - return count in count property
          count = itemCount
          // Don't set data to null here - let it be filtered items if not head
          data = this.getFilteredItems()
        }
      } else {
        data = this.getFilteredItems()
        if (this.isSingle) {
          data = data[0] || null
          // Only throw error for single(), not maybeSingle()
          if (!data && !this.isMaybeSingle) {
            throw new Error('No rows found')
          }
        }
      }

      const result: any = { data, error: null }
      if (count !== undefined) {
        result.count = count
      }
      return onfulfilled ? onfulfilled(result) : result as any
    } catch (error: any) {
      const result = { data: null, error }
      return onfulfilled ? onfulfilled(result) : result as any
    }
  }

  private getFilteredItemsWithoutLimit(): Table<T>[] {
    let items: Table<T>[] = []
    
    // Extract library_id from filters
    const libraryIdFilter = this.filters.find(f => f.column === 'library_id')
    const libraryId = libraryIdFilter?.value || this.libraryId || ''

    switch (this.table) {
      case 'libraries':
        items = mockDb.getLibraries(mockDb.getCurrentUser()?.id || '') as any
        break
      case 'book_management':
        items = mockDb.getBooks(libraryId) as any
        break
      case 'member_management':
        items = mockDb.getMembers(libraryId) as any
        break
      case 'issue_management':
        items = mockDb.getIssues(libraryId) as any
        break
    }

    // Apply filters
    items = items.filter(item => {
      return this.filters.every(filter => {
        const itemValue = (item as any)[filter.column]
        switch (filter.operator) {
          case 'eq':
            return itemValue === filter.value
          case 'neq':
            return itemValue !== filter.value
          case 'is':
            return itemValue === null
          case 'lt':
            return itemValue < filter.value
          default:
            return true
        }
      })
    })

    // Apply ordering
    if (this.orderBy) {
      items.sort((a: any, b: any) => {
        const aVal = a[this.orderBy!.column]
        const bVal = b[this.orderBy!.column]
        if (this.orderBy!.ascending) {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
      })
    }

    return items
  }

  private getFilteredItems(): Table<T>[] {
    const items = this.getFilteredItemsWithoutLimit()

    // Apply limit
    if (this.limitCount) {
      return items.slice(0, this.limitCount)
    }

    return items
  }
}

class MockTable<T extends TableName> {
  constructor(private table: T) {}

  select(columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    return new MockQueryBuilder(this.table).select(columns, options)
  }

  insert(data: Insert<T> | Insert<T>[]) {
    return {
      select: () => ({
        single: async () => {
          const items = Array.isArray(data) ? data : [data]
          const results = items.map(item => {
            switch (this.table) {
              case 'libraries':
                return mockDb.createLibrary(item as any)
              case 'book_management':
                return mockDb.createBook(item as any)
              case 'member_management':
                return mockDb.createMember(item as any)
              case 'issue_management':
                return mockDb.createIssue(item as any)
              default:
                throw new Error(`Unknown table: ${this.table}`)
            }
          })
          return { data: results[0], error: null }
        }
      })
    }
  }

  update(updates: Update<T>) {
    return {
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            let result: any = null
            switch (this.table) {
              case 'libraries':
                result = mockDb.updateLibrary(value, updates as any)
                break
              case 'book_management':
                result = mockDb.updateBook(value, updates as any)
                break
              case 'member_management':
                result = mockDb.updateMember(value, updates as any)
                break
              case 'issue_management':
                result = mockDb.updateIssue(value, updates as any)
                break
            }
            return { data: result, error: result ? null : new Error('Not found') }
          }
        })
      })
    }
  }

  delete() {
    return {
      eq: (column: string, value: any) => ({
        then: async (onfulfilled?: any) => {
          let success = false
          switch (this.table) {
            case 'libraries':
              success = mockDb.deleteLibrary(value)
              break
            case 'book_management':
              success = mockDb.deleteBook(value)
              break
            case 'member_management':
              success = mockDb.deleteMember(value)
              break
            case 'issue_management':
              success = mockDb.deleteIssue(value)
              break
          }
          const result = { data: success ? {} : null, error: success ? null : new Error('Not found') }
          return onfulfilled ? onfulfilled(result) : result
        }
      })
    }
  }
}

export const mockSupabase = {
  from: <T extends TableName>(table: T) => new MockTable(table),
  channel: (name: string) => {
    // Mock channel for real-time subscriptions
    // In mock mode, we don't actually subscribe to changes, but we return a compatible API
    const channelObj = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      on: (_event: string, _config: any, _callback?: () => void) => {
        // Return an object with subscribe method for chaining
        return {
          subscribe: () => {
            // Return a mock subscription object
            return {
              state: 'SUBSCRIBED',
              channel: name
            }
          }
        }
      },
      subscribe: () => {
        // Return a mock subscription object
        return {
          state: 'SUBSCRIBED',
          channel: name
        }
      }
    }
    return channelObj
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeChannel: (_channel: any) => {
    // Mock removeChannel - no-op in mock mode
    return mockSupabase
  },
  auth: {
    getSession: async () => {
      const user = mockDb.getCurrentUser()
      if (!user) {
        return {
          data: { session: null },
          error: null
        }
      }
      
      // Format user to match Supabase user format
      const supabaseUser = {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.full_name || 'Mock User',
          email: user.email
        }
      }
      
      return {
        data: {
          session: { 
            access_token: 'mock-token-' + Date.now(),
            user: supabaseUser
          }
        },
        error: null
      }
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Listen for mock auth changes
      const handleMockAuthChange = (e: CustomEvent) => {
        const { event, session } = e.detail
        callback(event, session)
      }
      
      if (typeof window !== 'undefined') {
        window.addEventListener('mock-auth-change', handleMockAuthChange as EventListener)
      }
      
      // Return initial session
      const user = mockDb.getCurrentUser()
      if (user) {
        const supabaseUser = {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.full_name || 'Mock User',
            email: user.email
          }
        }
        callback('SIGNED_IN', { 
          access_token: 'mock-token',
          user: supabaseUser
        })
      }
      
      return {
        data: { 
          subscription: { 
            unsubscribe: () => {
              if (typeof window !== 'undefined') {
                window.removeEventListener('mock-auth-change', handleMockAuthChange as EventListener)
              }
            }
          } 
        }
      }
    },
    signOut: async () => {
      mockDb.clearCurrentUser()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mock-auth-change', { 
          detail: { event: 'SIGNED_OUT', session: null } 
        }))
      }
      return { error: null }
    }
  }
}
