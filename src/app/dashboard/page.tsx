"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLibraryStats } from "@/hooks/useLibraryStats";
import { supabase } from "@/lib/supabase";
import type { Library, LibraryForm, UserProfile, DashboardTab } from "@/types";
import { VALIDATION, DELETE_CONFIRMATION_TEXT } from "@/constants";
import BookManagement from '@/components/BookManagement';
import MemberManagement from '@/components/MemberManagement';
import IssueManagement from '@/components/IssueManagement';
import Sidebar from '@/components/dashboard/Sidebar';
import BottomNav from '@/components/dashboard/BottomNav';
import Header from '@/components/dashboard/Header';
import OverviewTab from '@/components/dashboard/OverviewTab';

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [currentLibrary, setCurrentLibrary] = useState<Library | null>(null);
  const [showCreateLibrary, setShowCreateLibrary] = useState(false);
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [libraryForm, setLibraryForm] = useState<LibraryForm>({
    name: '',
    description: ''
  });

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const { signOut, loading } = useAuth();
  const router = useRouter();
  const { stats, recentData, refetch: refetchStats } = useLibraryStats(currentLibrary?.id || null);

  useEffect(() => {
    const verifyAuthAndGetUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
        const user = session.user;
        if (!user) {
          router.push('/');
          return;
        }
        
        // Handle mock user format
        const mockUser = user as import('@/types').SupabaseUser;
        const userName = user.user_metadata?.full_name || (mockUser.full_name as string | undefined) || user.email || 'Mock User';
        const userEmail = user.email || (mockUser.email as string | undefined) || 'mock@example.com';
        
        setUserProfile({
          name: userName,
          email: userEmail,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          initials: (userName || 'MU')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        });

        const userId = user.id || (mockUser.id as string | undefined) || '';
        await loadLibraries(userId);
      } catch (error) {
        console.error('Error verifying authentication:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthAndGetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: import('@/types').AuthChangeEvent, session: import('@/types').SupabaseSession | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      } else if (event === 'SIGNED_IN' && session) {
        // Reload user data on sign in
        verifyAuthAndGetUser();
      }
    });

    // Listen for mock auth changes
    const handleMockAuthChange = (e: CustomEvent) => {
      if (e.detail.event === 'SIGNED_OUT') {
        router.push('/');
      } else if (e.detail.event === 'SIGNED_IN') {
        verifyAuthAndGetUser();
      }
    };

    window.addEventListener('mock-auth-change', handleMockAuthChange as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mock-auth-change', handleMockAuthChange as EventListener);
    };
  }, [router]);

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
        // Stats will load automatically via useLibraryStats hook
      }
    } catch (error) {
      console.error('Error loading libraries:', error);
    }
  };

  const createLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const trimmedName = libraryForm.name.trim();
    const trimmedDescription = libraryForm.description.trim();

    // Validation
    if (!trimmedName) {
      alert('Library name is required.');
      return;
    }

    if (trimmedName.length < VALIDATION.LIBRARY_NAME_MIN_LENGTH) {
      alert(`Library name must be at least ${VALIDATION.LIBRARY_NAME_MIN_LENGTH} characters long.`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check for duplicate names (case-insensitive)
      const { data: existingLibs } = await supabase
        .from('libraries')
        .select('id, name')
        .eq('user_id', user.id);

      const duplicate = existingLibs?.find(
        (lib: Library) => lib.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicate) {
        alert(`A library named "${duplicate.name}" already exists. Please choose a different name.`);
        return;
      }

      const { data, error } = await supabase
        .from('libraries')
        .insert([{
          name: trimmedName,
          description: trimmedDescription || null,
            user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setLibraries(prev => [data, ...prev]);
      setCurrentLibrary(data);
      setShowCreateLibrary(false);
      setLibraryForm({ name: '', description: '' });

      // Show success feedback
      alert(`Library "${data.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating library:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to create library: ${errorMessage}`);
    }
  };

  const switchLibrary = (library: Library) => {
    setCurrentLibrary(library);
    setShowLibraryManager(false);
    setActiveTab('overview');
    // Stats will load automatically via useLibraryStats hook
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
    
    // Prevent deleting the currently active library if it's the only one
    if (selectedLibraries.size === libraries.length && currentLibrary) {
      alert('Cannot delete all libraries. You must have at least one library.');
      return;
    }
    
    setShowDeleteConfirmation(true);
  };

  const confirmBatchDelete = async () => {
    // Simplified confirmation - just type "DELETE"
    if (deleteConfirmationText.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT) {
      alert(`Please type "${DELETE_CONFIRMATION_TEXT}" to confirm.`);
      return;
    }

    const librariesToDelete = libraries.filter(lib => selectedLibraries.has(lib.id));
    const deletedCount = selectedLibraries.size;
    const deletedNames = librariesToDelete.map(lib => lib.name).join(', ');

    try {
      // Delete libraries one by one
      const deletePromises = Array.from(selectedLibraries).map(libraryId =>
        supabase.from('libraries').delete().eq('id', libraryId)
      );
      
      const results = await Promise.all(deletePromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} library/libraries`);
      }

      const remainingLibraries = libraries.filter(lib => !selectedLibraries.has(lib.id));
      setLibraries(remainingLibraries);

      // Handle current library if it was deleted
      if (currentLibrary && selectedLibraries.has(currentLibrary.id)) {
        if (remainingLibraries.length > 0) {
          setCurrentLibrary(remainingLibraries[0]);
          // Stats will load automatically via useLibraryStats hook
        } else {
          setCurrentLibrary(null);
        }
      }

      // Reset state
      setSelectedLibraries(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');
      setShowLibraryManager(false);
      
      alert(`Successfully deleted ${deletedCount} ${deletedCount === 1 ? 'library' : 'libraries'}: ${deletedNames}`);
    } catch (error) {
      console.error('Error deleting libraries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to delete libraries: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (!currentLibrary) return;

    const tables = ['book_management', 'member_management', 'issue_management'];
    const channels = tables.map((table) => {
      return supabase
        .channel(`${table}-changes-${currentLibrary.id}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table,
            filter: `library_id=eq.${currentLibrary.id}`
        }, () => {
          refetchStats();
        })
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch {
          // Ignore errors when removing channels
        }
      });
    };
  }, [currentLibrary, refetchStats]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}>
            <div className="loading-spinner"></div>
          </div>
          <p className="text-text-secondary font-sans">Loading...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-bg-primary relative flex flex-col md:flex-row">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLibraryManagerClick={() => setShowLibraryManager(true)}
        userInitials={userProfile?.initials || 'U'}
        userAvatar={userProfile?.avatar}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLibraryManagerClick={() => setShowLibraryManager(true)}
      />

      <Header
        currentLibrary={currentLibrary}
        onSignOut={handleSignOut}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 mt-14 md:mt-16 md:ml-20 pb-16 md:pb-0">
        {libraries.length === 0 && (
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] p-4 md:p-8">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4 md:mb-6" style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}>
                <span className="text-accent-primary font-mono font-bold text-2xl md:text-4xl">+</span>
              </div>
              <p className="text-text-secondary text-sm md:text-base mb-6 md:mb-8 font-sans">
                Create your first library to get started.
              </p>
              <button 
                onClick={() => setShowCreateLibrary(true)}
                className="flat-button flat-button-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-base"
              >
                CREATE LIBRARY
              </button>
            </div>
          </div>
        )}

        {libraries.length > 0 && currentLibrary && (
          <div className="min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
            {/* Main Content */}
            <div className={`h-full overflow-y-auto ${activeTab === 'overview' ? '' : 'p-3 md:p-6'}`}>
              {activeTab === 'overview' && currentLibrary && (
                <OverviewTab
                  library={currentLibrary}
                  stats={stats}
                  recentData={recentData}
                  onTabChange={setActiveTab}
                />
              )}

              {activeTab === 'books' && (
                  <BookManagement libraryId={currentLibrary.id} />
              )}

              {activeTab === 'members' && (
                  <MemberManagement libraryId={currentLibrary.id} />
              )}

              {activeTab === 'issues' && (
                  <IssueManagement libraryId={currentLibrary.id} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Library Modal - Centered */}
      {showCreateLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
            onClick={() => {
              setShowCreateLibrary(false);
              setLibraryForm({ name: '', description: '' });
            }}
          ></div>
          
          <div className="relative w-full max-w-lg flat-card border-2 border-border-accent p-4 md:p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in">
            <button
              onClick={() => {
                setShowCreateLibrary(false);
                setLibraryForm({ name: '', description: '' });
              }}
              className="absolute top-4 right-4 text-text-secondary hover:text-accent-error transition-colors w-8 h-8 flex items-center justify-center border border-border-primary hover:border-accent-error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}>
                <svg className="w-10 h-10 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">
                CREATE NEW LIBRARY
              </h2>
              <p className="text-text-secondary text-sm">
                Set up a new library collection to manage books, members, and issues
              </p>
            </div>

            <form onSubmit={createLibrary} className="space-y-5">
              <div>
                <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider font-mono">
                  LIBRARY NAME
                </label>
                <input
                  type="text"
                  value={libraryForm.name}
                  onChange={(e) => setLibraryForm(prev => ({ ...prev, name: e.target.value.trimStart() }))}
                  className="flat-input w-full"
                  placeholder="Enter library name"
                  required
                  maxLength={VALIDATION.LIBRARY_NAME_MAX_LENGTH}
                  autoFocus
                />
                <p className="text-text-tertiary text-xs mt-1 font-mono">
                  {libraryForm.name.length}/{VALIDATION.LIBRARY_NAME_MAX_LENGTH} characters
                </p>
              </div>

              <div>
                <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider font-mono">
                  DESCRIPTION <span className="text-text-tertiary font-normal">(OPTIONAL)</span>
                </label>
                <textarea
                  value={libraryForm.description}
                  onChange={(e) => setLibraryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="flat-input w-full resize-none"
                  placeholder="Add a brief description about this library..."
                  rows={4}
                  maxLength={VALIDATION.LIBRARY_DESCRIPTION_MAX_LENGTH}
                />
                <p className="text-text-tertiary text-xs mt-1 font-mono">
                  {libraryForm.description.length}/{VALIDATION.LIBRARY_DESCRIPTION_MAX_LENGTH} characters
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
              <button
                  type="button"
                  onClick={() => {
                    setShowCreateLibrary(false);
                    setLibraryForm({ name: '', description: '' });
                  }}
                  className="flex-1 flat-button py-3"
                >
                  CANCEL
              </button>
            <button
                  type="submit"
                  className="flex-1 flat-button flat-button-primary py-3"
            >
                  CREATE LIBRARY
            </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Library Manager Modal - Centered */}
      {showLibraryManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
            onClick={() => {
              setShowLibraryManager(false);
              setIsDeleteMode(false);
              setSelectedLibraries(new Set());
            }}
          ></div>
          
          <div className="relative w-full max-w-lg flat-card border-2 border-border-accent p-4 md:p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 border-2 border-accent-primary flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)' }}>
                  <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider">
                    LIBRARY MANAGER
                  </h2>
                  <p className="text-text-secondary text-xs font-mono">
                    {libraries.length} {libraries.length === 1 ? 'library' : 'libraries'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isDeleteMode && (
            <button
              onClick={toggleDeleteMode}
                    className="w-10 h-10 border-2 border-border-primary hover:border-accent-error text-text-secondary hover:text-accent-error transition-colors flex items-center justify-center"
                    title="Delete libraries"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
            </button>
                )}
                <button
                  onClick={() => {
                    setShowLibraryManager(false);
                    setIsDeleteMode(false);
                    setSelectedLibraries(new Set());
                  }}
                  className="w-10 h-10 border-2 border-border-primary hover:border-accent-error text-text-secondary hover:text-accent-error transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {isDeleteMode && (
              <div className="flat-card p-4 mb-6 border-accent-error bg-bg-tertiary">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-accent-error text-sm font-mono font-bold">
                      DELETE MODE
                    </span>
                  </div>
                  <button
                    onClick={toggleDeleteMode}
                    className="text-text-secondary hover:text-text-primary text-xs font-mono"
                  >
                    CANCEL
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-mono">
                    {selectedLibraries.size} of {libraries.length} selected
                  </span>
                  <button
                    onClick={startBatchDelete}
                    disabled={selectedLibraries.size === 0}
                    className="flat-button border-accent-error text-accent-error hover:bg-accent-error hover:text-bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs px-4 py-2"
                  >
                    DELETE SELECTED
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!isDeleteMode && (
                <button
                  onClick={() => {
                    setShowLibraryManager(false);
                    setShowCreateLibrary(true);
                  }}
                  className="w-full flat-card p-4 text-left hover:border-accent-primary transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 border-2 border-accent-primary flex items-center justify-center group-hover:bg-accent-primary/10 transition-colors">
                      <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                  </div>
                    <div>
                      <p className="text-text-primary font-medium uppercase text-sm">CREATE NEW LIBRARY</p>
                      <p className="text-text-secondary text-xs font-mono">Add a new collection</p>
                    </div>
                  </div>
                </button>
              )}

              {libraries.length > 0 ? (
                <div>
                  <p className="text-text-tertiary text-xs uppercase tracking-wider mb-3 font-mono">
                    YOUR LIBRARIES
                  </p>
                  <div className="space-y-2">
                    {libraries.map((library) => {
                      const isActive = library.id === currentLibrary?.id;
                      const isSelected = selectedLibraries.has(library.id);
                      return (
                        <div
                          key={library.id}
                          className={`flat-card p-4 transition-all ${
                            isDeleteMode
                              ? isSelected
                                ? 'border-accent-error bg-accent-error/10'
                                : 'hover:border-accent-error cursor-pointer'
                              : isActive 
                                ? 'border-accent-primary bg-bg-tertiary' 
                                : 'hover:border-accent-primary/50 cursor-pointer'
                          }`}
                          onClick={isDeleteMode ? () => toggleLibrarySelection(library.id) : undefined}
                        >
                          {isDeleteMode ? (
                            <div className="flex items-center space-x-4">
                              <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                isSelected
                                  ? 'border-accent-error bg-accent-error text-bg-primary'
                                  : 'border-border-primary'
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                            </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium truncate">{library.name}</p>
                                {library.description && (
                                  <p className="text-text-secondary text-xs font-mono truncate mt-1">{library.description}</p>
                          )}
                              </div>
                            </div>
                          ) : (
                          <button
                              onClick={() => !isActive && switchLibrary(library)}
                              className="w-full text-left flex items-center justify-between"
                              disabled={isActive}
                            >
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 border-2 flex items-center justify-center flex-shrink-0 ${
                                  isActive ? 'border-accent-primary' : 'border-border-primary'
                                }`}>
                                  <svg className={`w-6 h-6 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${
                                    isActive ? 'text-accent-primary' : 'text-text-primary'
                              }`}>
                                {library.name}
                              </p>
                                  {library.description ? (
                                    <p className="text-text-secondary text-xs font-mono truncate mt-1">{library.description}</p>
                                  ) : (
                                    <p className="text-text-tertiary text-xs font-mono mt-1">{library.id.slice(0, 8)}</p>
                              )}
                            </div>
                              </div>
                              {isActive && (
                                <span className="flat-badge flat-badge-primary ml-2 flex-shrink-0">ACTIVE</span>
                              )}
                          </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-2 border-border-primary flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
            </div>
                  <p className="text-text-secondary text-sm font-sans mb-4">No libraries yet</p>
            <button
                    onClick={() => {
                      setShowLibraryManager(false);
                      setShowCreateLibrary(true);
                    }}
                    className="flat-button flat-button-primary text-xs px-4 py-2"
                  >
                    CREATE FIRST LIBRARY
            </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Center Overlay */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
            onClick={() => {
              setShowDeleteConfirmation(false);
              setDeleteConfirmationText('');
            }}
          ></div>
          
          <div className="relative w-full max-w-lg flat-card p-8 border-2 border-accent-error animate-rigid-pop-in">
            <button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setDeleteConfirmationText('');
              }}
              className="absolute top-4 right-4 text-text-secondary hover:text-accent-error transition-colors w-8 h-8 flex items-center justify-center border border-border-primary hover:border-accent-error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 border-2 border-accent-error flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' }}>
                <svg className="w-10 h-10 text-accent-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-accent-error mb-2 uppercase tracking-wider">
                CONFIRM DELETION
              </h2>
              <p className="text-text-secondary text-sm">
                This action cannot be undone. All data in these libraries will be permanently deleted.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flat-card p-4 border-accent-error bg-bg-tertiary">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-accent-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-accent-error text-sm font-medium uppercase font-mono">
                    LIBRARIES TO DELETE ({selectedLibraries.size})
                  </p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {libraries
                    .filter(lib => selectedLibraries.has(lib.id))
                    .map(library => (
                      <div key={library.id} className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-accent-error mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary text-sm font-medium truncate">{library.name}</p>
                          {library.description && (
                            <p className="text-text-secondary text-xs font-mono truncate mt-0.5">{library.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div>
                <label className="block text-text-primary text-sm font-medium mb-2 uppercase font-mono">
                  TYPE TO CONFIRM: <span className="text-accent-error">DELETE</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="flat-input w-full"
                  placeholder="Type 'DELETE' to confirm"
                  autoFocus
                />
                <p className="text-text-tertiary text-xs mt-2 font-mono">
                  Type the word &quot;DELETE&quot; to confirm this action
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteConfirmationText('');
                  }}
                  className="flex-1 flat-button py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmBatchDelete}
                  disabled={deleteConfirmationText.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT}
                  className="flex-1 flat-button border-accent-error text-accent-error hover:bg-accent-error hover:text-bg-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  DELETE LIBRARIES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
