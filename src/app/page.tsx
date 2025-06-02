"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthDebug from "@/components/AuthDebug";

export default function Home() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { signInWithGoogle, loading, error, setError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.snap-container');
      if (!container) return;
      
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;
      
      // Check if at top (with small threshold)
      setIsAtTop(scrollTop <= 10);
      
      // Check if at bottom (with small threshold)
      setIsAtBottom(scrollTop + containerHeight >= scrollHeight - 10);
    };

    // Set initial state
    handleScroll();
    
    // Add scroll listener to the snap container
    const container = document.querySelector('.snap-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // Cleanup
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
        // Don't immediately redirect - let the OAuth callback handle the redirect
        // The user will be redirected to Google, then back to /auth/callback, then to dashboard
        closeAuthModal();
        console.log('Google OAuth initiated successfully');
      }
    } catch (err) {
      console.error('Google auth error:', err);
    }
  };

  const features = [
    { 
      id: "books",
      title: "Book Management", 
      description: "Add, search, update, and delete books from your library collection. Complete book inventory control with advanced search capabilities and detailed book information management.",
      icon: "📚",
      highlight: true,
      features: ["Add new books", "Advanced search & filter", "Update book details", "Remove books", "ISBN lookup", "Category management"]
    },
    { 
      id: "members",
      title: "Member Management", 
      description: "Manage library members with comprehensive member profiles and contact information. Track member activity and manage memberships efficiently.",
      icon: "👥",
      highlight: true,
      features: ["Add members", "Update profiles", "Search members", "Member database", "Activity tracking", "Membership management"]
    },
    { 
      id: "issues",
      title: "Issue/Return System", 
      description: "Track book lending with issue and return management. Monitor current book status and due dates with automated notifications and fine management.",
      icon: "📋",
      highlight: true,
      features: ["Issue books", "Process returns", "Track due dates", "Book status", "Fine management", "Automated notifications"]
    },
  ];

  return (
    <div className="snap-container bg-black relative">
      <AuthDebug />
      
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className={`enhanced-blur rounded-2xl px-6 py-4 sleek-shadow ${isAtTop ? 'expanded' : ''}`}>
            <div className={`flex items-center justify-between ${isAtTop ? 'expanded' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center logo-container header-logo" onClick={() => scrollToSection('hero')}>
                  <span className="text-black font-sans font-bold text-sm cursor-pointer">B</span>
                </div>
                <h1 className="font-sans font-bold text-xl text-white cursor-pointer" onClick={() => scrollToSection('hero')}>Bibliotheque</h1>
              </div>
              
              {/* Mobile: Show only Admin Login */}
              <div className="md:hidden">
                <button onClick={openAuthModal} className={`bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button text-sm ${isAtTop ? 'expanded' : ''}`}>
                  <span className="admin-text">Admin </span>Login
                </button>
              </div>
              
              {/* Desktop: Show nav links and Admin Login */}
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => scrollToSection('books')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Books</button>
                <button onClick={() => scrollToSection('members')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Members</button>
                <button onClick={() => scrollToSection('issues')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Issues</button>
                <button onClick={openAuthModal} className={`bg-gold text-black px-6 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button ${isAtTop ? 'expanded' : ''}`}>
                  <span className="admin-text">Admin </span>Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="snap-section flex items-center justify-center relative px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Library Management
            <br />
            Made <span className="text-gold">Simple</span>.
          </h2>
          <p className="font-sans text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
            Complete library administration system for managing books, members, and book issues. 
            Streamline your library operations with our comprehensive management platform.
          </p>
          <button onClick={openAuthModal} className="bg-gold text-black px-8 py-3 rounded-lg font-sans text-lg hover:bg-yellow-200 transition-all">
            Get Started
          </button>
        </div>
      </section>

      {/* Feature Sections */}
      {features.map((feature, index) => (
        <section key={feature.id} id={feature.id} className="snap-section feature-section">
          <div className={`feature-card-large rounded-2xl p-4 md:p-6 ${feature.highlight ? 'feature-highlight' : 'feature-normal'}`}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className={`font-sans text-2xl md:text-3xl font-bold mb-3 ${feature.highlight ? 'text-gold' : 'text-white'}`}>
                {feature.title}
              </h3>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-4 max-w-2xl mx-auto feature-description">
                {feature.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feature.features.map((item, idx) => (
                <div key={idx} className="flex items-center p-2 rounded-lg bg-black/20">
                  <span className="text-gold mr-3 text-base">•</span>
                  <span className="text-text-secondary text-sm">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-4">
              <button className={`px-6 py-2 rounded-lg font-sans transition-colors ${
                feature.highlight 
                  ? 'bg-gold text-black hover:bg-yellow-200' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}>
                Explore {feature.title}
              </button>
            </div>
          </div>
        </section>
      ))}

      {/* Auth Modal - Google Only */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={closeAuthModal}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-sans font-bold text-lg">B</span>
              </div>
              <h2 className="font-sans text-2xl font-bold text-white mb-2">
                Welcome to Bibliotheque
              </h2>
              <p className="text-text-secondary text-sm">
                Sign in with your Google account to access the library management system
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Google Auth Button */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-4 border border-border rounded-lg bg-white text-black font-sans font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={closeAuthModal}
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
          <div className={`enhanced-blur rounded-2xl px-6 py-4 sleek-shadow ${isAtBottom ? 'expanded' : ''}`}>
            <div className={`flex items-center justify-between ${isAtBottom ? 'expanded' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gold rounded-lg flex items-center justify-center logo-container footer-logo">
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
