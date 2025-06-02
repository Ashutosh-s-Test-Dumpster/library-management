"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Portal from '@/components/Portal';

interface Book {
  id: number;
  b_code: number;
  b_name: string;
  b_author: string;
  b_price: number;
  library_id: string;
  created_at: string;
  updated_at: string;
}

interface BookManagementProps {
  libraryId: string;
}

export default function BookManagement({ libraryId }: BookManagementProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'name' | 'author' | 'code'>('all');

  const [bookForm, setBookForm] = useState({
    isbn: '',
    b_code: '',
    b_name: '',
    b_author: '',
    b_price: ''
  });

  // Inline validation errors
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // entry mode for add book modal
  const [entryMode, setEntryMode] = useState<'isbn' | 'manual'>('isbn');

  useEffect(() => {
    loadBooks();
  }, [libraryId]);

  // Keyboard shortcut to open Add Book modal
  useEffect(() => {
    const isTextInput = (el: Element | null) => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAddModal) return; // already open

      // Ignore if typing in an input/textarea/select
      if (isTextInput(e.target as Element)) return;

      // "a" key without modifiers
      if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowAddModal(true);
        return;
      }

      // Ctrl/Cmd + N
      if ((e.key === 'n' || e.key === 'N') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('book_management')
        .select('*')
        .eq('library_id', libraryId)
        .order('b_code', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
      alert('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBookForm({
      isbn: '',
      b_code: '',
      b_name: '',
      b_author: '',
      b_price: ''
    });
    setErrors({});
    setEntryMode('isbn');
  };

  // Prefill next code when modal opens
  useEffect(() => {
    if (showAddModal) {
      const maxCode = books.reduce((max, b) => Math.max(max, b.b_code), 0);
      setBookForm((prev) => ({ ...prev, b_code: (maxCode + 1).toString() }));
    }
  }, [showAddModal]);

  // ISBN lookup on blur
  const lookupISBN = async (isbn: string) => {
    if (!isbn || !(isbn.length === 10 || isbn.length === 13)) return;
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
      const data = await res.json();
      const bookData = data[`ISBN:${isbn}`];
      if (bookData) {
        setBookForm((prev) => ({
          ...prev,
          b_name: bookData.title || '',
          b_author: bookData.authors?.[0]?.name || '',
        }));
        // Clear any existing ISBN error if lookup succeeded
        setErrors(prev => {
          const { isbn, ...rest } = prev;
          return rest;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error looking up ISBN:', err);
      return false;
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: { [k: string]: string } = {};

    if (!bookForm.b_code) newErrors.b_code = 'Book code is required';
    else if (books.some((b) => b.b_code === parseInt(bookForm.b_code))) newErrors.b_code = 'Code already in use';

    if (entryMode === 'isbn') {
      if (!bookForm.isbn || !(bookForm.isbn.length === 10 || bookForm.isbn.length === 13)) {
        newErrors.isbn = 'Valid 10 or 13 digit ISBN required';
      }
    }

    if (!bookForm.b_name.trim()) newErrors.b_name = 'Book name is required';
    if (!bookForm.b_author.trim()) newErrors.b_author = 'Author is required';

    if (bookForm.b_price && parseFloat(bookForm.b_price) < 0) newErrors.b_price = 'Price must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // If in ISBN mode and we have an ISBN but no book details, try to look it up first
      if (entryMode === 'isbn' && bookForm.isbn && (!bookForm.b_name || !bookForm.b_author)) {
        await lookupISBN(bookForm.isbn);
        // If lookup failed to find details, show error
        if (!bookForm.b_name || !bookForm.b_author) {
          setErrors({ isbn: 'Could not find book details for this ISBN' });
          return;
        }
      }

      // Validate client-side
      const isValid = await validateForm();
      if (!isValid) return;

      // Double-check duplicate on server
      const { data: existingBook } = await supabase
        .from('book_management')
        .select('id')
        .eq('library_id', libraryId)
        .eq('b_code', parseInt(bookForm.b_code))
        .maybeSingle();

      if (existingBook) {
        setErrors({ b_code: 'Code already in use' });
        return;
      }

      const { data, error } = await supabase
        .from('book_management')
        .insert([
          {
            b_code: parseInt(bookForm.b_code),
            b_name: bookForm.b_name,
            b_author: bookForm.b_author,
            b_price: parseFloat(bookForm.b_price),
            library_id: libraryId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setBooks(prev => [...prev, data].sort((a, b) => a.b_code - b.b_code));
      setShowAddModal(false);
      resetForm();
      // Show toast could be implemented; for now reset error state
      setErrors({});
    } catch (error: any) {
      console.error('Error adding book:', error);
      setErrors({ submit: error.message || 'Failed to add book' });
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBook) return;

    try {
      // Check if book code already exists (excluding current book)
      if (parseInt(bookForm.b_code) !== editingBook.b_code) {
        const { data: existingBook } = await supabase
          .from('book_management')
          .select('id')
          .eq('library_id', libraryId)
          .eq('b_code', parseInt(bookForm.b_code))
          .neq('id', editingBook.id)
          .single();

        if (existingBook) {
          alert('A book with this code already exists!');
          return;
        }
      }

      const { data, error } = await supabase
        .from('book_management')
        .update({
          b_code: parseInt(bookForm.b_code),
          b_name: bookForm.b_name,
          b_author: bookForm.b_author,
          b_price: parseFloat(bookForm.b_price)
        })
        .eq('id', editingBook.id)
        .select()
        .single();

      if (error) throw error;

      setBooks(prev => prev.map(book => 
        book.id === editingBook.id ? data : book
      ).sort((a, b) => a.b_code - b.b_code));
      
      setShowEditModal(false);
      setEditingBook(null);
      resetForm();
      alert('Book updated successfully!');
    } catch (error: any) {
      console.error('Error updating book:', error);
      alert(`Failed to update book: ${error.message}`);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Are you sure you want to delete "${book.b_name}"?`)) {
      return;
    }

    try {
      // Check if book is currently issued
      const { data: issues } = await supabase
        .from('issue_management')
        .select('id')
        .eq('library_id', libraryId)
        .eq('ib_code', book.b_code)
        .is('i_date_of_ret', null);

      if (issues && issues.length > 0) {
        alert('Cannot delete book. It is currently issued to a member.');
        return;
      }

      const { error } = await supabase
        .from('book_management')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      setBooks(prev => prev.filter(b => b.id !== book.id));
      alert('Book deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting book:', error);
      alert(`Failed to delete book: ${error.message}`);
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      isbn: '',
      b_code: book.b_code.toString(),
      b_name: book.b_name,
      b_author: book.b_author,
      b_price: book.b_price.toString()
    });
    setShowEditModal(true);
  };

  const filteredBooks = books.filter(book => {
    if (!searchTerm) return true;
    
    switch (filterBy) {
      case 'name':
        return book.b_name.toLowerCase().includes(searchTerm.toLowerCase());
      case 'author':
        return book.b_author.toLowerCase().includes(searchTerm.toLowerCase());
      case 'code':
        return book.b_code.toString().includes(searchTerm);
      default:
        return (
          book.b_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.b_author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.b_code.toString().includes(searchTerm)
        );
    }
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading books...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h3 className="text-2xl font-bold text-white">Book Management</h3>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* Search Controls */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-secondary text-sm">Search books by:</label>
            <div className="flex space-x-0 group focus-within:ring-1 focus-within:ring-border/60 rounded-lg">
              <div className="relative">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="h-full px-4 py-2 bg-black border border-r-0 border-green-800 rounded-l-lg text-white text-sm focus:outline-none group-hover:border-green-800 transition-colors"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Book Name</option>
                  <option value="author">Author</option>
                  <option value="code">Book Code</option>
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
            onClick={() => setShowAddModal(true)}
            className="bg-gold text-black px-4 py-2 rounded-lg font-sans hover:bg-yellow-200 transition-colors whitespace-nowrap md:self-end"
          >
            Add Book
          </button>
        </div>
      </div>

      {/* Books List */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-text-secondary">
            {books.length === 0 
              ? "No books added yet. Add your first book to get started."
              : "No books match your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div key={book.id} className="enhanced-blur rounded-xl p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gold text-black px-2 py-1 rounded text-sm font-bold">
                  #{book.b_code}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(book)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit Book"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete Book"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <h4 className="text-white font-semibold text-lg mb-2 line-clamp-2">{book.b_name}</h4>
              <p className="text-text-secondary text-sm mb-2">by {book.b_author}</p>
              <p className="text-gold font-bold text-lg">${book.b_price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-black font-sans font-bold text-lg">📚</span>
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Add New Book</h2>
              </div>

              <form onSubmit={handleAddBook} className="space-y-4">
                {/* Entry mode tabs */}
                <div className="flex mb-4 space-x-2 justify-center">
                  {['isbn', 'manual'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setEntryMode(mode as any);
                        // Reset form when switching to manual mode
                        if (mode === 'manual') {
                          setBookForm(prev => ({
                            ...prev,
                            isbn: '',
                            b_name: '',
                            b_author: ''
                          }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-sans text-sm transition-colors ${
                        entryMode === mode
                          ? 'bg-gold text-black'
                          : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      {mode === 'isbn' ? 'ISBN Lookup' : 'Manual Entry'}
                    </button>
                  ))}
                </div>

                {/* ISBN Field */}
                {entryMode === 'isbn' && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">ISBN</label>
                    <input
                      type="text"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                      onBlur={(e) => lookupISBN(e.target.value)}
                      className={`w-full px-4 py-3 bg-black border ${errors.isbn ? 'border-red-500' : 'border-border'} rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold`}
                      placeholder="e.g., 9780062801970"
                    />
                    {errors.isbn && <p className="text-red-500 text-xs mt-1">{errors.isbn}</p>}
                    {/* Show book details if found via ISBN */}
                    {bookForm.b_name && bookForm.b_author && (
                      <div className="mt-4 p-4 bg-gold/10 border border-gold/20 rounded-lg">
                        <p className="text-white font-medium mb-1">{bookForm.b_name}</p>
                        <p className="text-text-secondary text-sm">by {bookForm.b_author}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Book Code</label>
                  <input
                    type="number"
                    value={bookForm.b_code}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_code: e.target.value }))}
                    className={`w-full px-4 py-3 bg-black border ${errors.b_code ? 'border-red-500' : 'border-border'} rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold`}
                    placeholder="e.g., 101"
                    required
                  />
                  {errors.b_code && <p className="text-red-500 text-xs mt-1">{errors.b_code}</p>}
                </div>

                {/* Only show name and author fields in manual mode */}
                {entryMode === 'manual' && (
                  <>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Book Name</label>
                      <input
                        type="text"
                        value={bookForm.b_name}
                        onChange={(e) => setBookForm(prev => ({ ...prev, b_name: e.target.value }))}
                        className={`w-full px-4 py-3 bg-black border ${errors.b_name ? 'border-red-500' : 'border-border'} rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold`}
                        placeholder="e.g., The Great Gatsby"
                        required
                      />
                      {errors.b_name && <p className="text-red-500 text-xs mt-1">{errors.b_name}</p>}
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Author</label>
                      <input
                        type="text"
                        value={bookForm.b_author}
                        onChange={(e) => setBookForm(prev => ({ ...prev, b_author: e.target.value }))}
                        className={`w-full px-4 py-3 bg-black border ${errors.b_author ? 'border-red-500' : 'border-border'} rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold`}
                        placeholder="e.g., F. Scott Fitzgerald"
                        required
                      />
                      {errors.b_author && <p className="text-red-500 text-xs mt-1">{errors.b_author}</p>}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookForm.b_price}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_price: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    placeholder="e.g., 15.99"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gold text-black py-3 rounded-lg font-sans font-medium hover:bg-yellow-200 transition-colors"
                  >
                    Add Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Book Modal */}
      {showEditModal && editingBook && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => {
                setShowEditModal(false);
                setEditingBook(null);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-sans font-bold text-lg">✏️</span>
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Edit Book</h2>
              </div>

              <form onSubmit={handleEditBook} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Book Code</label>
                  <input
                    type="number"
                    value={bookForm.b_code}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Book Name</label>
                  <input
                    type="text"
                    value={bookForm.b_name}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Author</label>
                  <input
                    type="text"
                    value={bookForm.b_author}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_author: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookForm.b_price}
                    onChange={(e) => setBookForm(prev => ({ ...prev, b_price: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBook(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-sans font-medium hover:bg-blue-700 transition-colors"
                  >
                    Update Book
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