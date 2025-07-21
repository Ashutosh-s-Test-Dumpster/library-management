import { DashboardTab } from '@/types';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLibraryManagerClick: () => void;
  userInitials: string;
  userAvatar?: string | null;
}

const TABS = [
  { key: 'overview' as const, label: 'OV', icon: '▣' },
  { key: 'books' as const, label: 'BK', icon: '▤' },
  { key: 'members' as const, label: 'MB', icon: '▥' },
  { key: 'issues' as const, label: 'IS', icon: '▦' },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onLibraryManagerClick,
  userInitials,
  userAvatar,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 border-r-2 border-border-primary bg-bg-secondary z-40 flex-col items-center py-6">
      <div
        className="w-14 h-14 border-2 border-accent-primary flex items-center justify-center mb-8"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
      >
        <span className="text-accent-primary font-mono font-bold text-xs">B</span>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`w-14 h-14 border-2 flex flex-col items-center justify-center transition-all ${
              activeTab === tab.key
                ? 'border-accent-primary bg-bg-tertiary'
                : 'border-border-primary hover:border-accent-primary/50'
            }`}
            style={activeTab === tab.key ? { boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' } : {}}
            title={tab.key.toUpperCase()}
          >
            <span className="text-xs font-mono text-text-secondary mb-1">{tab.icon}</span>
            <span
              className={`text-xs font-mono font-bold ${
                activeTab === tab.key ? 'text-accent-primary' : 'text-text-tertiary'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onLibraryManagerClick}
        className="w-14 h-14 border-2 border-border-primary hover:border-accent-primary flex items-center justify-center transition-all mb-4"
      >
        <span className="text-accent-primary font-bold text-xl">+</span>
      </button>

      <div className="w-10 h-10 border-2 border-accent-primary flex items-center justify-center">
        {userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatar}
            alt="User avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-accent-primary text-xs font-mono font-bold">${userInitials}</div>`;
              }
            }}
          />
        ) : (
          <span className="text-accent-primary font-mono font-bold text-xs">{userInitials || 'U'}</span>
        )}
      </div>
    </aside>
  );
}

