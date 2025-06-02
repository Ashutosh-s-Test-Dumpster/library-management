"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Portal from '@/components/Portal';

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
  const [activeTab, setActiveTab] = useState<'active' | 'returned' | 'all'>('active');

  const [issueForm, setIssueForm] = useState({
    book_code: '',
    member_code: '',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [libraryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load issues with related book and member data
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue_management')
        .select('*')
        .eq('library_id', libraryId)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;

      // Load books
      const { data: booksData, error: booksError } = await supabase
        .from('book_management')
        .select('*')
        .eq('library_id', libraryId);

      if (booksError) throw booksError;

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('member_management')
        .select('*')
        .eq('library_id', libraryId);

      if (membersError) throw membersError;

      setBooks(booksData || []);
      setMembers(membersData || []);

      // Combine issues with book and member details
      const issuesWithDetails = (issuesData || []).map(issue => ({
        ...issue,
        book: booksData?.find(book => book.b_code === issue.ib_code),
        member: membersData?.find(member => member.m_code === issue.im_code)
      }));

      setIssues(issuesWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      // Check if book exists
      const book = books.find(b => b.b_code === parseInt(issueForm.book_code));
      if (!book) {
        alert('Book with this code does not exist!');
        return;
      }

      // Check if member exists
      const member = members.find(m => m.m_code === parseInt(issueForm.member_code));
      if (!member) {
        alert('Member with this code does not exist!');
        return;
      }

      // Check if book is already issued
      const existingIssue = issues.find(
        issue => issue.ib_code === parseInt(issueForm.book_code) && !issue.i_date_of_ret
      );
      if (existingIssue) {
        alert('This book is already issued to a member!');
        return;
      }

      const { data, error } = await supabase
        .from('issue_management')
        .insert([
          {
            ib_code: parseInt(issueForm.book_code),
            im_code: parseInt(issueForm.member_code),
            i_date_of_iss: issueForm.issue_date,
            library_id: libraryId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new issue with details to the list
      const newIssueWithDetails = {
        ...data,
        book,
        member
      };

      setIssues(prev => [newIssueWithDetails, ...prev]);
      setShowIssueModal(false);
      resetForm();
      alert('Book issued successfully!');
    } catch (error: any) {
      console.error('Error issuing book:', error);
      alert(`Failed to issue book: ${error.message}`);
    }
  };

  const handleReturnBook = async (issue: IssueWithDetails) => {
    if (!confirm(`Are you sure you want to return "${issue.book?.b_name}" from ${issue.member?.m_name}?`)) {
      return;
    }

    try {
      const returnDate = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('issue_management')
        .update({ i_date_of_ret: returnDate })
        .eq('id', issue.id)
        .select()
        .single();

      if (error) throw error;

      // Update the issue in the list
      setIssues(prev => prev.map(i => 
        i.id === issue.id 
          ? { ...i, i_date_of_ret: returnDate }
          : i
      ));

      alert('Book returned successfully!');
    } catch (error: any) {
      console.error('Error returning book:', error);
      alert(`Failed to return book: ${error.message}`);
    }
  };

  const getFilteredIssues = () => {
    switch (activeTab) {
      case 'active':
        return issues.filter(issue => !issue.i_date_of_ret);
      case 'returned':
        return issues.filter(issue => issue.i_date_of_ret);
      default:
        return issues;
    }
  };

  const getAvailableBooks = () => {
    const issuedBookCodes = issues
      .filter(issue => !issue.i_date_of_ret)
      .map(issue => issue.ib_code);
    
    return books.filter(book => !issuedBookCodes.includes(book.b_code));
  };

  const getDaysOverdue = (issueDate: string) => {
    const today = new Date();
    const issued = new Date(issueDate);
    const diffTime = today.getTime() - issued.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays - 14; // Assuming 14 days is the lending period
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading issues...</p>
      </div>
    );
  }

  const filteredIssues = getFilteredIssues();
  const availableBooks = getAvailableBooks();

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Issue Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h3 className="text-2xl font-bold text-white">Issue Management</h3>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* Search Controls */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-secondary text-sm">Search issues by:</label>
            <div className="flex space-x-0 group focus-within:ring-1 focus-within:ring-border/60 rounded-lg">
              <div className="relative">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="h-full px-4 py-2 bg-black border border-r-0 border-green-800 rounded-l-lg text-white text-sm focus:outline-none group-hover:border-green-800 transition-colors"
                >
                  <option value="all">All Fields</option>
                  <option value="book">Book Code</option>
                  <option value="member">Member Code</option>
                  <option value="status">Status</option>
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-text-secondary">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 bg-black border border-l-0 border-green-500 rounded-r-lg text-white placeholder-text-secondary focus:outline-none group-hover:border-green-500/60 transition-colors min-w-[200px]"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowIssueModal(true)}
            className="bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors whitespace-nowrap md:self-end"
          >
            Issue Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="enhanced-blur rounded-2xl p-2">
          <div className="flex space-x-2">
            {[
              { key: 'active', label: 'Active Issues', count: issues.filter(i => !i.i_date_of_ret).length },
              { key: 'returned', label: 'Returned', count: issues.filter(i => i.i_date_of_ret).length },
              { key: 'all', label: 'All Issues', count: issues.length }
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
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="enhanced-blur rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">📚</div>
          <h4 className="text-lg font-bold text-gold mb-1">{issues.filter(i => !i.i_date_of_ret).length}</h4>
          <p className="text-text-secondary text-sm">Active Issues</p>
        </div>
        
        <div className="enhanced-blur rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <h4 className="text-lg font-bold text-green-400 mb-1">{issues.filter(i => i.i_date_of_ret).length}</h4>
          <p className="text-text-secondary text-sm">Returned Books</p>
        </div>
        
        <div className="enhanced-blur rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <h4 className="text-lg font-bold text-red-400 mb-1">
            {issues.filter(i => !i.i_date_of_ret && getDaysOverdue(i.i_date_of_iss) > 0).length}
          </h4>
          <p className="text-text-secondary text-sm">Overdue Books</p>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-text-secondary">
            {activeTab === 'active' 
              ? "No active book issues. Issue your first book to get started."
              : activeTab === 'returned'
              ? "No returned books yet."
              : "No book issues yet. Issue your first book to get started."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isOverdue = !issue.i_date_of_ret && getDaysOverdue(issue.i_date_of_iss) > 0;
            const daysOverdue = getDaysOverdue(issue.i_date_of_iss);
            
            return (
              <div key={issue.id} className={`enhanced-blur rounded-xl p-6 border ${
                isOverdue ? 'border-red-500/50' : 'border-border'
              }`}>
                <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0">
                  <div className="flex-1 space-y-3">
                    {/* Book Info */}
                    <div className="flex items-start space-x-4">
                      <div className="bg-gold text-black px-3 py-1 rounded text-sm font-bold">
                        Book #{issue.ib_code}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">
                          {issue.book?.b_name || 'Unknown Book'}
                        </h4>
                        <p className="text-text-secondary text-sm">
                          by {issue.book?.b_author || 'Unknown Author'}
                        </p>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                        Member #{issue.im_code}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {issue.member?.m_name || 'Unknown Member'}
                        </p>
                        <p className="text-text-secondary text-sm">
                          {issue.member?.m_phone || 'No phone'}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-text-secondary">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-6m-6 6V13a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
                        </svg>
                        Issued: {new Date(issue.i_date_of_iss).toLocaleDateString()}
                      </div>
                      
                      {issue.i_date_of_ret ? (
                        <div className="flex items-center text-green-400">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Returned: {new Date(issue.i_date_of_ret).toLocaleDateString()}
                        </div>
                      ) : isOverdue ? (
                        <div className="flex items-center text-red-400">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Overdue by {daysOverdue} days
                        </div>
                      ) : (
                        <div className="flex items-center text-gold">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Due: {new Date(new Date(issue.i_date_of_iss).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!issue.i_date_of_ret && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleReturnBook(issue)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-sans hover:bg-green-700 transition-colors"
                      >
                        Return Book
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => {
                setShowIssueModal(false);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-black font-sans font-bold text-lg">📋</span>
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Issue Book</h2>
              </div>

              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Book Code</label>
                  <select
                    value={issueForm.book_code}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, book_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white focus:outline-none focus:border-gold"
                    required
                  >
                    <option value="">Select a book</option>
                    {availableBooks.map((book) => (
                      <option key={book.id} value={book.b_code}>
                        #{book.b_code} - {book.b_name} by {book.b_author}
                      </option>
                    ))}
                  </select>
                  {availableBooks.length === 0 && (
                    <p className="text-red-400 text-sm mt-1">No books available for issue</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Member Code</label>
                  <select
                    value={issueForm.member_code}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, member_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white focus:outline-none focus:border-gold"
                    required
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.m_code}>
                        #{member.m_code} - {member.m_name}
                      </option>
                    ))}
                  </select>
                  {members.length === 0 && (
                    <p className="text-red-400 text-sm mt-1">No members available</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={issueForm.issue_date}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white focus:outline-none focus:border-gold"
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
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableBooks.length === 0 || members.length === 0}
                    className="flex-1 bg-gold text-black py-3 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Issue Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
} 