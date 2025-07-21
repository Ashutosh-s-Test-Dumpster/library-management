"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Portal from '@/components/Portal';
import type { MemberFilter, Member as MemberType } from '@/types';

interface MemberManagementProps {
  libraryId: string;
}

export default function MemberManagement({ libraryId }: MemberManagementProps) {
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<MemberFilter>('all');

  const [memberForm, setMemberForm] = useState({
    m_code: '',
    m_name: '',
    m_phone: ''
  });

  const getNextMemberCode = async () => {
    try {
      const { data, error } = await supabase
        .from('member_management')
        .select('m_code')
        .eq('library_id', libraryId)
        .order('m_code', { ascending: false })
        .limit(1);

      if (error) throw error;
      const nextCode = data && data.length > 0 ? data[0].m_code + 1 : 1001;
      return nextCode;
    } catch (error) {
      console.error('Error getting next member code:', error);
      return 1001;
    }
  };

  const loadMembers = async () => {
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
  };

  useEffect(() => {
    loadMembers();
  }, [libraryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showAddModal) {
      getNextMemberCode().then(nextCode => {
        setMemberForm(prev => ({ ...prev, m_code: nextCode.toString() }));
      });
    } else {
      resetForm();
    }
  }, [showAddModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showAddModal ||
        showEditModal
      ) {
        return;
      }
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, showEditModal]);

  const resetForm = () => {
    setMemberForm({
      m_code: '',
      m_name: '',
      m_phone: ''
    });
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const validateAndFormatPhone = (phone: string): bigint | null => {
    const rawNumber = phone.replace(/\D/g, '');
    if (rawNumber.length !== 10) return null;
    return BigInt(rawNumber);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const phoneNumber = validateAndFormatPhone(memberForm.m_phone);
    if (phoneNumber === null) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const { data: existingMember } = await supabase
        .from('member_management')
        .select('id')
        .eq('library_id', libraryId)
        .eq('m_code', parseInt(memberForm.m_code))
        .single();

      if (existingMember) {
        alert('A member with this code already exists!');
        return;
      }
      
      const { data, error } = await supabase
        .from('member_management')
        .insert([{
          m_code: parseInt(memberForm.m_code),
          m_name: memberForm.m_name,
          m_phone: phoneNumber.toString(),
          library_id: libraryId
        }])
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => [...prev, data].sort((a, b) => a.m_code - b.m_code));
      setShowAddModal(false);
      resetForm();
      alert('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
      alert(`Failed to add member: ${errorMessage}`);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const phoneNumber = validateAndFormatPhone(memberForm.m_phone);
    if (phoneNumber === null) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
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
          m_phone: phoneNumber.toString()
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
    } catch (error) {
      console.error('Error updating member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member';
      alert(`Failed to update member: ${errorMessage}`);
    }
  };

  const handleDeleteMember = async (member: MemberType) => {
    if (!confirm(`Are you sure you want to delete member "${member.m_name}"?`)) {
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error deleting member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete member';
      alert(`Failed to delete member: ${errorMessage}`);
    }
  };

  const openEditModal = (member: MemberType) => {
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
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-text-secondary font-sans text-sm">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="border-b-2 border-border-primary pb-3 md:pb-4 mb-4 md:mb-6">
        {/* Row 1: Title - Mobile only */}
        <div className="md:hidden mb-3">
          <h3 className="text-lg font-bold text-text-primary uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>MEMBERS</h3>
        </div>
        
        {/* Desktop: Single row layout */}
        <div className="hidden md:flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-text-primary uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>MEMBERS</h3>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-0">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as MemberFilter)}
                className="flat-select border-r-0 text-xs"
              >
                <option value="all">ALL</option>
                <option value="name">NAME</option>
                <option value="code">CODE</option>
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
              onClick={() => setShowAddModal(true)}
              className="flat-button flat-button-primary text-xs px-4 py-2 whitespace-nowrap"
            >
              + ADD
            </button>
          </div>
        </div>

        {/* Mobile: 3 rows layout */}
        <div className="md:hidden space-y-3">
          {/* Row 2: Search and Filter */}
          <div className="flex space-x-0">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as MemberFilter)}
              className="flat-select border-r-0 text-xs"
            >
              <option value="all">ALL</option>
              <option value="name">NAME</option>
              <option value="code">CODE</option>
            </select>
            
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flat-input flex-1 border-l-0 text-xs"
            />
          </div>
          
          {/* Row 3: Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flat-button flat-button-primary text-xs px-4 py-2 w-full"
          >
            + ADD MEMBER
          </button>
        </div>
      </div>

      {/* Members - Asymmetric Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-border-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-text-tertiary font-mono text-2xl">MB</span>
            </div>
            <p className="text-text-secondary font-sans text-xs md:text-sm">
              {members.length === 0 
                ? "NO MEMBERS REGISTERED YET. ADD YOUR FIRST MEMBER TO GET STARTED."
                : "NO MEMBERS MATCH YOUR SEARCH CRITERIA."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
            {filteredMembers.map((member, index) => (
            <div 
              key={member.id} 
              className="flat-card p-4 md:p-6 stagger-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flat-badge flat-badge-primary text-[10px] md:text-xs">#{member.m_code}</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="text-accent-primary hover:text-accent-secondary transition-colors w-6 h-6 flex items-center justify-center border border-border-primary hover:border-accent-primary"
                    title="Edit Member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="text-accent-error hover:text-accent-error/80 transition-colors w-6 h-6 flex items-center justify-center border border-border-primary hover:border-accent-error"
                    title="Delete Member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-accent-secondary flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                  <span className="text-accent-secondary font-mono font-bold text-xs md:text-sm">
                    {member.m_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-text-primary font-semibold text-sm md:text-base truncate">{member.m_name}</h4>
                  <p className="text-text-secondary text-[10px] md:text-xs font-mono">#{member.m_code}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-text-secondary text-[10px] md:text-xs">
                  <svg className="w-3 h-3 mr-1.5 md:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.11 10.95l3.93 3.94 1.565-2.109a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-mono truncate">{formatPhoneNumber(member.m_phone)}</span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Add Member Modal - Centered */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md flat-card border-2 border-border-accent p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in">
              <button
                onClick={() => {
                  setShowAddModal(false);
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
                  <span className="text-accent-primary font-mono font-bold text-2xl">MB</span>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">ADD NEW MEMBER</h2>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">MEMBER CODE</label>
                  <input
                    type="number"
                    value={memberForm.m_code}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_code: e.target.value }))}
                    className="flat-input w-full"
                    placeholder="Enter member code"
                    required
                  />
                  <p className="mt-1 text-sm text-text-tertiary font-mono">Suggested code is pre-filled</p>
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">FULL NAME</label>
                  <input
                    type="text"
                    value={memberForm.m_name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_name: e.target.value }))}
                    className="flat-input w-full"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={memberForm.m_phone}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_phone: formatPhoneInput(e.target.value) }))}
                    className="flat-input w-full"
                    placeholder="(XXX) XXX-XXXX"
                    maxLength={14}
                    required
                  />
                  <p className="mt-1 text-sm text-text-tertiary font-mono">Enter a 10-digit phone number</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 flat-button py-3"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flat-button flat-button-primary py-3"
                  >
                    ADD MEMBER
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Member Modal - Centered */}
      {showEditModal && editingMember && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md modal-backdrop" 
              onClick={() => {
                setShowEditModal(false);
                setEditingMember(null);
                resetForm();
              }}
            ></div>
            
            <div className="relative w-full max-w-md flat-card border-2 border-border-accent p-8 overflow-y-auto max-h-[90vh] animate-rigid-pop-in">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-text-secondary hover:text-accent-error transition-colors w-8 h-8 flex items-center justify-center border border-border-primary hover:border-accent-error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 border-2 border-accent-secondary flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-secondary font-mono font-bold text-2xl">✎</span>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">EDIT MEMBER</h2>
              </div>

              <form onSubmit={handleEditMember} className="space-y-4">
                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">MEMBER CODE</label>
                  <input
                    type="number"
                    value={memberForm.m_code}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_code: e.target.value }))}
                    className="flat-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">FULL NAME</label>
                  <input
                    type="text"
                    value={memberForm.m_name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_name: e.target.value }))}
                    className="flat-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={memberForm.m_phone}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, m_phone: formatPhoneInput(e.target.value) }))}
                    className="flat-input w-full"
                    placeholder="(XXX) XXX-XXXX"
                    maxLength={14}
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                      resetForm();
                    }}
                    className="flex-1 flat-button py-3"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flat-button border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-bg-primary py-3"
                  >
                    UPDATE MEMBER
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
