"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Portal from '@/components/Portal';

interface Member {
  id: number;
  m_code: number;
  m_name: string;
  m_phone: string;
  library_id: string;
  created_at: string;
  updated_at: string;
}

interface MemberManagementProps {
  libraryId: string;
}

export default function MemberManagement({ libraryId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'name' | 'code'>('all');

  const [memberForm, setMemberForm] = useState({
    m_code: '',
    m_name: '',
    m_phone: ''
  });

  const getNextMemberCode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('member_management')
        .select('m_code')
        .eq('library_id', libraryId)
        .order('m_code', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      // Start from 1001 if no members exist, otherwise increment the highest code
      const nextCode = data && data.length > 0 ? data[0].m_code + 1 : 1001;
      return nextCode;
    } catch (error) {
      console.error('Error getting next member code:', error);
      return 1001; // Fallback to 1001 if error occurs
    }
  }, [libraryId]);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('member_management')
        .select('*')
        .eq('library_id', libraryId)
        .order('m_code', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      alert('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [libraryId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const resetForm = () => {
    setMemberForm({
      m_code: '',
      m_name: '',
      m_phone: ''
    });
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Format the number as (XXX) XXX-XXXX
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const validateAndFormatPhone = (phone: string): bigint | null => {
    // Remove all non-digits
    const rawNumber = phone.replace(/\D/g, '');
    
    // Validate length
    if (rawNumber.length !== 10) {
      return null;
    }

    // Convert to bigint
    return BigInt(rawNumber);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneNumber = validateAndFormatPhone(memberForm.m_phone);
    if (phoneNumber === null) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      // Check if member code already exists
      const { data: existingMember } = await supabase
        .from('member_management')
        .select('id')
        .eq('library_id', libraryId)
        .eq('m_code', parseInt(memberForm.m_code))
        .single();

      if (existingMember) {
        alert('A member with this code already exists! Please use a different code.');
        return;
      }
      
      const { data, error } = await supabase
        .from('member_management')
        .insert([
          {
            m_code: parseInt(memberForm.m_code),
            m_name: memberForm.m_name,
            m_phone: phoneNumber.toString(),
            library_id: libraryId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => [...prev, data].sort((a, b) => a.m_code - b.m_code));
      setShowAddModal(false);
      resetForm();
      alert('Member added successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
      console.error('Error adding member:', error);
      alert(`Failed to add member: ${errorMessage}`);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;

    // Validate phone number
    const phoneNumber = validateAndFormatPhone(memberForm.m_phone);
    if (phoneNumber === null) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      // Check if member code already exists (excluding current member)
      if (parseInt(memberForm.m_code) !== editingMember.m_code) {
        const { data: existingMember } = await supabase
          .from('member_management')
          .select('id')
          .eq('library_id', libraryId)
          .eq('m_code', parseInt(memberForm.m_code))
          .neq('id', editingMember.id)
          .single();

        if (existingMember) {
          alert('A member with this code already exists!');
          return;
        }
      }

      const { data, error } = await supabase
        .from('member_management')
        .update({
          m_code: parseInt(memberForm.m_code),
          m_name: memberForm.m_name,
          m_phone: phoneNumber.toString() // Store as string to preserve full number
        })
        .eq('id', editingMember.id)
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => prev.map(member => 
        member.id === editingMember.id ? data : member
      ).sort((a, b) => a.m_code - b.m_code));
      
      setShowEditModal(false);
      setEditingMember(null);
      resetForm();
      alert('Member updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member';
      console.error('Error updating member:', error);
      alert(`Failed to update member: ${errorMessage}`);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Are you sure you want to delete member "${member.m_name}"?`)) {
      return;
    }

    try {
      // Check if member has active book issues
      const { data: issues } = await supabase
        .from('issue_management')
        .select('id')
        .eq('library_id', libraryId)
        .eq('im_code', member.m_code)
        .is('i_date_of_ret', null);

      if (issues && issues.length > 0) {
        alert('Cannot delete member. They have books currently issued.');
        return;
      }

      const { error } = await supabase
        .from('member_management')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== member.id));
      alert('Member deleted successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete member';
      console.error('Error deleting member:', error);
      alert(`Failed to delete member: ${errorMessage}`);
    }
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      m_code: member.m_code.toString(),
      m_name: member.m_name,
      m_phone: member.m_phone
    });
    setShowEditModal(true);
  };

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    
    switch (filterBy) {
      case 'name':
        return member.m_name.toLowerCase().includes(searchTerm.toLowerCase());
      case 'code':
        return member.m_code.toString().includes(searchTerm);
      default:
        return (
          member.m_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.m_code.toString().includes(searchTerm)
        );
    }
  });

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting 
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  // Add this effect to handle modal open/close
  useEffect(() => {
    if (showAddModal) {
      // Get and set the next member code when the modal opens
      getNextMemberCode().then(nextCode => {
        setMemberForm(prev => ({ ...prev, m_code: nextCode.toString() }));
      });
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [showAddModal, getNextMemberCode]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in an input field or any modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showAddModal ||
        showEditModal
      ) {
        return;
      }

      // Open add modal with 'a' key
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, showEditModal]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h3 className="text-2xl font-bold text-white">Member Management</h3>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* Search Controls */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-secondary text-sm">Search members by:</label>
            <div className="flex space-x-0 group focus-within:ring-1 focus-within:ring-border/60 rounded-lg">
              <div className="relative">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as 'all' | 'name' | 'code')}
                  className="h-full px-4 py-2 bg-black border border-r-0 border-green-800 rounded-l-lg text-white text-sm focus:outline-none group-hover:border-green-800 transition-colors"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Member Name</option>
                  <option value="code">Member Code</option>
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
            Add Member
          </button>
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-text-secondary">
            {members.length === 0 
              ? "No members registered yet. Add your first member to get started."
              : "No members match your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="enhanced-blur rounded-xl p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gold text-black px-2 py-1 rounded text-sm font-bold">
                  #{member.m_code}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit Member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete Member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mr-3">
                  <span className="text-black font-bold text-lg">
                    {member.m_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">{member.m_name}</h4>
                  <p className="text-text-secondary text-sm">Member #{member.m_code}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-text-secondary text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.11 10.95l3.93 3.94 1.565-2.109a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {formatPhoneNumber(member.m_phone)}
                </div>
                <div className="flex items-center text-text-secondary text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-6m-6 6V13a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
                  </svg>
                  Member since {new Date(member.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
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
                  <span className="text-black font-sans font-bold text-lg">👥</span>
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Add New Member</h2>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Member Code</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={memberForm.m_code}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, m_code: e.target.value }))}
                      className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                      placeholder="Enter member code"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Suggested code is pre-filled, but you can modify it</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={memberForm.m_name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={memberForm.m_phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, m_phone: formatPhoneInput(e.target.value) }))}
                      className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Enter a 10-digit phone number</p>
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
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => {
                setShowEditModal(false);
                setEditingMember(null);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-sans font-bold text-lg">✏️</span>
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Edit Member</h2>
              </div>

              <form onSubmit={handleEditMember} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Member Code</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={memberForm.m_code}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, m_code: e.target.value }))}
                      className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={memberForm.m_name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={memberForm.m_phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, m_phone: formatPhoneInput(e.target.value) }))}
                      className="w-full px-4 py-3 bg-black border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gold"
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Enter a 10-digit phone number</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
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
                    Update Member
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