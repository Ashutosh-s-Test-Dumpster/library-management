// Tab constants
export const DASHBOARD_TABS = ['overview', 'books', 'members', 'issues'] as const;
export const ISSUE_TABS = ['active', 'returned', 'all'] as const;

// Filter constants
export const BOOK_FILTERS = ['all', 'name', 'author', 'code'] as const;
export const MEMBER_FILTERS = ['all', 'name', 'code'] as const;

// Entry mode constants
export const ENTRY_MODES = ['isbn', 'manual'] as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  ADD: 'a',
  ESCAPE: 'Escape',
} as const;

// Validation constants
export const VALIDATION = {
  LIBRARY_NAME_MIN_LENGTH: 3,
  LIBRARY_NAME_MAX_LENGTH: 100,
  LIBRARY_DESCRIPTION_MAX_LENGTH: 500,
  MEMBER_CODE_START: 1001,
  DELETE_CONFIRMATION_TEXT: 'DELETE',
} as const;

export const DELETE_CONFIRMATION_TEXT = VALIDATION.DELETE_CONFIRMATION_TEXT;

// Date constants
export const OVERDUE_DAYS = 14;

// UI constants
export const MODAL_ANIMATION = 'animate-rigid-pop-in';
export const BACKDROP_CLASSES = 'bg-black/80 backdrop-blur-md modal-backdrop';
export const MODAL_Z_INDEX = 100;
export const MODAL_BACKDROP_Z_INDEX = 101;

// Feature data for landing page
export const FEATURES = [
  {
    id: 'books',
    title: 'BOOK MANAGEMENT',
    description: 'Organize and catalog your entire collection with detailed metadata, search capabilities, and inventory tracking.',
    icon: '📚',
  },
  {
    id: 'members',
    title: 'MEMBER MANAGEMENT',
    description: 'Maintain comprehensive member profiles, track borrowing history, and manage member relationships efficiently.',
    icon: '👥',
  },
  {
    id: 'issues',
    title: 'ISSUE TRACKING',
    description: 'Monitor book loans, track due dates, handle returns, and generate reports on library activity.',
    icon: '📋',
  },
] as const;

