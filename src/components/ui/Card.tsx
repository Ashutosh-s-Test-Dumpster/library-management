import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  borderAccent?: 'primary' | 'secondary' | 'warning' | 'error' | 'success';
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className = '',
  borderAccent,
  padding = 'md',
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  const borderClasses = {
    primary: 'border-l-2 border-accent-primary',
    secondary: 'border-l-2 border-accent-secondary',
    warning: 'border-l-2 border-accent-warning',
    error: 'border-l-2 border-accent-error',
    success: 'border-l-2 border-accent-success',
  };

  return (
    <div
      className={`flat-card ${paddingClasses[padding]} ${
        borderAccent ? borderClasses[borderAccent] : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

