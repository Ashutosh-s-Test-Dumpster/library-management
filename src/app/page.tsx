"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthDebug from "@/components/AuthDebug";

const useMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { signInWithGoogle, signInWithMock, loading, error, setError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Scroll handling can be added here if needed
      void window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openAuthModal = () => {
    setShowAuthModal(true);
    setError(null);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setError(null);
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        closeAuthModal();
        console.log('Google OAuth initiated successfully');
      }
    } catch (err) {
      console.error('Google auth error:', err);
    }
  };

  const handleMockAuth = async () => {
    try {
      const result = await signInWithMock();
      if (result.success) {
        closeAuthModal();
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Mock auth error:', err);
    }
  };

  const features = [
    { 
      id: "books",
      title: "BOOK MANAGEMENT", 
      description: "Complete inventory control with advanced search and cataloging capabilities",
      code: "BK-MGT-001",
      features: ["Add/Edit/Delete", "Advanced Search", "ISBN Lookup", "Category Management"],
    },
    { 
      id: "members",
      title: "MEMBER MANAGEMENT", 
      description: "Comprehensive member database with profile management and activity tracking",
      code: "MB-MGT-001",
      features: ["Member Registration", "Profile Management", "Activity Tracking", "Database Search"],
    },
    { 
      id: "issues",
      title: "ISSUE/RETURN SYSTEM", 
      description: "Automated lending system with due date tracking and fine management",
      code: "IS-MGT-001",
      features: ["Issue Books", "Return Processing", "Due Date Tracking", "Fine Calculation"],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary relative">
      <AuthDebug />
      
      {/* Corner Navigation - Unconventional */}
      <nav className="fixed top-0 right-0 z-50 p-3 md:p-6">
        <div className="flex flex-col items-end space-y-2 md:space-y-3">
          <button 
            onClick={openAuthModal} 
            className="flat-button flat-button-primary text-[10px] md:text-xs px-3 md:px-6 py-2 md:py-3"
          >
            ACCESS
          </button>
          <div className="hidden md:flex flex-col items-end space-y-2">
            <button 
              onClick={() => scrollToSection('books')} 
              className="text-text-secondary hover:text-accent-primary transition-colors font-mono text-xs uppercase tracking-wider"
            >
              BOOKS
            </button>
            <button 
              onClick={() => scrollToSection('members')} 
              className="text-text-secondary hover:text-accent-primary transition-colors font-mono text-xs uppercase tracking-wider"
            >
              MEMBERS
            </button>
            <button 
              onClick={() => scrollToSection('issues')} 
              className="text-text-secondary hover:text-accent-primary transition-colors font-mono text-xs uppercase tracking-wider"
            >
              ISSUES
            </button>
          </div>
        </div>
      </nav>

      {/* Left Side Logo - Fixed */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 border-r-2 border-border-primary bg-bg-secondary z-40 flex-col items-center py-6">
        <div 
          className="w-6 h-6 border-2 border-accent-primary flex items-center justify-center cursor-pointer transition-transform hover:scale-105" 
          onClick={() => scrollToSection('hero')}
          style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
        >
          <span className="text-accent-primary font-mono font-bold text-xs" style={{ textShadow: '0 0 20px var(--accent-primary)' }}>B</span>
        </div>
      </div>

      {/* Hero Section - Asymmetric Layout */}
      <section id="hero" className="min-h-screen flex items-center px-4 md:pl-32 md:pr-32 pt-20 md:pt-16">
        <div className="max-w-4xl w-full">
          <div className="mb-8 md:mb-12">
            <div className="inline-block mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-accent-primary flex items-center justify-center animate-scale-in" style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}>
                <span className="text-accent-primary font-mono font-bold text-sm md:text-base" style={{ textShadow: '0 0 20px var(--accent-primary)' }}>B</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-text-primary mb-4 md:mb-6 uppercase tracking-tight leading-tight">
              LIBRARY
              <br />
              <span className="text-accent-primary" style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}>MANAGEMENT</span>
            </h1>
            <div className="h-1 w-32 md:w-48 bg-accent-primary mb-6 md:mb-8 animate-slide-expand" style={{ boxShadow: '0 0 20px var(--accent-primary)' }}></div>
            <p className="text-text-secondary text-base md:text-xl max-w-xl leading-relaxed mb-6 md:mb-10">
              Manage your libraries with ease.
            </p>
          </div>
          <button 
            onClick={openAuthModal} 
            className="flat-button flat-button-primary text-sm md:text-base px-6 md:px-10 py-3 md:py-5 animate-scale-in w-full md:w-auto"
            style={{ animationDelay: '0.2s' }}
          >
            GET STARTED
          </button>
        </div>
      </section>

      {/* Feature Sections - Split Screen with Snap Scroll */}
      {features.map((feature, index) => (
        <section 
          key={feature.id} 
          id={feature.id} 
          className="min-h-screen snap-start flex flex-col md:flex-row relative"
        >
          {/* Left Side - Sticky Text */}
          <div className="md:sticky md:top-0 w-full md:w-1/2 min-h-[50vh] md:h-screen flex items-center justify-center px-4 md:pl-20 md:pr-12 md:border-r-2 border-b-2 md:border-b-0 border-border-primary bg-bg-primary z-10 py-8 md:py-0">
            <div className="max-w-lg w-full">
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6 mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-accent-primary flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}>
                  <span className="text-accent-primary font-mono font-bold text-2xl md:text-3xl">
                    {feature.id === 'books' ? 'BK' : feature.id === 'members' ? 'MB' : 'IS'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flat-badge flat-badge-primary mb-2 md:mb-3 text-xs">{feature.code}</div>
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-text-primary uppercase tracking-tight mb-3 md:mb-4" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>
                    {feature.title}
                  </h2>
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-4 md:mb-6">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Scrollable Content */}
          <div className="w-full md:w-1/2 flex items-center justify-center px-4 md:pr-20 md:pl-12 bg-bg-secondary py-8 md:py-0">
            <div className="max-w-2xl w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {feature.features.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flat-card p-4 md:p-6 animate-slide-in-left"
                    style={{ animationDelay: `${(index * 0.1) + (idx * 0.05)}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-6 md:h-8 bg-accent-primary flex-shrink-0" style={{ boxShadow: '0 0 8px var(--accent-primary)' }}></div>
                      <span className="text-text-secondary text-xs md:text-sm font-sans">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Footer - Bottom Right Corner */}
      <footer className="fixed bottom-0 right-0 z-30 p-3 md:p-6">
        <div className="flex flex-col items-end space-y-1 md:space-y-2">
          <Link 
            href="https://capable-twist-8f4.notion.site/Bibliotheque-Library-Management-207ecc0d8b2880e1a6efde72da0c0cc8" 
            className="text-text-secondary hover:text-accent-primary transition-colors font-mono text-[10px] md:text-xs uppercase tracking-wider"
          >
            DOCS
          </Link>
          <p className="text-text-tertiary text-[10px] md:text-xs font-mono">
            © 2025 BIBLIOTHEQUE
          </p>
        </div>
      </footer>

      {/* Auth Modal - Centered with Rigid Pop */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
            onClick={closeAuthModal}
          ></div>
          
          <div className="relative w-full max-w-md flat-card border-2 border-border-accent p-6 md:p-8 animate-rigid-pop-in">
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 text-text-secondary hover:text-accent-error transition-colors w-8 h-8 flex items-center justify-center border border-border-primary hover:border-accent-error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-6 h-6 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-primary font-mono font-bold text-xs">B</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">
                SIGN IN
              </h2>
              <p className="text-text-secondary text-sm">
                Sign in with your Google account to continue
              </p>
            </div>

            {error && (
              <div className="flat-card p-4 mb-6 border-accent-error bg-bg-tertiary animate-slide-in-down">
                <p className="text-accent-error text-sm font-mono text-center">{error}</p>
              </div>
            )}

            <div className="flex flex-col items-center space-y-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || useMock}
                className="flat-button flat-button-primary py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 animate-rigid-pop-in"
                style={{ animationDelay: '0.1s' }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>CONTINUE WITH GOOGLE</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleMockAuth}
                disabled={loading}
                className="flat-button py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 animate-rigid-pop-in border-2 border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-bg-primary"
                style={{ animationDelay: '0.15s' }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-sm">[MOCK]</span>
                    <span>LOG IN MOCK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
