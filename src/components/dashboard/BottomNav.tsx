import { DashboardTab } from '@/types';

interface BottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLibraryManagerClick: () => void;
}

const TABS = [
  { key: 'overview' as const, label: 'OV', icon: '▣' },
  { key: 'books' as const, label: 'BK', icon: '▤' },
  { key: 'members' as const, label: 'MB', icon: '▥' },
  { key: 'issues' as const, label: 'IS', icon: '▦' },
];

export default function BottomNav({
  activeTab,
  onTabChange,
  onLibraryManagerClick,
}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t-2 border-border-primary bg-bg-secondary z-40 flex items-center justify-around px-2">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-all ${
            activeTab === tab.key ? 'text-accent-primary' : 'text-text-tertiary'
          }`}
        >
          <span className="text-xs font-mono mb-0.5">{tab.icon}</span>
          <span className="text-[10px] font-mono font-bold">{tab.label}</span>
        </button>
      ))}
      <button
        onClick={onLibraryManagerClick}
        className="flex-1 h-full flex flex-col items-center justify-center text-accent-primary"
      >
        <span className="text-lg font-bold">+</span>
        <span className="text-[10px] font-mono">LIB</span>
      </button>
    </nav>
  );
}

