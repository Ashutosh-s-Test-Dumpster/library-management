"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
                <div className={`w-8 h-8 bg-gold rounded-lg flex items-center justify-center logo-container header-logo ${isAtTop ? 'expanded' : ''}`}>
                  <span className="text-black font-sans font-bold text-sm cursor-pointer">B</span>
                </div>
                <h1 className="font-sans font-bold text-xl text-white cursor-pointer">Bibliotheque</h1>
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
      <main className="pt-32 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Welcome to Your
            <br />
            <span className="text-gold">Dashboard</span>
          </h2>
          <p className="font-sans text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            You have successfully signed in to the Bibliotheque library management system. 
            Your dashboard will be available here soon.
          </p>
        </div>
      </main>

      {/* Floating Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className={`enhanced-blur rounded-2xl px-6 py-4 sleek-shadow ${isAtBottom ? 'expanded' : ''}`}>
            <div className={`flex items-center justify-between nav-content ${isAtBottom ? 'expanded' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 bg-gold rounded-lg flex items-center justify-center logo-container footer-logo ${isAtBottom ? 'expanded' : ''}`}>
                  <span className="text-black font-sans font-bold text-xs">B</span>
                </div>
                <p className="font-sans text-text-secondary text-sm">
                  © 2025 Bibliotheque. <span className="hidden md:inline">Built for <span className="text-gold">library administrators</span>.</span>
                </p>
              </div>
              <div className="flex items-center">
                <Link href="#" className={`text-text-secondary hover:text-gold transition-colors font-sans text-sm nav-link ${isAtBottom ? 'expanded' : ''}`}>Documentation</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 