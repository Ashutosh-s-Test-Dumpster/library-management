import { Library, LibraryStats, RecentData, DashboardTab } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface OverviewTabProps {
  library: Library;
  stats: LibraryStats;
  recentData: RecentData;
  onTabChange: (tab: DashboardTab) => void;
}

export default function OverviewTab({
  library,
  stats,
  recentData,
  onTabChange,
}: OverviewTabProps) {
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2
          className="text-xl md:text-3xl font-bold text-text-primary mb-2 uppercase tracking-tight"
          style={{ textShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
        >
          {library.name}
        </h2>
        {library.description && (
          <p className="text-text-secondary text-xs md:text-sm font-sans">{library.description}</p>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card borderAccent="primary" padding="md">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">
              BOOKS
            </span>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-accent-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-accent-primary font-mono mb-1">
            {stats.totalBooks}
          </div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">
            {stats.availableBooks} avail • {stats.activeIssues} issued
          </div>
        </Card>

        <Card borderAccent="secondary" padding="md">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">
              MEMBERS
            </span>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-accent-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-accent-secondary font-mono mb-1">
            {stats.totalMembers}
          </div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">
            {stats.totalMembers > 0
              ? Math.round((stats.activeIssues / stats.totalMembers) * 10) / 10
              : 0}{' '}
            avg
          </div>
        </Card>

        <Card borderAccent="warning" padding="md">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">
              ISSUES
            </span>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-accent-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-accent-warning font-mono mb-1">
            {stats.activeIssues}
          </div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">
            {stats.returnedIssues} ret •{' '}
            {stats.totalBooks > 0 ? Math.round((stats.activeIssues / stats.totalBooks) * 100) : 0}%
          </div>
        </Card>

        <Card borderAccent="error" padding="md">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-text-tertiary text-[10px] md:text-xs uppercase tracking-wider font-mono">
              OVERDUE
            </span>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-accent-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-accent-error font-mono mb-1">
            {stats.overdueBooks}
          </div>
          <div className="text-text-secondary text-[10px] md:text-xs font-mono">
            {stats.activeIssues > 0
              ? Math.round((stats.overdueBooks / stats.activeIssues) * 100)
              : 0}
            %
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats.overdueBooks > 0 && (
        <Card className="mb-6 md:mb-8 border-2 border-accent-error bg-bg-tertiary" padding="md">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-accent-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-accent-error font-bold uppercase tracking-wider mb-2 text-xs md:text-sm font-mono">
                OVERDUE ALERT
              </h3>
              <p className="text-text-primary text-xs md:text-sm mb-3">
                {stats.overdueBooks} {stats.overdueBooks === 1 ? 'book is' : 'books are'} overdue.
              </p>
              <Button
                variant="danger"
                onClick={() => onTabChange('issues')}
                className="text-xs px-3 md:px-4 py-1.5 md:py-2 w-full md:w-auto"
              >
                VIEW ISSUES
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Books */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-xs md:text-sm font-bold text-accent-primary uppercase tracking-wider font-mono">
              RECENT BOOKS
            </h3>
            <button
              onClick={() => onTabChange('books')}
              className="text-text-tertiary hover:text-accent-primary text-[10px] md:text-xs font-mono transition-colors"
            >
              ALL →
            </button>
          </div>
          {recentData.recentBooks.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {recentData.recentBooks.map((book) => (
                <div key={book.b_code} className="border-l-2 border-border-primary pl-2 md:pl-3 py-1.5 md:py-2">
                  <p className="text-text-primary text-xs md:text-sm font-medium truncate">
                    {book.b_name}
                  </p>
                  <p className="text-text-secondary text-[10px] md:text-xs font-mono mt-0.5 md:mt-1">
                    {book.b_author}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary text-[10px] md:text-xs font-mono">No books yet</p>
          )}
        </Card>

        {/* Recent Members */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-xs md:text-sm font-bold text-accent-secondary uppercase tracking-wider font-mono">
              RECENT MEMBERS
            </h3>
            <button
              onClick={() => onTabChange('members')}
              className="text-text-tertiary hover:text-accent-secondary text-[10px] md:text-xs font-mono transition-colors"
            >
              ALL →
            </button>
          </div>
          {recentData.recentMembers.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {recentData.recentMembers.map((member) => (
                <div key={member.m_code} className="border-l-2 border-border-primary pl-2 md:pl-3 py-1.5 md:py-2">
                  <p className="text-text-primary text-xs md:text-sm font-medium truncate">
                    {member.m_name}
                  </p>
                  <p className="text-text-secondary text-[10px] md:text-xs font-mono mt-0.5 md:mt-1">
                    {member.m_phone || 'No phone'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary text-[10px] md:text-xs font-mono">No members yet</p>
          )}
        </Card>

        {/* Recent Activity */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-xs md:text-sm font-bold text-accent-warning uppercase tracking-wider font-mono">
              ACTIVITY
            </h3>
            <button
              onClick={() => onTabChange('issues')}
              className="text-text-tertiary hover:text-accent-warning text-[10px] md:text-xs font-mono transition-colors"
            >
              ALL →
            </button>
          </div>
          {recentData.recentIssues.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {recentData.recentIssues.map((issue, idx) => (
                <div key={idx} className="border-l-2 border-border-primary pl-2 md:pl-3 py-1.5 md:py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] md:text-xs font-mono px-1.5 md:px-2 py-0.5 ${
                        issue.i_date_of_ret
                          ? 'bg-accent-success/20 text-accent-success border border-accent-success'
                          : 'bg-accent-warning/20 text-accent-warning border border-accent-warning'
                      }`}
                    >
                      {issue.i_date_of_ret ? 'RET' : 'ISS'}
                    </span>
                  </div>
                  <p className="text-text-primary text-xs md:text-sm font-medium truncate mt-0.5 md:mt-1">
                    {issue.book?.b_name || 'Unknown'}
                  </p>
                  <p className="text-text-secondary text-[10px] md:text-xs font-mono mt-0.5 md:mt-1">
                    {issue.member?.m_name || 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary text-[10px] md:text-xs font-mono">No activity yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}

