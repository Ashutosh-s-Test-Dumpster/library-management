"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

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
      highlight: false,
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
                <button className={`bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button text-sm ${isAtTop ? 'expanded' : ''}`}>
                  <span className="admin-text">Admin </span>Login
                </button>
              </div>
              
              {/* Desktop: Show nav links and Admin Login */}
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => scrollToSection('books')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Books</button>
                <button onClick={() => scrollToSection('members')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Members</button>
                <button onClick={() => scrollToSection('issues')} className={`text-text-secondary hover:text-gold transition-colors font-sans nav-link cursor-pointer ${isAtTop ? 'expanded' : ''}`}>Issues</button>
                <button className={`bg-gold text-black px-6 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors nav-button ${isAtTop ? 'expanded' : ''}`}>
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
          <button className="bg-gold text-black px-8 py-3 rounded-lg font-sans text-lg hover:bg-yellow-200 transition-all">
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
