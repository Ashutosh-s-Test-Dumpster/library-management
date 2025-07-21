"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Portal from '@/components/Portal';
import type { IssueTab } from '@/types';

interface Issue {
  id: number;
  ib_code: number;
  im_code: number;
  i_date_of_iss: string;
  i_date_of_ret: string | null;
  library_id: string;
  created_at: string;
  updated_at: string;
}

interface Book {
  id: number;
  b_code: number;
  b_name: string;
  b_author: string;
  b_price: number;
}

interface Member {
  id: number;
  m_code: number;
  m_name: string;
  m_phone: string;
}

interface IssueWithDetails extends Issue {
  book?: Book;
  member?: Member;
}

interface IssueManagementProps {
  libraryId: string;
}

export default function IssueManagement({ libraryId }: IssueManagementProps) {
  const [issues, setIssues] = useState<IssueWithDetails[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showBookSearchModal, setShowBookSearchModal] = useState(false);
  const [showMemberSearchModal, setShowMemberSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'returned' | 'all'>('active');
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [issueForm, setIssueForm] = useState({
    book_code: '',
    member_code: '',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue_management')
        .select('*')
        .eq('library_id', libraryId)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;

      const { data: booksData, error: booksError } = await supabase
        .from('book_management')
        .select('*')
        .eq('library_id', libraryId);

      if (booksError) throw booksError;

      const { data: membersData, error: membersError } = await supabase
        .from('member_management')
        .select('*')
        .eq('library_id', libraryId);

      if (membersError) throw membersError;

      setBooks(booksData || []);
      setMembers(membersData || []);

      const issuesWithDetails = (issuesData || []).map((issue: Issue) => ({
        ...issue,
        book: booksData?.find((book: Book) => book.b_code === issue.ib_code),
        member: membersData?.find((member: Member) => member.m_code === issue.im_code)
      }));

      setIssues(issuesWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [libraryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showIssueModal ||
        showBookSearchModal ||
        showMemberSearchModal
      ) {
        return;
      }
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowIssueModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIssueModal, showBookSearchModal, showMemberSearchModal]);

  const resetForm = () => {
    setIssueForm({
      book_code: '',
      member_code: '',
      issue_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const book = books.find(b => b.b_code === parseInt(issueForm.book_code));
      if (!book) {
        alert('Book with this code does not exist!');
        return;
      }

      const member = members.find(m => m.m_code === parseInt(issueForm.member_code));
      if (!member) {
        alert('Member with this code does not exist!');
        return;
      }

      const existingIssue = issues.find(
        issue => issue.ib_code === parseInt(issueForm.book_code) && !issue.i_date_of_ret
      );
      if (existingIssue) {
        alert('This book is already issued to a member!');
        return;
      }

      const { data, error } = await supabase
        .from('issue_management')
        .insert([{
          ib_code: parseInt(issueForm.book_code),
          im_code: parseInt(issueForm.member_code),
          i_date_of_iss: issueForm.issue_date,
          library_id: libraryId
        }])
        .select()
        .single();

      if (error) throw error;

      const newIssueWithDetails = {
        ...data,
        book,
        member
      };

      setIssues(prev => [newIssueWithDetails, ...prev]);
      setShowIssueModal(false);
      resetForm();
      alert('Book issued successfully!');
    } catch (error) {
      console.error('Error issuing book:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to issue book';
      alert(`Failed to issue book: ${errorMessage}`);
    }
  };

  const handleReturnBook = async (issue: IssueWithDetails) => {
    if (!confirm(`Process return of "${issue.book?.b_name}" borrowed by ${issue.member?.m_name}?`)) {
      return;
    }

    try {
      const returnDate = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('issue_management')
        .update({ i_date_of_ret: returnDate })
        .eq('id', issue.id);

      if (error) throw error;

      setIssues(prev => prev.map(i => 
        i.id === issue.id 
          ? { ...i, i_date_of_ret: returnDate }
          : i
      ));

      alert('Return processed successfully!');
    } catch (error) {
      console.error('Error returning book:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process return';
      alert(`Failed to process return: ${errorMessage}`);
    }
  };

  const getFilteredIssues = () => {
    let filtered = issues;
    
    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(issue => !issue.i_date_of_ret);
        break;
      case 'returned':
        filtered = filtered.filter(issue => issue.i_date_of_ret);
        break;
      default:
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(issue => {
        switch (filterBy) {
          case 'book':
            return issue.ib_code.toString().includes(searchTerm);
          case 'member':
            return issue.im_code.toString().includes(searchTerm);
          case 'status':
            const status = issue.i_date_of_ret ? 'returned' : 'active';
            return status.toLowerCase().includes(searchTerm.toLowerCase());
          default:
            return (
              issue.ib_code.toString().includes(searchTerm) ||
              issue.im_code.toString().includes(searchTerm) ||
              issue.book?.b_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              issue.book?.b_author.toLowerCase().includes(searchTerm.toLowerCase()) ||
              issue.member?.m_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              issue.member?.m_phone.includes(searchTerm)
            );
        }
      });
    }
    
    return filtered;
  };

  const getAvailableBooks = () => {
    const issuedBookCodes = issues
      .filter(issue => !issue.i_date_of_ret)
      .map(issue => issue.ib_code);
    
    return books.filter(book => !issuedBookCodes.includes(book.b_code));
  };

  const getFilteredAvailableBooks = () => {
    const available = getAvailableBooks();
    if (!bookSearchTerm) return available;
    
    return available.filter(book => 
      book.b_name.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
      book.b_author.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
      book.b_code.toString().includes(bookSearchTerm)
    );
  };

  const getFilteredMembers = () => {
    if (!memberSearchTerm) return members;
    
    return members.filter(member => 
      member.m_name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      member.m_code.toString().includes(memberSearchTerm)
    );
  };

  const handleBookSelect = (book: Book) => {
    setIssueForm(prev => ({ ...prev, book_code: book.b_code.toString() }));
    setShowBookSearchModal(false);
    setBookSearchTerm('');
  };

  const handleMemberSelect = (member: Member) => {
    setIssueForm(prev => ({ ...prev, member_code: member.m_code.toString() }));
    setShowMemberSearchModal(false);
    setMemberSearchTerm('');
  };

  const getDaysOverdue = (issueDate: string) => {
    const today = new Date();
    const issued = new Date(issueDate);
    const diffTime = today.getTime() - issued.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays - 14;
  };

  const filteredIssues = getFilteredIssues();
  const availableBooks = getAvailableBooks();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-text-secondary font-sans text-sm">Loading issues...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="border-b-2 border-border-primary pb-3 md:pb-4 mb-4 md:mb-6">
        {/* Row 1: Title - Mobile only */}
        <div className="md:hidden mb-3">
          <h3 className="text-lg font-bold text-text-primary uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>ISSUES</h3>
        </div>
        
        {/* Desktop: Single row layout */}
        <div className="hidden md:flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-text-primary uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>ISSUES</h3>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-0">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="flat-select border-r-0 text-xs"
              >
                <option value="all">ALL</option>
                <option value="book">BOOK CODE</option>
                <option value="member">MEMBER CODE</option>
                <option value="status">STATUS</option>
              </select>
              
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flat-input flex-1 min-w-[200px] border-l-0 text-xs"
              />
            </div>
            
            <button
              onClick={() => setShowIssueModal(true)}
              className="flat-button flat-button-primary text-xs px-4 py-2 whitespace-nowrap"
            >
              + ISSUE
            </button>
          </div>
        </div>

        {/* Mobile: 3 rows layout */}
        <div className="md:hidden space-y-3">
          {/* Row 2: Search and Filter */}
          <div className="flex space-x-0">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flat-select border-r-0 text-xs flex-shrink-0 min-w-[70px]"
            >
              <option value="all">ALL</option>
              <option value="book">BOOK</option>
              <option value="member">MEMBER</option>
              <option value="status">STATUS</option>
            </select>
            
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flat-input flex-1 border-l-0 text-xs min-w-0"
            />
          </div>
          
          {/* Row 3: Add Button */}
          <button
            onClick={() => setShowIssueModal(true)}
            className="flat-button flat-button-primary text-xs px-4 py-2 w-full"
          >
            + ISSUE BOOK
          </button>
        </div>
      </div>

      {/* Tabs - Horizontal */}
      <div className="flex space-x-2 mb-4 md:mb-6 overflow-x-auto">
        {[
          { key: 'active', label: 'ACTIVE', count: issues.filter(i => !i.i_date_of_ret).length },
          { key: 'returned', label: 'RETURNED', count: issues.filter(i => i.i_date_of_ret).length },
          { key: 'all', label: 'ALL', count: issues.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as IssueTab)}
            className={`px-3 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-wider transition-all border-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-accent-primary text-accent-primary bg-bg-tertiary'
                : 'border-border-primary text-text-secondary hover:text-text-primary hover:border-accent-primary/50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="flat-card p-3 md:p-6 stagger-item">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">ACTIVE</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-warning"></div>
          </div>
          <div className="text-xl md:text-3xl font-bold text-accent-warning font-mono mb-0.5 md:mb-1">{issues.filter(i => !i.i_date_of_ret).length}</div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">ISSUES</div>
        </div>
        
        <div className="flat-card p-3 md:p-6 stagger-item">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">RETURNED</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-success"></div>
          </div>
          <div className="text-xl md:text-3xl font-bold text-accent-success font-mono mb-0.5 md:mb-1">{issues.filter(i => i.i_date_of_ret).length}</div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">COMPLETED</div>
        </div>
        
        <div className="flat-card p-3 md:p-6 stagger-item">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">OVERDUE</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-error"></div>
          </div>
          <div className="text-xl md:text-3xl font-bold text-accent-error font-mono mb-0.5 md:mb-1">
            {issues.filter(i => !i.i_date_of_ret && getDaysOverdue(i.i_date_of_iss) > 0).length}
          </div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">REQUIRED</div>
        </div>
        
        <div className="flat-card p-3 md:p-6 stagger-item">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">TOTAL</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-primary"></div>
          </div>
          <div className="text-xl md:text-3xl font-bold text-accent-primary font-mono mb-0.5 md:mb-1">{issues.length}</div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">ALL</div>
        </div>
      </div>

      {/* Issues List - Scrollable */}
      {filteredIssues.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-border-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-text-tertiary font-mono text-2xl">IS</span>
            </div>
            <p className="text-text-secondary font-sans text-xs md:text-sm">
              {activeTab === 'active' 
                ? "NO ACTIVE BOOK ISSUES. ISSUE YOUR FIRST BOOK TO GET STARTED."
                : activeTab === 'returned'
                ? "NO RETURNED BOOKS YET."
                : "NO BOOK ISSUES YET. ISSUE YOUR FIRST BOOK TO GET STARTED."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
          {filteredIssues.map((issue, index) => {
            const isOverdue = !issue.i_date_of_ret && getDaysOverdue(issue.i_date_of_iss) > 0;
            const daysOverdue = getDaysOverdue(issue.i_date_of_iss);
            
            return (
              <div 
                key={issue.id} 
                className={`flat-card p-4 md:p-6 stagger-item ${
                  isOverdue ? 'border-accent-error' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start space-y-3 md:space-y-0 md:space-x-4">
                  <div className="flex-1 space-y-3 md:space-y-4 w-full">
                    {/* Book Info */}
                    <div className="flex items-start space-x-2 md:space-x-4">
                      <div className={`flat-badge text-[10px] md:text-xs ${isOverdue ? 'flat-badge-error' : 'flat-badge-primary'}`}>
                        BK #{issue.ib_code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-text-primary font-semibold text-sm md:text-lg truncate">
                          {issue.book?.b_name || 'UNKNOWN BOOK'}
                        </h4>
                        <p className="text-text-secondary text-[10px] md:text-sm font-mono truncate">
                          by {issue.book?.b_author || 'UNKNOWN AUTHOR'}
                        </p>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <div className="flat-badge flat-badge-success text-[10px] md:text-xs">
                        MB #{issue.im_code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-medium text-sm md:text-base truncate">
                          {issue.member?.m_name || 'UNKNOWN MEMBER'}
                        </p>
                        <p className="text-text-secondary text-[10px] md:text-sm font-mono truncate">
                          {issue.member?.m_phone || 'NO PHONE'}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                      <div className="flex items-center text-text-secondary">
                        <svg className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-6m-6 6V13a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
                        </svg>
                        <span className="font-mono">ISSUED: {new Date(issue.i_date_of_iss).toLocaleDateString()}</span>
                      </div>
                      
                      {issue.i_date_of_ret ? (
                        <div className="flex items-center text-accent-success">
                          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono">RETURNED: {new Date(issue.i_date_of_ret).toLocaleDateString()}</span>
                        </div>
                      ) : isOverdue ? (
                        <div className="flex items-center text-accent-error">
                          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono">OVERDUE BY {daysOverdue} DAYS</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-accent-warning">
                          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono">DUE: {new Date(new Date(issue.i_date_of_iss).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                   {/* Actions */}
                   {!issue.i_date_of_ret && (
                     <div className="flex-shrink-0 w-full md:w-auto">
                       <button
                         onClick={() => handleReturnBook(issue)}
                         className="flat-button border-accent-success text-accent-success hover:bg-accent-success hover:text-bg-primary text-xs md:text-sm px-3 md:px-4 py-2 w-full md:w-auto"
                       >
                         PROCESS RETURN
                       </button>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Issue Book Modal - Centered */}
      {showIssueModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
              onClick={() => {
                setShowIssueModal(false);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md flat-card border-2 border-border-accent p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in">
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-text-secondary hover:text-accent-error transition-colors w-8 h-8 flex items-center justify-center border border-border-primary hover:border-accent-error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-primary font-mono font-bold text-2xl">IS</span>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">ISSUE BOOK</h2>
              </div>

              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">BOOK</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={issueForm.book_code ? `#${issueForm.book_code} - ${books.find(b => b.b_code === parseInt(issueForm.book_code))?.b_name || ''}` : ''}
                      className="flex-1 flat-input cursor-pointer"
                      readOnly
                      onClick={() => setShowBookSearchModal(true)}
                      placeholder="CLICK TO SEARCH FOR A BOOK"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowBookSearchModal(true)}
                      className="flat-button flat-button-primary px-4"
                    >
                      SEARCH
                    </button>
                  </div>
                  {availableBooks.length === 0 && (
                    <p className="text-accent-error text-sm mt-1 font-mono">NO BOOKS AVAILABLE FOR ISSUE</p>
                  )}
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">MEMBER</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={issueForm.member_code ? `#${issueForm.member_code} - ${members.find(m => m.m_code === parseInt(issueForm.member_code))?.m_name || ''}` : ''}
                      className="flex-1 flat-input cursor-pointer"
                      readOnly
                      onClick={() => setShowMemberSearchModal(true)}
                      placeholder="CLICK TO SEARCH FOR A MEMBER"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberSearchModal(true)}
                      className="flat-button flat-button-primary px-4"
                    >
                      SEARCH
                    </button>
                  </div>
                  {members.length === 0 && (
                    <p className="text-accent-error text-sm mt-1 font-mono">NO MEMBERS AVAILABLE</p>
                  )}
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">ISSUE DATE</label>
                  <input
                    type="date"
                    value={issueForm.issue_date}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="flat-input w-full"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIssueModal(false);
                      resetForm();
                    }}
                    className="flex-1 flat-button py-3"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={availableBooks.length === 0 || members.length === 0}
                    className="flex-1 flat-button flat-button-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ISSUE BOOK
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Book Search Modal - Centered */}
      {showBookSearchModal && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
              onClick={() => setShowBookSearchModal(false)}
            ></div>
            
            <div className="relative w-full max-w-lg flat-card border-2 border-border-accent p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4 uppercase tracking-wider">SEARCH BOOKS</h2>
                <input
                  type="text"
                  value={bookSearchTerm}
                  onChange={(e) => setBookSearchTerm(e.target.value)}
                  placeholder="SEARCH BY BOOK NAME, AUTHOR, OR CODE..."
                  className="flat-input w-full"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {getFilteredAvailableBooks().length === 0 ? (
                  <div className="text-center py-8 text-text-secondary font-mono">
                    NO BOOKS FOUND MATCHING YOUR SEARCH
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredAvailableBooks().map((book) => (
                      <button
                        key={book.id}
                        onClick={() => handleBookSelect(book)}
                        className="w-full text-left flat-card p-4 hover:border-accent-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-text-primary font-medium mb-1">
                              {book.b_name}
                            </div>
                            <div className="text-text-secondary text-sm font-mono">
                              by {book.b_author}
                            </div>
                          </div>
                          <div className="flat-badge flat-badge-primary">
                            #{book.b_code}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Member Search Modal - Centered */}
      {showMemberSearchModal && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
              onClick={() => setShowMemberSearchModal(false)}
            ></div>
            
            <div className="relative w-full max-w-lg flat-card border-2 border-border-accent p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4 uppercase tracking-wider">SEARCH MEMBERS</h2>
                <input
                  type="text"
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  placeholder="SEARCH BY MEMBER NAME, CODE, OR PHONE..."
                  className="flat-input w-full"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {getFilteredMembers().length === 0 ? (
                  <div className="text-center py-8 text-text-secondary font-mono">
                    NO MEMBERS FOUND MATCHING YOUR SEARCH
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredMembers().map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleMemberSelect(member)}
                        className="w-full text-left flat-card p-4 hover:border-accent-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-text-primary font-medium mb-1">
                              {member.m_name}
                            </div>
                            <div className="text-text-secondary text-sm font-mono">
                              {member.m_phone}
                            </div>
                          </div>
                          <div className="flat-badge flat-badge-primary">
                            #{member.m_code}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
