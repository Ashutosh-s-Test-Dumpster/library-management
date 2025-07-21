import { ReactNode } from 'react';

interface ModalHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose: () => void;
  className?: string;
}

export default function ModalHeader({
  title,
  description,
  icon,
  onClose,
  className = '',
}: ModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary uppercase tracking-wider truncate">
            {title}
          </h2>
          {description && (
            <p className="text-text-secondary text-xs md:text-sm mt-1">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 border-2 border-border-primary hover:border-accent-error text-text-secondary hover:text-accent-error transition-colors flex items-center justify-center ml-3"
        aria-label="Close modal"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

