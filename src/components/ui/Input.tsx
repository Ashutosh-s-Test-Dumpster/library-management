import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider font-mono">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`flat-input ${fullWidth ? 'w-full' : ''} ${error ? 'border-accent-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-accent-error text-xs mt-1 font-mono">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-text-tertiary text-xs mt-1 font-mono">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

