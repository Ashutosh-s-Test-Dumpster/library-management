"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { 
  loginSchema, 
  signupStep1Schema, 
  signupStep2Schema,
  LoginFormData, 
  SignupStep1Data,
  SignupStep2Data,
  SignupFormData 
} from "@/lib/validations";

export default function Home() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState(1); // 1 or 2
  const [signupStep1Data, setSignupStep1Data] = useState<SignupStep1Data | null>(null);
  const { signIn, signUp, signInWithGoogle, verifyStep1Data, loading, error, setError } = useAuth();

  // Form for login
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Form for signup step 1
  const signupStep1Form = useForm<SignupStep1Data>({
    resolver: zodResolver(signupStep1Schema),
  });

  // Form for signup step 2
  const signupStep2Form = useForm<SignupStep2Data>({
    resolver: zodResolver(signupStep2Schema),
  });

  // Get the current form based on auth mode
  const currentForm = authMode === 'login' ? loginForm : signupStep1Form;

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

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setError(null);
    setSignupStep(1);
    setSignupStep1Data(null);
    // Reset forms when opening modal
    loginForm.reset();
    signupStep1Form.reset();
    signupStep2Form.reset();
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setError(null);
    setSignupStep(1);
    setSignupStep1Data(null);
    loginForm.reset();
    signupStep1Form.reset();
    signupStep2Form.reset();
  };

  const switchAuthMode = () => {
    const newMode = authMode === 'login' ? 'signup' : 'login';
    setAuthMode(newMode);
    setError(null);
    setSignupStep(1);
    setSignupStep1Data(null);
    loginForm.reset();
    signupStep1Form.reset();
    signupStep2Form.reset();
  };

  const handleSignupStep1Submit = async (data: SignupStep1Data) => {
    const result = await verifyStep1Data(data);
    if (result.success) {
      setSignupStep1Data(data);
      setSignupStep(2);
      setError(null);
    }
    // Error is already set by verifyStep1Data if verification fails
  };

  const handleSignupStep2Submit = async (data: SignupStep2Data) => {
    if (!signupStep1Data) return;
    
    const fullSignupData: SignupFormData = {
      ...signupStep1Data,
      ...data,
    };

    try {
      const result = await signUp(fullSignupData);
      if (result.success) {
        closeAuthModal();
        alert('Account creation successful!');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const result = await signIn(data);
      if (result.success) {
        closeAuthModal();
        alert('Login successful!');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        closeAuthModal();
        // Redirect will happen automatically
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
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className={`enhanced-blur rounded-2xl px-6 py-4 sleek-shadow ${isAtTop ? 'expanded' : ''}`}>
            <div className={`flex items-center justify-between nav-content ${isAtTop ? 'expanded' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gold rounded-lg flex items-center justify-center logo-container header-logo ${isAtTop ? 'expanded' : ''}`} onClick={() => scrollToSection('hero')}>
                  <span className="text-black font-sans font-bold text-sm cursor-pointer">B</span>
                </div>
                <h1 className="font-sans font-bold text-xl text-white cursor-pointer" onClick={() => scrollToSection('hero')}>Bibliotheque</h1>
              </div>
              
              {/* Mobile: Show only Admin Login */}
              <div className="md:hidden">
                <button onClick={() => openAuthModal('login')} className={`bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button text-sm ${isAtTop ? 'expanded' : ''}`}>
                  <span className="admin-text">Admin </span>Login
                </button>
              </div>
              
              {/* Desktop: Show nav links and Admin Login */}
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => scrollToSection('books')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Books</button>
                <button onClick={() => scrollToSection('members')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Members</button>
                <button onClick={() => scrollToSection('issues')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Issues</button>
                <button onClick={() => openAuthModal('login')} className={`bg-gold text-black px-6 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button ${isAtTop ? 'expanded' : ''}`}>
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
          <button onClick={() => openAuthModal('signup')} className="bg-gold text-black px-8 py-3 rounded-lg font-sans text-lg hover:bg-yellow-200 transition-all">
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

      {/* Auth Modal */}
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
                {authMode === 'login' ? 'Welcome Back' : 
                 signupStep === 1 ? 'Get Started' : 'Complete Setup'}
              </h2>
              <p className="text-text-secondary text-sm">
                {authMode === 'login' 
                  ? 'Sign in to your library admin account' 
                  : signupStep === 1 
                    ? 'Create your account - Step 1 of 2'
                    : 'Set your password - Step 2 of 2'
                }
              </p>
            </div>

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-lg bg-white text-black font-sans font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-text-secondary">Or continue with email</span>
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-black py-3 px-4 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Signup Step 1 Form */}
            {authMode === 'signup' && signupStep === 1 && (
              <form onSubmit={signupStep1Form.handleSubmit(handleSignupStep1Submit)} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-lg bg-white text-black font-sans font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-text-secondary">Or continue with email</span>
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    {...signupStep1Form.register('fullName')}
                    type="text"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your full name"
                  />
                  {signupStep1Form.formState.errors.fullName && (
                    <p className="text-red-400 text-xs mt-1">{signupStep1Form.formState.errors.fullName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    {...signupStep1Form.register('email')}
                    type="email"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your email"
                  />
                  {signupStep1Form.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{signupStep1Form.formState.errors.email.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-black py-3 px-4 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            )}

            {/* Signup Step 2 Form */}
            {authMode === 'signup' && signupStep === 2 && (
              <form onSubmit={signupStep2Form.handleSubmit(handleSignupStep2Submit)} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    {...signupStep2Form.register('password')}
                    type="password"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your password"
                  />
                  {signupStep2Form.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{signupStep2Form.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    {...signupStep2Form.register('confirmPassword')}
                    type="password"
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
                    placeholder="Confirm your password"
                  />
                  {signupStep2Form.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{signupStep2Form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="w-1/3 bg-gray-600 text-white py-3 px-4 rounded-lg font-sans font-medium hover:bg-gray-500 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-gold text-black py-3 px-4 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-text-secondary text-sm">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={switchAuthMode}
                  disabled={loading}
                  className="text-gold hover:text-yellow-200 transition-colors font-medium disabled:opacity-50"
                >
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
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
