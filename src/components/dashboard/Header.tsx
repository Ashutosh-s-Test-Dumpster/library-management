import { Library } from '@/types';

interface HeaderProps {
  currentLibrary: Library | null;
  onSignOut: () => void;
  loading: boolean;
}

export default function Header({ currentLibrary, onSignOut, loading }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 md:left-20 right-0 h-14 md:h-16 border-b-2 border-border-primary bg-bg-secondary z-30 flex items-center px-3 md:px-6">
      <div className="flex-1 min-w-0">
        {currentLibrary && (
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1
              className="text-sm md:text-xl font-bold text-text-primary uppercase tracking-tight truncate"
              style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}
            >
              {currentLibrary.name}
            </h1>
            <div className="hidden md:block flat-badge flat-badge-success text-xs">ACTIVE</div>
            <span className="hidden md:inline text-text-tertiary text-xs font-mono">
              {currentLibrary.id.slice(0, 8)}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onSignOut}
        disabled={loading}
        className="flat-button flat-button-primary text-xs px-2 md:px-4 py-1.5 md:py-2 disabled:opacity-50"
        title={loading ? 'Signing out...' : 'Sign out'}
      >
        <span className="hidden md:inline">{loading ? 'SIGNING OUT...' : 'SIGN OUT'}</span>
        <span className="md:hidden">
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
        </span>
      </button>
    </header>
  );
}

