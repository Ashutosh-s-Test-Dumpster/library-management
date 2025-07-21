import { Database } from '@/lib/supabase';

// Database types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Library = Database['public']['Tables']['libraries']['Row'];
export type LibraryInsert = Database['public']['Tables']['libraries']['Insert'];
export type LibraryUpdate = Database['public']['Tables']['libraries']['Update'];

export type Book = Database['public']['Tables']['book_management']['Row'];
export type BookInsert = Database['public']['Tables']['book_management']['Insert'];
export type BookUpdate = Database['public']['Tables']['book_management']['Update'];

export type Member = Database['public']['Tables']['member_management']['Row'];
export type MemberInsert = Database['public']['Tables']['member_management']['Insert'];
export type MemberUpdate = Database['public']['Tables']['member_management']['Update'];

export type Issue = Database['public']['Tables']['issue_management']['Row'];
export type IssueInsert = Database['public']['Tables']['issue_management']['Insert'];
export type IssueUpdate = Database['public']['Tables']['issue_management']['Update'];

// Extended types
export interface IssueWithDetails extends Issue {
  book?: Book;
  member?: Member;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string | null;
  initials: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalMembers: number;
  activeIssues: number;
  overdueBooks: number;
  returnedIssues: number;
  availableBooks: number;
}

export interface RecentData {
  recentBooks: Book[];
  recentMembers: Member[];
  recentIssues: IssueWithDetails[];
  overdueIssues: IssueWithDetails[];
}

// Component prop types
export interface LibraryManagementProps {
  libraryId: string;
}

export type DashboardTab = 'overview' | 'books' | 'members' | 'issues';
export type IssueTab = 'active' | 'returned' | 'all';
export type BookFilter = 'all' | 'name' | 'author' | 'code';
export type MemberFilter = 'all' | 'name' | 'code';
export type EntryMode = 'isbn' | 'manual';

// Form types
export interface LibraryForm {
  name: string;
  description: string;
}

export interface BookForm {
  isbn: string;
  b_code: string;
  b_name: string;
  b_author: string;
  b_price: string;
}

export interface MemberForm {
  m_code: string;
  m_name: string;
  m_phone: string;
}

export interface IssueForm {
  book_code: string;
  member_code: string;
  issue_date: string;
}

// Supabase Auth types
export interface SupabaseUser {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    picture?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown; // For mock user properties like full_name, email at root level
}

export interface SupabaseSession {
  user: SupabaseUser | null;
  [key: string]: unknown;
}

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';

export interface AuthChangeCallback {
  (event: AuthChangeEvent, session: SupabaseSession | null): void;
}

