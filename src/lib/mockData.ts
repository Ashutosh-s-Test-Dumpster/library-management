// Mock data storage - in-memory database
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Library = Database['public']['Tables']['libraries']['Row']
type Book = Database['public']['Tables']['book_management']['Row']
type Member = Database['public']['Tables']['member_management']['Row']
type Issue = Database['public']['Tables']['issue_management']['Row']

class MockDatabase {
  private profiles: Map<string, Profile> = new Map()
  private libraries: Map<string, Library> = new Map()
  private books: Map<number, Book> = new Map()
  private members: Map<number, Member> = new Map()
  private issues: Map<number, Issue> = new Map()
  private currentUser: Profile | null = null
  private bookCounter = 0
  private memberCounter = 0
  private issueCounter = 0

  // Auth methods
  setCurrentUser(user: Profile) {
    this.currentUser = user
    // Initialize with sample data if first time for this user
    const userLibraries = Array.from(this.libraries.values()).filter(lib => lib.user_id === user.id)
    if (userLibraries.length === 0) {
      this.initializeSampleData(user.id)
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  clearCurrentUser() {
    this.currentUser = null
  }

  // Initialize sample data
  private initializeSampleData(userId: string) {
    const libraryId = this.generateUUID()
    const library: Library = {
      id: libraryId,
      name: 'Sample Library',
      description: 'A sample library to get you started',
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.libraries.set(libraryId, library)

    // Add sample books
    const sampleBooks = [
      { b_code: 1001, b_name: 'The Great Gatsby', b_author: 'F. Scott Fitzgerald', b_price: 12.99 },
      { b_code: 1002, b_name: '1984', b_author: 'George Orwell', b_price: 14.99 },
      { b_code: 1003, b_name: 'To Kill a Mockingbird', b_author: 'Harper Lee', b_price: 13.99 },
      { b_code: 1004, b_name: 'Pride and Prejudice', b_author: 'Jane Austen', b_price: 11.99 },
      { b_code: 1005, b_name: 'The Catcher in the Rye', b_author: 'J.D. Salinger', b_price: 10.99 }
    ]

    sampleBooks.forEach(book => {
      const bookRecord: Book = {
        id: ++this.bookCounter,
        ...book,
        library_id: libraryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.books.set(bookRecord.id, bookRecord)
    })

    // Add sample members
    const sampleMembers = [
      { m_code: 2001, m_name: 'John Doe', m_phone: '555-0101' },
      { m_code: 2002, m_name: 'Jane Smith', m_phone: '555-0102' },
      { m_code: 2003, m_name: 'Bob Johnson', m_phone: '555-0103' }
    ]

    sampleMembers.forEach(member => {
      const memberRecord: Member = {
        id: ++this.memberCounter,
        ...member,
        library_id: libraryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.members.set(memberRecord.id, memberRecord)
    })

    // Add sample issues
    const issueRecord: Issue = {
      id: ++this.issueCounter,
      ib_code: 1001,
      im_code: 2001,
      i_date_of_iss: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      i_date_of_ret: null,
      library_id: libraryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.issues.set(issueRecord.id, issueRecord)
  }

  // Library methods
  getLibraries(userId: string): Library[] {
    return Array.from(this.libraries.values()).filter(lib => lib.user_id === userId)
  }

  createLibrary(data: Omit<Library, 'id' | 'created_at' | 'updated_at'>): Library {
    const library: Library = {
      id: this.generateUUID(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.libraries.set(library.id, library)
    return library
  }

  updateLibrary(id: string, updates: Partial<Library>): Library | null {
    const library = this.libraries.get(id)
    if (!library) return null
    const updated = { ...library, ...updates, updated_at: new Date().toISOString() }
    this.libraries.set(id, updated)
    return updated
  }

  deleteLibrary(id: string): boolean {
    // Delete related data
    Array.from(this.books.values())
      .filter(book => book.library_id === id)
      .forEach(book => this.books.delete(book.id))
    
    Array.from(this.members.values())
      .filter(member => member.library_id === id)
      .forEach(member => this.members.delete(member.id))
    
    Array.from(this.issues.values())
      .filter(issue => issue.library_id === id)
      .forEach(issue => this.issues.delete(issue.id))
    
    return this.libraries.delete(id)
  }

  // Book methods
  getBooks(libraryId: string): Book[] {
    return Array.from(this.books.values()).filter(book => book.library_id === libraryId)
  }

  createBook(data: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Book {
    const book: Book = {
      id: ++this.bookCounter,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.books.set(book.id, book)
    return book
  }

  updateBook(id: number, updates: Partial<Book>): Book | null {
    const book = this.books.get(id)
    if (!book) return null
    const updated = { ...book, ...updates, updated_at: new Date().toISOString() }
    this.books.set(id, updated)
    return updated
  }

  deleteBook(id: number): boolean {
    return this.books.delete(id)
  }

  // Member methods
  getMembers(libraryId: string): Member[] {
    return Array.from(this.members.values()).filter(member => member.library_id === libraryId)
  }

  createMember(data: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Member {
    const member: Member = {
      id: ++this.memberCounter,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.members.set(member.id, member)
    return member
  }

  updateMember(id: number, updates: Partial<Member>): Member | null {
    const member = this.members.get(id)
    if (!member) return null
    const updated = { ...member, ...updates, updated_at: new Date().toISOString() }
    this.members.set(id, updated)
    return updated
  }

  deleteMember(id: number): boolean {
    return this.members.delete(id)
  }

  // Issue methods
  getIssues(libraryId: string): Issue[] {
    return Array.from(this.issues.values()).filter(issue => issue.library_id === libraryId)
  }

  createIssue(data: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Issue {
    const issue: Issue = {
      id: ++this.issueCounter,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.issues.set(issue.id, issue)
    return issue
  }

  updateIssue(id: number, updates: Partial<Issue>): Issue | null {
    const issue = this.issues.get(id)
    if (!issue) return null
    const updated = { ...issue, ...updates, updated_at: new Date().toISOString() }
    this.issues.set(id, updated)
    return updated
  }

  deleteIssue(id: number): boolean {
    return this.issues.delete(id)
  }

  // Utility
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

export const mockDb = new MockDatabase()

