"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import BookManagement from '@/components/BookManagement';
import MemberManagement from '@/components/MemberManagement';
import IssueManagement from '@/components/IssueManagement';

// Library management types
interface Library {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_id: string;
}

interface Book {
  id: number;
  code: number;
  name: string;
  author: string;
  price: number;
  library_id: string;
}

interface Member {
  id: number;
  code: number;
  name: string;
  phone: string;
  library_id: string;
}

interface Issue {
  id: number;
  book_code: number;
  member_code: number;
  issue_date: string;
  return_date: string | null;
  library_id: string;
}

export default function Dashboard() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [currentLibrary, setCurrentLibrary] = useState<Library | null>(null);
  const [showCreateLibrary, setShowCreateLibrary] = useState(false);
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'members' | 'issues'>('overview');
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeIssues: 0,
    overdueBooks: 0
  });
  
  // Library creation form
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    description: ''
  });

  // Batch delete state
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const { signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if at top (with small threshold)
      setIsAtTop(scrollTop <= 10);
      
      // Check if at bottom (with small threshold)
      setIsAtBottom(scrollTop + windowHeight >= documentHeight - 10);
    };

    // Set initial state
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Verify authentication and get user profile
    const verifyAuthAndGetUser = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/');
          return;
        }

        if (!session || !session.user) {
          console.log('No valid session found, redirecting to home');
          router.push('/');
          return;
        }

        // Session is valid, set authentication state
        setIsAuthenticated(true);
        
        // Get user profile data
        const user = session.user;
        setUserProfile({
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          initials: (user.user_metadata?.full_name || user.email || '')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        });

        // Load user's libraries
        await loadLibraries(user.id);

        console.log('User authenticated successfully:', {
          email: user.email,
          name: user.user_metadata?.full_name
        });
        
      } catch (error) {
        console.error('Error verifying authentication:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthAndGetUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadStats = async (libraryId: string) => {
    try {
      // Load books count
      const { count: booksCount } = await supabase
        .from('book_management')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId);

      // Load members count
      const { count: membersCount } = await supabase
        .from('member_management')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId);

      // Load active issues count
      const { count: activeIssuesCount } = await supabase
        .from('issue_management')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId)
        .is('i_date_of_ret', null);

      // Load overdue books count (assuming 14 days lending period)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { count: overdueCount } = await supabase
        .from('issue_management')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId)
        .is('i_date_of_ret', null)
        .lt('i_date_of_iss', fourteenDaysAgo.toISOString().split('T')[0]);

      setStats({
        totalBooks: booksCount || 0,
        totalMembers: membersCount || 0,
        activeIssues: activeIssuesCount || 0,
        overdueBooks: overdueCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLibraries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('libraries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLibraries(data || []);
      if (data && data.length > 0) {
        setCurrentLibrary(data[0]);
        // Load stats for the first library
        await loadStats(data[0].id);
      }
    } catch (error) {
      console.error('Error loading libraries:', error);
    }
  };

  const createLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check for duplicate library name for this user (case-insensitive)
      const { data: existingLib } = await supabase
        .from('libraries')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', libraryForm.name.trim())
        .single();

      if (existingLib) {
        alert('You already have a library with this name. Please choose a different name.');
        return;
      }

      const { data, error } = await supabase
        .from('libraries')
        .insert([
          {
            name: libraryForm.name.trim(),
            description: libraryForm.description.trim(),
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update libraries list
      setLibraries(prev => [data, ...prev]);
      setCurrentLibrary(data);
      setShowCreateLibrary(false);
      setLibraryForm({ name: '', description: '' });

    } catch (error) {
      console.error('Error creating library:', error);
      alert('Failed to create library. Please try again.');
    }
  };

  const switchLibrary = async (library: Library) => {
    setCurrentLibrary(library);
    setShowLibraryManager(false);
    // Reset to overview tab when switching libraries
    setActiveTab('overview');
    // Load stats for the new library
    await loadStats(library.id);
  };

  const deleteLibrary = async (library: Library) => {
    if (!confirm(`Are you sure you want to delete "${library.name}"? This will permanently delete all books, members, and issues in this library.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('libraries')
        .delete()
        .eq('id', library.id);

      if (error) throw error;

      // Remove from libraries list
      const updatedLibraries = libraries.filter(l => l.id !== library.id);
      setLibraries(updatedLibraries);

      // If we deleted the current library, switch to the first available one
      if (currentLibrary?.id === library.id) {
        if (updatedLibraries.length > 0) {
          setCurrentLibrary(updatedLibraries[0]);
          await loadStats(updatedLibraries[0].id);
        } else {
          setCurrentLibrary(null);
        }
      }

      setShowLibraryManager(false);
      alert('Library deleted successfully!');
    } catch (error) {
      console.error('Error deleting library:', error);
      alert('Failed to delete library. Please try again.');
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedLibraries(new Set());
  };

  const toggleLibrarySelection = (libraryId: string) => {
    const newSelected = new Set(selectedLibraries);
    if (newSelected.has(libraryId)) {
      newSelected.delete(libraryId);
    } else {
      newSelected.add(libraryId);
    }
    setSelectedLibraries(newSelected);
  };

  const startBatchDelete = () => {
    if (selectedLibraries.size === 0) {
      alert('Please select at least one library to delete.');
      return;
    }
    setShowDeleteConfirmation(true);
  };

  const confirmBatchDelete = async () => {
    const selectedLibraryObjects = libraries.filter(lib => selectedLibraries.has(lib.id));
    const expectedText = selectedLibraryObjects.map(lib => lib.name).join(', ');
    
    if (deleteConfirmationText !== expectedText) {
      alert('Library names do not match. Please type the exact names.');
      return;
    }

    try {
      // Delete all selected libraries
      for (const libraryId of selectedLibraries) {
        const { error } = await supabase
          .from('libraries')
          .delete()
          .eq('id', libraryId);

        if (error) throw error;
      }

      // Update libraries list
      const remainingLibraries = libraries.filter(lib => !selectedLibraries.has(lib.id));
      setLibraries(remainingLibraries);

      // If current library was deleted, switch to first remaining one
      if (currentLibrary && selectedLibraries.has(currentLibrary.id)) {
        if (remainingLibraries.length > 0) {
          setCurrentLibrary(remainingLibraries[0]);
          await loadStats(remainingLibraries[0].id);
        } else {
          setCurrentLibrary(null);
        }
      }

      // Reset states
      setSelectedLibraries(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');
      setShowLibraryManager(false);
      
      alert(`Successfully deleted ${selectedLibraries.size} libraries.`);
    } catch (error) {
      console.error('Error deleting libraries:', error);
      alert('Failed to delete some libraries. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        router.push('/');
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Real-time updates for stats
  useEffect(() => {
    if (!currentLibrary) return;

    // Tables to listen for changes
    const tables = ['book_management', 'member_management', 'issue_management'];

    const channels = tables.map((table) => {
      return supabase
        .channel(`${table}-changes-${currentLibrary.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `library_id=eq.${currentLibrary.id}`
          },
          () => {
            // Reload stats on any change related to this library
            loadStats(currentLibrary.id);
          }
        )
        .subscribe();
    });

    // Cleanup
    return () => {
      channels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch (_) {
          /* ignore */
        }
      });
    };
  }, [currentLibrary]);

  // Show loading state while verifying authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-black font-sans font-bold text-lg">B</span>
          </div>
          <p className="text-white font-sans">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className={`enhanced-blur rounded-2xl px-6 py-4 sleek-shadow ${isAtTop ? 'expanded' : ''}`}>
            <div className={`flex items-center justify-between nav-content ${isAtTop ? 'expanded' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center logo-container header-logo">
                  <span className="text-black font-sans font-bold text-sm cursor-pointer">B</span>
                </div>
                <h1 className="font-sans font-bold text-xl text-white cursor-pointer">Bibliotheque</h1>
                {currentLibrary && (
                  <div className="flex items-center space-x-2">
                    <span className="text-text-secondary font-sans text-sm">
                      / {currentLibrary.name}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowLibraryManager(!showLibraryManager)}
                        className="w-6 h-6 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center hover:bg-gold/30 transition-colors"
                        title="Manage Libraries"
                      >
                        <span className="text-gold font-bold text-sm">+</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile: Show Profile + Sign Out */}
              <div className="md:hidden">
                <div className="flex items-center space-x-3">
                  {/* Profile Picture */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 border-gold/30 ${isAtTop ? 'expanded' : ''}`}>
                    {userProfile?.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full bg-gold flex items-center justify-center text-black text-xs font-bold">${userProfile.initials}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gold flex items-center justify-center text-black text-xs font-bold">
                        {userProfile?.initials || 'U'}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleSignOut}
                    disabled={loading}
                    className={`bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button text-sm disabled:opacity-50 disabled:cursor-not-allowed ${isAtTop ? 'expanded' : ''}`}
                  >
                    {loading ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
              
              {/* Desktop: Show Profile + Sign Out */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Profile Picture */}
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 ${isAtTop ? 'expanded' : ''}`}>
                  {userProfile?.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full bg-gold flex items-center justify-center text-black text-sm font-bold">${userProfile.initials}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gold flex items-center justify-center text-black text-sm font-bold">
                      {userProfile?.initials || 'U'}
                    </div>
                  )}
                </div>
                
                {/* User Name (optional, you can remove this if you want) */}
                <div className="hidden lg:block">
                  <p className="text-white text-sm font-medium">{userProfile?.name}</p>
                  <p className="text-text-secondary text-xs">{userProfile?.email}</p>
                </div>
                
                <button 
                  onClick={handleSignOut}
                  disabled={loading}
                  className={`bg-gold text-black px-6 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button disabled:opacity-50 disabled:cursor-not-allowed ${isAtTop ? 'expanded' : ''}`}
                >
                  {loading ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-44 md:pt-32 pb-32 px-6">
        {/* No Libraries - Show Create Library */}
        {libraries.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl text-center">
              <p className="font-sans text-lg md:text-xl text-text-secondary leading-relaxed mb-10">
                Start managing your library by creating your first library database. 
                You can manage books, members, and track book issues all in one place.
              </p>
              <button 
                onClick={() => setShowCreateLibrary(true)}
                className="bg-gold text-black px-8 py-4 rounded-lg font-sans text-lg hover:bg-yellow-200 transition-all inline-flex items-center space-x-2"
              >
                <span className="text-2xl">+</span>
                <span>Create Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Has Libraries - Show Library Management */}
        {libraries.length > 0 && currentLibrary && (
          <div className="max-w-6xl mx-auto">
            {/* Library Header */}
            <div className="text-center mb-8">
              <h2 className="font-sans text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                {currentLibrary.name}
              </h2>
              <p className="font-sans text-lg text-text-secondary max-w-2xl mx-auto">
                {currentLibrary.description}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="enhanced-blur rounded-2xl p-2">
                <div className="flex space-x-2">
                  {[
                    { key: 'overview', label: 'Overview', icon: '📊' },
                    { key: 'books', label: 'Books', icon: '📚' },
                    { key: 'members', label: 'Members', icon: '👥' },
                    { key: 'issues', label: 'Issues', icon: '📋' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
                        activeTab === tab.key
                          ? 'bg-gold text-black'
                          : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="enhanced-blur rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">📚</div>
                      <h3 className="text-3xl font-bold text-gold mb-2">{stats.totalBooks}</h3>
                      <p className="text-text-secondary">Total Books</p>
                    </div>
                    
                    <div className="enhanced-blur rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">👥</div>
                      <h3 className="text-3xl font-bold text-gold mb-2">{stats.totalMembers}</h3>
                      <p className="text-text-secondary">Total Members</p>
                    </div>
                    
                    <div className="enhanced-blur rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <h3 className="text-3xl font-bold text-blue-400 mb-2">{stats.activeIssues}</h3>
                      <p className="text-text-secondary">Active Issues</p>
                    </div>

                    <div className="enhanced-blur rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">⚠️</div>
                      <h3 className="text-3xl font-bold text-red-400 mb-2">{stats.overdueBooks}</h3>
                      <p className="text-text-secondary">Overdue Books</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="enhanced-blur rounded-2xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('books')}
                        className="p-6 bg-gold/10 border border-gold/20 rounded-xl hover:bg-gold/20 transition-colors"
                      >
                        <div className="text-4xl mb-3">📚</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Manage Books</h4>
                        <p className="text-text-secondary text-sm">Add, edit, or remove books from your library</p>
                      </button>

                      <button
                        onClick={() => setActiveTab('members')}
                        className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors"
                      >
                        <div className="text-4xl mb-3">👥</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Manage Members</h4>
                        <p className="text-text-secondary text-sm">Register and manage library members</p>
                      </button>

                      <button
                        onClick={() => setActiveTab('issues')}
                        className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors"
                      >
                        <div className="text-4xl mb-3">📋</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Issue & Return</h4>
                        <p className="text-text-secondary text-sm">Issue books to members and track returns</p>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {stats.activeIssues > 0 && (
                    <div className="enhanced-blur rounded-2xl p-6">
                      <h3 className="text-2xl font-bold text-white mb-4">Library Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b border-border">
                          <span className="text-text-secondary">Books in circulation</span>
                          <span className="text-white font-semibold">{stats.activeIssues}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border">
                          <span className="text-text-secondary">Available books</span>
                          <span className="text-white font-semibold">{stats.totalBooks - stats.activeIssues}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-text-secondary">Library utilization</span>
                          <span className="text-white font-semibold">
                            {stats.totalBooks > 0 ? Math.round((stats.activeIssues / stats.totalBooks) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'books' && (
                <div className="enhanced-blur rounded-2xl p-6">
                  <BookManagement libraryId={currentLibrary.id} />
                </div>
              )}

              {activeTab === 'members' && (
                <div className="enhanced-blur rounded-2xl p-6">
                  <MemberManagement libraryId={currentLibrary.id} />
                </div>
              )}

              {activeTab === 'issues' && (
                <div className="enhanced-blur rounded-2xl p-6">
                  <IssueManagement libraryId={currentLibrary.id} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Library Modal */}
      {showCreateLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowCreateLibrary(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-sans font-bold text-lg">+</span>
              </div>
              <h2 className="font-sans text-2xl font-bold text-white mb-2">
                Create New Library
              </h2>
              <p className="text-text-secondary text-sm">
                Set up your library management system
              </p>
            </div>

            <form onSubmit={createLibrary} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Library Name
                </label>
                <input
                  type="text"
                  value={libraryForm.name}
                  onChange={(e) => setLibraryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                  placeholder="e.g., Central City Library"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={libraryForm.description}
                  onChange={(e) => setLibraryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold resize-none"
                  placeholder="Brief description of your library..."
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold text-black py-3 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors"
              >
                Create Library
              </button>
            </form>

            {/* Close button */}
            <button
              onClick={() => setShowCreateLibrary(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Library Management Modal */}
      {showLibraryManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowLibraryManager(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl">
            {/* Delete Mode Toggle Button - Top Left */}
            <button
              onClick={toggleDeleteMode}
              className={`absolute top-4 left-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDeleteMode 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
              title={isDeleteMode ? 'Exit delete mode' : 'Enter delete mode'}
            >
              <span className="text-sm font-bold">
                {isDeleteMode ? '✕' : '🗑️'}
              </span>
            </button>

            {/* Batch Delete Actions */}
            {isDeleteMode && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-red-400 text-sm">
                    {selectedLibraries.size} selected
                  </span>
                  <button
                    onClick={startBatchDelete}
                    disabled={selectedLibraries.size === 0}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-sans font-bold text-lg">📚</span>
              </div>
              <h2 className="font-sans text-2xl font-bold text-white mb-2">
                Library Management
              </h2>
              <p className="text-text-secondary text-sm">
                {isDeleteMode 
                  ? 'Select libraries to delete in batch'
                  : 'Manage your libraries, switch between them, or create new ones'
                }
              </p>
            </div>

            <div className="space-y-4">
              {/* Create New Library */}
              {!isDeleteMode && (
                <button
                  onClick={() => {
                    setShowLibraryManager(false);
                    setShowCreateLibrary(true);
                  }}
                  className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-gold/10 transition-colors border border-gold/20"
                >
                  <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-lg">+</span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Create New Library</p>
                    <p className="text-text-secondary text-sm">Add another library to manage</p>
                  </div>
                </button>
              )}

              {/* All Libraries */}
              {libraries.length > 0 && (
                <div>
                  <p className="text-text-secondary text-sm mb-3 px-2">Your Libraries ({libraries.length}):</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {libraries.map((library) => {
                      const isActive = library.id === currentLibrary?.id;
                      const isSelected = selectedLibraries.has(library.id);
                      return (
                        <div
                          key={library.id}
                          className={`w-full flex items-center space-x-3 p-4 rounded-lg transition-colors ${
                            isDeleteMode
                              ? isSelected
                                ? 'bg-red-500/20 border border-red-500/40'
                                : 'hover:bg-red-500/10 border border-transparent'
                              : isActive 
                                ? 'bg-gold/20 border border-gold/40' 
                                : 'hover:bg-blue-500/10 border border-transparent'
                          }`}
                        >
                          {/* Checkbox for delete mode */}
                          {isDeleteMode ? (
                            <button
                              onClick={() => toggleLibrarySelection(library.id)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-red-600 border-red-600 text-white'
                                  : 'border-red-400 hover:border-red-500'
                              }`}
                            >
                              {isSelected && <span className="text-sm font-bold">✓</span>}
                            </button>
                          ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-gold' : 'bg-blue-600'
                            }`}>
                              <span className={`font-bold text-lg ${
                                isActive ? 'text-black' : 'text-white'
                              }`}>
                                {isActive ? '✓' : '📚'}
                              </span>
                            </div>
                          )}
                          
                          {/* Library info */}
                          <button
                            onClick={() => {
                              if (isDeleteMode) {
                                toggleLibrarySelection(library.id);
                              } else if (!isActive) {
                                switchLibrary(library);
                              }
                            }}
                            className="text-left flex-1"
                            disabled={!isDeleteMode && isActive}
                          >
                            <div className="flex items-center space-x-2">
                              <p className={`font-medium ${
                                isDeleteMode
                                  ? isSelected ? 'text-red-400' : 'text-white'
                                  : isActive ? 'text-gold' : 'text-white'
                              }`}>
                                {library.name}
                              </p>
                              {!isDeleteMode && isActive && (
                                <span className="bg-gold/20 text-gold text-xs font-semibold px-2 py-1 rounded">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-text-secondary text-sm line-clamp-1">{library.description}</p>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowLibraryManager(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            onClick={() => {
              setShowDeleteConfirmation(false);
              setDeleteConfirmationText('');
            }}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-card border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-sans font-bold text-2xl">⚠️</span>
              </div>
              <h2 className="font-sans text-2xl font-bold text-red-400 mb-2">
                Confirm Deletion
              </h2>
              <p className="text-text-secondary text-sm">
                This action cannot be undone. This will permanently delete the selected libraries and all their data.
              </p>
            </div>

            <div className="space-y-4">
              {/* Libraries to be deleted */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium mb-2">
                  Libraries to be deleted ({selectedLibraries.size}):
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {libraries
                    .filter(lib => selectedLibraries.has(lib.id))
                    .map(library => (
                      <div key={library.id} className="text-white text-sm py-1">
                        • {library.name}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Confirmation input */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Type the library names separated by commas to confirm:
                </label>
                <div className="mb-2">
                  <code className="text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">
                    {libraries
                      .filter(lib => selectedLibraries.has(lib.id))
                      .map(lib => lib.name)
                      .join(', ')
                    }
                  </code>
                </div>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-red-500"
                  placeholder="Type the library names here..."
                  autoFocus
                />
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteConfirmationText('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBatchDelete}
                  disabled={deleteConfirmationText !== libraries
                    .filter(lib => selectedLibraries.has(lib.id))
                    .map(lib => lib.name)
                    .join(', ')
                  }
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Libraries
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setDeleteConfirmationText('');
              }}
              className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="enhanced-blur rounded-2xl px-6 py-4 sleek-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gold rounded-lg flex items-center justify-center logo-container footer-logo">
                  <span className="text-black font-sans font-bold text-xs">B</span>
                </div>
                <p className="font-sans text-text-secondary text-sm">
                  © 2025 Bibliotheque. <span className="hidden md:inline">Built for <span className="text-gold">library administrators</span>.</span>
                </p>
              </div>
              <div className="flex items-center">
                <Link href="#" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm nav-link">Documentation</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 