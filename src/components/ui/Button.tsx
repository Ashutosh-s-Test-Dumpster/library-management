import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'secondary',
  children,
  className = '',
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'flat-button transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'flat-button-primary',
    secondary: '',
    danger: 'border-accent-error text-accent-error hover:bg-accent-error hover:text-bg-primary',
    success: 'border-accent-success text-accent-success hover:bg-accent-success hover:text-bg-primary',
  };
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

